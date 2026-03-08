# KB_NPA_Templates.md
## Complete NPA Form Templates & Field Definitions

**Document Version:** 2.0
**Last Updated:** February 19, 2026
**Purpose:** Comprehensive template specifications for LLM agents to auto-fill and validate NPA forms
**Source of Truth:** NPA Business Process Deep Knowledge Report (2026-02-18), Architecture Gap Register (44 rules R01-R44)
**Base Template:** RMG OR Version Jun 2025 — 47 base fields (Part A/B/C structure)

---

## Table of Contents

1. [Template Overview & Usage](#1-template-overview--usage)
2. [Full NPA Template (Master)](#2-full-npa-template-master)
3. [NPA Lite Template (Simplified)](#3-npa-lite-template-simplified)
4. [Bundling NPA Template](#4-bundling-npa-template)
5. [Field Definitions & Validation Rules](#5-field-definitions--validation-rules)
6. [Auto-Fill Logic & Data Sources](#6-auto-fill-logic--data-sources)
7. [Template Selection Decision Tree](#7-template-selection-decision-tree)
8. [Real NPA Reference Examples](#8-real-npa-reference-examples)

---

## 1. Template Overview & Usage

### 1.1 Template Types

**Base Template:** The official RMG OR template (Version Jun 2025) defines **47 base fields** across a Part A/B/C structure. This KB expands compound fields into discrete sub-fields for LLM auto-fill granularity, producing 65+ fields for Full NPA.

**IMPORTANT — 47 vs 65+ Field Count:**
- **47 fields** = official RMG OR base template (canonical count used across all system references)
- **65+ fields** = expanded granular fields for LLM auto-fill (compound fields split into sub-fields)
- **40+ fields** = NPA Lite (reduced set from 47 base)
- **75+ fields** = Bundling (47 base + bundling-specific sections)

**Three Primary Templates:**

| Template Type | When to Use | Complexity | Base Fields | Expanded Fields |
|---------------|-------------|------------|-------------|-----------------|
| **Full NPA** | NTG products, High-risk variations, Cross-border, >$50M notional | High | 47 | 65+ |
| **NPA Lite** | Low-risk variations, Existing products (new location), Dormant <3 years | Medium | ~35 | 40+ |
| **Bundling** | Multiple products combined (FX + IRS + Commodity) | High | 47 + bundling | 75+ |

---

### 1.2 Official Document Structure (Part A/B/C)

**All NPA templates follow the RMG OR Part A/B/C wrapper structure:**

```
PART A: Basic Product Information (6 fields)
  - Product/Service Name
  - Business Units Covered
  - Product Manager and Group Head details
  - Business Case Approval Status
  - NPA or NPA Lite classification
  - Kick-off Meeting Date

PART B: Sign-Off Parties (dynamic — varies by track and classification)
  - All required SOPs listed
  - Each SOP sign-off status tracked
  - Cross-border mandatory SOPs flagged

PART C: Detailed Product Information (Sections I-VII + Appendices I-VII)
  SECTION I: Product Specifications (Description, Scope, Volume, Revenue, Customers, Commercialization)
  SECTION II: Operational & Technology Information (Operating Model, Booking, Procedures, Limits, BCM)
  SECTION III: Pricing Model Details (Model validation, SIMM treatment)
  SECTION IV: Risk Analysis
    IV.A: Operational Risk (Legal/Compliance, Financial Crime, Finance/Tax)
    IV.B: Market & Liquidity Risk (IR/FX/EQ Delta/Vega, CS01, VaR, LCR/NSFR, HQLA)
    IV.C: Credit Risk (Counterparty, country, concentration, PCE, SACCR)
    IV.D: Reputational Risk (ESG, step-in risk, regulatory exposure)
  SECTION V: Data Management (D4D, PURE principles, Risk Data Aggregation)
  SECTION VI: Other Risk Identification (conduct risk, model risk, concentration, emerging risks)
  SECTION VII: Trading Products Specific (collateral/pledged assets, valuation/funding, booking schemas)
  APPENDIX I: Bundling Approval Form (8-condition checklist)
  APPENDIX II: Entity/Location Information (legal entities, cross-border, transfer pricing)
  APPENDIX III: ROAE Sensitivity Analysis (mandatory if notional >$20M)
  APPENDIX IV: Intellectual Property (proprietary models, third-party licenses)
  APPENDIX V: Financial Crime Risk Areas (AML/KYC, sanctions, fraud)
  APPENDIX VI: Risk Data Aggregation and Reporting Requirements
  APPENDIX VII: Evergreen FAQ/Checklist (limits, trading workflow, annual review)
```

---

### 1.3 Auto-Fill Capabilities

**Template Auto-Fill Engine Coverage:**
- **Full NPA:** 78% average auto-fill (37/47 base fields, 51/65 expanded)
- **NPA Lite:** 85% average auto-fill (34/40 fields)
- **Bundling:** 70% average auto-fill (53/75 fields)

**Manual Input Always Required (cannot auto-fill):**
1. Specific counterparty name (deal-specific)
2. Exact trade date (future event)
3. Unique product features (bespoke)
4. Custom risk mitigants (judgment-based)
5. Special legal provisions (negotiated)
6. Desk-specific operational procedures (unit-specific)
7. Bespoke pricing adjustments (judgment-based)

---

## 2. Full NPA Template (Master)

### PART A: Basic Product Information

**Purpose:** Identify the product and its NPA classification context (6 fields)

---

#### Field A.1: Product/Service Name
- **Type:** Text (required)
- **Max Length:** 200 characters
- **Example:** `FX Put Option GBP/USD with Knock-Out Barrier`
- **Auto-Fill Logic:** If similar NPA found (>80% similarity) → Suggest product name
- **Validation:** Must be non-empty, descriptive

---

#### Field A.2: Business Units Covered
- **Type:** Multi-select (required)
- **Options:** [Populated from org hierarchy — Singapore Trading, HK Fixed Income, London Derivatives, etc.]
- **Auto-Fill Logic:** Current user's desk from user profile
- **Validation:** At least one BU selected

---

#### Field A.3: Product Manager and Group Head Details
- **Type:** Structured input (required)
- **Sub-fields:** Product Manager Name/Email, Group Head Name/Email
- **Auto-Fill Logic:** Org hierarchy lookup based on BU

---

#### Field A.4: Business Case Approval Status
- **Type:** Dropdown (required)
- **Options:** PAC Approved, PAC Not Required, Pending PAC
- **CRITICAL GATE [R16]:** If `npa_type = 'New-to-Group'` → PAC approval MUST be 'Approved' BEFORE NPA starts
- **Validation:** If NTG and PAC ≠ Approved → BLOCK NPA submission

---

#### Field A.5: NPA or NPA Lite Classification
- **Type:** Auto-filled (read-only)
- **Options:** Full NPA, NPA Lite (B1/B2/B3/B4), Bundling, Evergreen
- **Auto-Fill Logic:** Classification Router Agent output

---

#### Field A.6: Kick-off Meeting Date
- **Type:** Date picker (required)
- **Validation:** Must be ≤ today

---

### PART B: Sign-Off Parties

**Purpose:** Define required approvers (dynamic based on classification and track)

---

#### Field B.1: Required Sign-Off Parties
- **Type:** Auto-populated table (read-only, from Approval Matrix)
- **Dynamic Assignment Logic [R19, R20, R21, R22]:**
  - Full NPA → ALL 7 SOPs: Credit, Finance, Legal & Compliance, MLR, Operations, Technology, RMG-OR
  - NPA Lite → Reduced set based on risk areas (typically 2-3 SOPs)
  - **Cross-border override [R07]:** If `is_cross_border = true` → Finance, Credit, MLR, Tech, Ops are MANDATORY and CANNOT be waived
  - **NTG from overseas [R22]:** If jurisdictions include non-SG + NTG → Head Office function sign-offs required
  - Non-NTG core markets → Location-level sign-off party
  - Non-NTG international centres → Location or Head Office (Group SU Head discretion)
- **Columns:**
  - Department
  - Approver Level (Analyst, VP, Head, etc.)
  - Approver Name (auto-assigned or manual)
  - Sign-Off Status (Pending, Approved, Approved_Conditional, Rejected, Changes_Requested)
  - Sign-Off Date
  - Conditions Imposed (permanent restrictions, product parameters, post-launch conditions)
  - SLA Deadline (auto-set: assignment time + 48 hours)
- **SOP Authority [R23, R24]:** Each SOP can set:
  - **Permanent restrictions** (incorporated into product features)
  - **Product parameters** (scope of permissible activity, e.g., specific client segment only)
  - **Post-launch conditions** (short-term, measurable, to be addressed after launch)

---

#### Field B.2: Approval Timeline SLA
- **Type:** Auto-calculated display (read-only)
- **Logic:**
  - Full NPA → 7-12 business days
  - NPA Lite → 4-5 business days
  - NPA Lite B1 (Impending Deal) → 48 hours
  - NPA Lite B3 (Fast-Track Dormant) → 48 hours
  - NPA Lite B4 (Addendum) → <5 business days
  - Bundling → 8-10 business days
  - Evergreen → <1 hour (auto-approved if within limits)
- **SLA Per Approver:** 48 hours [R37]
- **Approval Mode:** Parallel (all approvers notified simultaneously)

---

### PART C: Detailed Product Information

### SECTION I: Product Specifications (Basic Information)

**Purpose:** Define the product and its business context

---

#### Field 1.1: NPA ID
- **Type:** Auto-generated (read-only)
- **Format:** `[DESK_CODE][YEAR]-[SEQUENCE]`
- **Example:** `TSG2025-042` (Singapore Trading Desk, 2025, 42nd NPA)
- **Auto-Fill Logic:** System generates on NPA creation
- **Validation:** Must be unique, format regex `^[A-Z]{2,4}[0-9]{4}-[0-9]{3}$`

---

#### Field 1.2: Product Name
- **Type:** Text (required)
- **Max Length:** 200 characters
- **Example:** `FX Put Option GBP/USD with Knock-Out Barrier`
- **Auto-Fill Logic:**
  - If similar NPA found (>80% similarity) → Suggest product name
  - Pattern: `[Product Type] [Underlying] [Key Features]`
- **Guidance:** Use descriptive name that clearly identifies product structure

---

#### Field 1.3: Product Type
- **Type:** Dropdown (required)
- **Options:**
  - Foreign Exchange (FX)
    - FX Forward
    - FX Option (Vanilla)
    - FX Option (Exotic/Barrier)
    - FX Swap
    - Non-Deliverable Forward (NDF)
  - Interest Rate Derivatives
    - Interest Rate Swap (IRS)
    - Interest Rate Option (Cap/Floor/Swaption)
    - Forward Rate Agreement (FRA)
  - Credit Derivatives
    - Credit Default Swap (CDS)
    - Total Return Swap (TRS)
    - Credit-Linked Note (CLN)
  - Equity Derivatives
    - Equity Option
    - Equity Swap
    - Equity-Linked Note
  - Commodity Derivatives
    - Commodity Swap
    - Commodity Option
    - Commodity Forward
  - Fixed Income
    - Corporate Bond
    - Government Bond
    - Structured Note
  - Structured Products
    - Dual Currency Deposit (DCD)
    - Equity-Linked Deposit
    - Range Accrual Note
  - Fund Products
    - Mutual Fund
    - ETF Subscription
    - Hedge Fund Investment
  - Other (specify)
- **Auto-Fill Logic:** Classification Router Agent determines product type from Phase 0 interview
- **Validation:** Must select one primary type

---

#### Field 1.4: Product Classification
- **Type:** Dropdown (auto-filled, read-only)
- **Options:**
  - New-to-Group (NTG)
  - Variation
  - Existing - Active (referenced from another location)
  - Existing - Dormant (<1 year)
  - Existing - Dormant (1-3 years)
  - Existing - Dormant (≥3 years)
  - Existing - Expired (no variations)
  - Existing - Expired (with variations)
  - Existing - Evergreen
- **Auto-Fill Logic:** Classification Router Agent Stage 1 output [R02]
- **NTG Triggers [R03]:** ANY of the following → NTG:
  - Brand new product, instrument, or financial service
  - New role within product group (e.g., distribution → principal trading)
  - New distribution channel (e.g., first time via mobile app)
  - New customer segment (e.g., institutional → retail)
  - New exchange membership (e.g., first time on SGX)
  - New market/geography (e.g., first time in Vietnam)
- **Variation Triggers [R04]:** ANY of the following → Variation:
  - Bundling/combination of existing products
  - Cross-book structures (banking book + trading book)
  - Accounting treatment changes (accrual → mark-to-market)
  - Significant offline/manual workarounds
  - Sustainability/ESG features or labels
  - Advanced/innovative technology (fintech collaboration)
  - New third-party communication channels
- **Existing Sub-Categories [R05]:**
  - New to location/desk/entity
  - Dormant: <1yr, 1-3yr, ≥3yr (different routing per tier)
  - Expired: with/without variations
- **Validation:** Cannot be changed after approval

---

#### Field 1.5: Approval Track
- **Type:** Dropdown (auto-filled, read-only)
- **Options:**
  - Full NPA
  - NPA Lite - B1 Impending Deal (48-hour express)
  - NPA Lite - B2 NLNOC (No Objection Concurrence)
  - NPA Lite - B3 Fast-Track Dormant (48-hour)
  - NPA Lite - B4 Addendum (minor changes, <5 days)
  - Bundling
  - Evergreen (auto-approved if within limits)
- **Auto-Fill Logic:** Classification Router Agent Stage 2 output
- **ENFORCEMENT [R11]:** If `classification = NTG` → `track` MUST be `Full NPA`. No exceptions. DB constraint enforced.
- **Validation:** Cannot be changed after classification

---

#### Field 1.6: Proposing Desk/Business Unit
- **Type:** Dropdown (required)
- **Options:** [Populated from org hierarchy]
  - Singapore Trading Desk
  - Hong Kong Fixed Income
  - London Derivatives
  - India Corporate Advisory
  - [etc.]
- **Auto-Fill Logic:** Current user's desk from user profile
- **Validation:** Must be valid BU code

---

#### Field 1.7: Maker (Proposing Officer)
- **Type:** User lookup (auto-filled)
- **Format:** Name, Email, Employee ID
- **Example:** `Sarah Lee, sarah.lee@mbs.com, EMP12345`
- **Auto-Fill Logic:** Current logged-in user
- **Validation:** Must be active employee

---

#### Field 1.8: NPA Champion
- **Type:** User lookup (auto-filled)
- **Format:** Name, Email, Employee ID
- **Example:** `John Tan, john.tan@mbs.com, EMP67890`
- **Auto-Fill Logic:** Desk/BU NPA Champion from org hierarchy
- **Validation:** Must be designated NPA Champion

---

#### Field 1.9: Target Customer Segment
- **Type:** Multi-select checkbox (required)
- **Options:**
  - Institutional (Banks, Asset Managers, Pension Funds)
  - Corporate (Large Cap, Mid Cap, SME)
  - High Net Worth Individuals (HNWI)
  - Private Banking (Accredited Investors)
  - Retail (Mass Market)
  - Treasury (MBS Group internal)
- **Auto-Fill Logic:**
  - If similar NPA found → Suggest customer segment
  - If product type = structured note → Default to HNWI + Private Banking
- **Guidance:** Select ALL applicable segments
- **Validation:** At least one must be selected

---

#### Field 1.10: Business Rationale
- **Type:** Long text (required)
- **Min Length:** 100 characters
- **Max Length:** 2000 characters
- **Example:**
  ```
  ABC Corporation (Hong Kong, A- rated) requests GBP/USD put option
  to hedge anticipated GBP receivables from UK subsidiary sale.
  Client expects GBP weakness vs USD over 6-month period.
  Product allows downside protection while retaining upside if GBP strengthens.
  Estimated revenue: $150K (option premium). Strategic client relationship.
  ```
- **Auto-Fill Logic:**
  - If similar NPA → Adapt rationale text
  - Pattern: `[Counterparty] requests [product] to [hedge/speculate] [underlying exposure]. Estimated revenue: [amount].`
- **Guidance:** Explain: (1) Customer need, (2) Product fit, (3) Revenue expectation, (4) Strategic importance

---

#### Field 1.11: Expected Transaction Volume
- **Type:** Structured input (required)
- **Sub-fields:**
  - **Volume (Deals):** Numeric
  - **Frequency:** Dropdown (Daily, Weekly, Monthly, Quarterly, Annual, One-Time)
  - **Notional per Deal (USD Equivalent):** Numeric with currency
  - **Total Aggregate Notional (Annual, USD):** Numeric (auto-calculated)
- **Evergreen Limit Validation [R43, R44]:**

| Limit Type | Amount | Notes |
|------------|--------|-------|
| **Total Notional** (GFM-wide) | USD $500,000,000 | Aggregated across all Evergreen trades |
| **Long Tenor (>10Y) Notional** (sub-limit) | USD $250,000,000 | Subset of total |
| **Non-Retail Deal Cap** (per NPA) | 10 deals | Per NPA product |
| **Retail Deal Cap** (per NPA) | 20 deals | Per NPA product |
| **Retail Transaction Size** (per trade) | USD $25,000,000 | Single trade max |
| **Retail Aggregate Notional** (sub-limit) | USD $100,000,000 | Subset of total |

- **Special exemption [R44]:** Liquidity management products → notional and trade count caps WAIVED due to exigency
- **Counting rule:** Only customer leg counts (BTB/hedge leg excluded). Bond issuance deal count = tranche count = client-facing deals.
- **Auto-Fill Logic:**
  - If similar NPA → Copy volume assumptions
  - If Evergreen → Check against Evergreen limits table above
- **Validation:**
  - If Evergreen: Aggregate ≤ $500M, Non-Retail Deals ≤ 10/month, Retail Deals ≤ 20/month
  - If aggregate >$100M → Escalate to CFO approval [R42]

---

#### Field 1.12: Revenue Projection
- **Type:** Structured input (required)
- **Sub-fields:**
  - **Revenue Per Deal:** Numeric (USD)
  - **Total Annual Revenue:** Numeric (USD, auto-calculated)
  - **Revenue Sources:** Multi-select (Spread, Premium, Fee, Commission, Other)
  - **ROAE (Return on Allocated Equity):** Percentage
- **Auto-Fill Logic:**
  - If similar NPA → Copy revenue structure
  - If ROAE not provided → Prompt user "Finance typically requires ROAE for >$20M products"
- **Notional Threshold Escalation [R40, R41, R42]:**

| Notional Value | Additional Requirement | Escalation |
|---------------|----------------------|------------|
| > $20M | ROAE sensitivity analysis REQUIRED | Upload to Appendix III |
| > $50M | Finance VP review REQUIRED | Auto-add Finance VP to sign-off parties |
| > $100M | CFO review REQUIRED | Auto-add CFO to sign-off parties |

- **Validation:**
  - If ROAE <5.0% → Warning: "Below minimum ROAE threshold, Finance may reject"
  - If notional >$20M → ROAE sensitivity MANDATORY (Appendix III)
  - If notional >$50M → Finance VP automatically added to sign-off matrix
  - If notional >$100M → CFO automatically added to sign-off matrix

---

#### Field 1.13: PAC Approval (NTG Products Only)
- **Type:** Conditional section (only visible if Product Classification = NTG)
- **CRITICAL GATE [R16]:** PAC approval MUST be obtained BEFORE NPA starts for NTG products. This is a Group requirement. NPA submission is BLOCKED until `pac_approval_status = 'Approved'`.
- **Sub-fields:**
  - **PAC Approval Date:** Date picker (required for NTG)
  - **PAC Approval Reference:** Text (meeting minutes reference)
  - **PAC Conditions Imposed:** Long text (list any conditions from PAC)
- **Example:**
  ```
  PAC Approval Date: 2025-11-15
  PAC Approval Reference: PAC Meeting Minutes 2025-11-15, Item 3.2
  PAC Conditions:
  1. Limit to institutional clients only (no retail)
  2. Maximum notional per deal: $50M
  3. PIR required within 6 months of first trade
  ```
- **Auto-Fill Logic:** N/A (manual entry after PAC meeting)
- **Validation:**
  - If NTG → PAC approval date MUST be before NPA submission date [R16]
  - If PAC conditions → Flag for tracking in PIR
  - **HARD GATE:** System BLOCKS NPA initiation if NTG and PAC ≠ Approved

---

#### Field 1.14: Justification for NPA Lite (if NPA Lite selected)
- **Type:** Conditional long text (only visible if Approval Track = NPA Lite)
- **Min Length:** 50 characters
- **Example:**
  ```
  This is a standard FX Forward product, already approved in Singapore
  (TSG1917). Reactivating for Hong Kong location with no variations.
  Dormant period: 18 months (<3 years). All risk assessments completed
  in original NPA. No new technology or operational requirements.
  ```
- **Auto-Fill Logic:**
  - Pattern: `Standard [product type], approved in [location] ([Reference NPA ID]). [Reason for Lite track].`
- **Guidance:** Explain why Full NPA not required (reference existing approval, low risk, no variations)

---

#### Field 1.15: Involvement of External Parties
- **Type:** Structured input (required)
- **Sub-fields:**
  - **External Parties Involved?:** Yes/No radio button
  - **If Yes, specify:**
    - **Party Name:** Text
    - **Party Role:** Dropdown (Fintech Partner, Data Vendor, Third-Party Administrator, Legal Counsel, Other)
    - **Nature of Involvement:** Long text
    - **Risk Assessment Completed?:** Yes/No
- **Auto-Fill Logic:**
  - If product type = structured/exotic → Prompt: "Typically requires external legal counsel"
  - If similar NPA used external party → Suggest same party
- **Validation:** If external party = NEW vendor → RMG-OR review required

---

### SECTION II: Operational & Technology Information

**Purpose:** Define operational workflow, systems, and technology requirements

---

#### Field 2.1: Booking System
- **Type:** Multi-select checkbox (required)
- **Options:**
  - Murex (Primary trading system)
  - Calypso (Secondary system)
  - Bloomberg Terminal
  - Reuters Eikon
  - Summit (Loans system)
  - Manual (Excel-based)
  - Other (specify)
- **Auto-Fill Logic:**
  - Based on product type:
    - FX/IRS/CDS → Murex
    - Fixed Income → Summit or Murex
    - Equity → Calypso
  - Copy from similar NPA if available
- **Validation:** At least one system must be selected. For Bundling: must book in Murex/Mini/FA (condition #1 of 8)

---

#### Field 2.2: Trade Capture Process
- **Type:** Dropdown (required)
- **Options:**
  - Straight-Through Processing (STP) - Fully Automated
  - Semi-Automated (Manual validation required)
  - Manual Entry (Trade-by-trade)
- **Auto-Fill Logic:**
  - If product = standard (FX Forward, vanilla IRS) → STP
  - If product = exotic → Semi-Automated or Manual
- **Guidance:** Describe any manual steps required

---

#### Field 2.3: Valuation/Pricing Model
- **Type:** Dropdown + Text (required)
- **Dropdown Options:**
  - Black-Scholes (Options)
  - Binomial Tree (American Options)
  - Monte Carlo Simulation (Exotic Options)
  - Discounted Cash Flow (DCF)
  - Yield Curve Bootstrap (Swaps)
  - Market Quote (Exchange-Traded)
  - Proprietary Model (Specify)
  - Other (Specify)
- **Additional Text Field:** Model Description (500 chars)
- **Auto-Fill Logic:**
  - Product type → Model mapping:
    - FX Vanilla Option → Black-Scholes
    - FX Barrier Option → Monte Carlo
    - IRS → Yield Curve Bootstrap
  - Copy from similar NPA
- **Validation:** If proprietary model → Require Model Risk review

---

#### Field 2.4: Market Data Sources
- **Type:** Multi-select checkbox + Text (required)
- **Options:**
  - Bloomberg
  - Reuters
  - ICE Data Services
  - MarkitSERV
  - Internal MBS Pricing
  - Broker Quotes
  - Other (specify)
- **Additional Text:** Specific Data Fields Required (500 chars)
- **Auto-Fill Logic:**
  - Product type → Data sources:
    - FX → Bloomberg spot, forward, vol
    - IRS → Bloomberg curves, LIBOR/SOFR
  - Copy from similar NPA

---

#### Field 2.5: Settlement Method
- **Type:** Structured input (required)
- **Sub-fields:**
  - **Settlement Type:** Dropdown (Physical Delivery, Cash Settlement, Net Settlement)
  - **Settlement Currency:** Dropdown (USD, EUR, GBP, SGD, HKD, etc.)
  - **Settlement Timeframe:** Dropdown (T+0, T+1, T+2, T+3, Other)
  - **Settlement Agent/System:** Text (e.g., CLS, SWIFT, Internal)
- **Auto-Fill Logic:**
  - FX → CLS, T+2, Physical delivery
  - Derivatives → Cash settled, T+2
  - Copy from similar NPA
- **Validation:** If cross-border → Ensure settlement agent approved. For Bundling: must facilitate correct cashflow settlement (condition #8 of 8)

---

#### Field 2.6: Reconciliation Process
- **Type:** Long text (required)
- **Min Length:** 100 characters
- **Auto-Fill Logic:**
  - Standard reconciliation template based on product type
  - Copy from similar NPA
- **Guidance:** Describe: (1) Frequency, (2) Systems involved, (3) Validation steps, (4) Escalation process

---

#### Field 2.7: Technology Requirements
- **Type:** Structured input
- **Sub-fields:**
  - **New System Build Required?:** Yes/No
  - **If Yes, specify:** System Name, Build Timeline, Technology Owner
  - **System Enhancements Required?:** Yes/No
  - **If Yes, specify enhancements:** Long text
  - **UAT (User Acceptance Testing) Required?:** Yes/No
  - **If Yes, UAT Timeline:** Numeric (days)
- **Auto-Fill Logic:**
  - If product = standard → No build, no enhancements
  - If product = exotic → Likely enhancements, UAT required
- **Validation:** If new build >10 days → Technology sign-off mandatory

---

#### Field 2.8: Operational Dependencies
- **Type:** Long text
- **Auto-Fill Logic:**
  - Standard dependencies based on product type
  - Copy from similar NPA
- **Guidance:** List ALL teams/functions that must act for product lifecycle

---

### SECTION III: Pricing Model Details

**Purpose:** Define pricing methodology and assumptions

---

#### Field 3.1: Pricing Methodology
- **Type:** Long text (required)
- **Min Length:** 200 characters
- **Auto-Fill Logic:**
  - Product type → Pricing formula:
    - FX Vanilla Option → Black-Scholes template
    - IRS → DCF template
    - CDS → ISDA CDS Model template
  - Copy from similar NPA, adapt parameters
- **Guidance:** Include: (1) Formula, (2) Key inputs, (3) Greeks, (4) Spread/margin

---

#### Field 3.2: Pricing Assumptions
- **Type:** Structured input (required)
- **Sub-fields:**
  - **Volatility Assumption:** Text + Numeric
  - **Interest Rate Curve:** Text
  - **Credit Spread (if applicable):** Numeric (bps)
  - **FX Rate Assumptions:** Text
  - **Other Key Assumptions:** Long text
- **Auto-Fill Logic:** Copy from similar NPA, update market data

---

#### Field 3.3: Sensitivity Analysis (ROAE)
- **Type:** Conditional section (REQUIRED if notional >$20M [R40])
- **Sub-fields:**
  - **Base Case Scenario:** Numeric (revenue, P&L)
  - **Stress Scenario 1 (Market Move):** Numeric
  - **Stress Scenario 2 (Volatility Change):** Numeric
  - **Best Case Scenario:** Numeric
- **Auto-Fill Logic:**
  - If Finance requested sensitivity in prior NPA → Pre-populate template
  - Standard stress scenarios: ±10% underlying, ±20% volatility
- **Validation:**
  - If notional >$20M → Sensitivity MANDATORY [R40]
  - If notional >$50M → Finance VP sign-off REQUIRED on this section [R41]

---

#### Field 3.4: Pricing Data Attachments
- **Type:** File upload (optional, but recommended)
- **Accepted Formats:** PDF, Excel, Bloomberg screenshot
- **Auto-Fill Logic:**
  - If Finance SOP involved → Prompt "Finance typically requires pricing model attachment"

---

### SECTION IV: Risk Analysis

**Purpose:** Comprehensive risk assessment across all dimensions

---

### IV.A: Operational Risk

---

#### Field 4.1: Legal & Compliance Considerations

**Sub-field 4.1.1: Legal Documentation Required**
- **Type:** Multi-select checkbox (required)
- **Options:**
  - ISDA Master Agreement
  - Credit Support Annex (CSA)
  - GMRA (Repo Master Agreement)
  - Client Service Agreement
  - Confirmation (SWIFT, Email, Platform)
  - Prospectus/Offering Document
  - Legal Opinion (Specify jurisdiction)
  - Other (specify)
- **Auto-Fill Logic:**
  - Product type → Documentation:
    - Derivatives → ISDA + CSA
    - Repo → GMRA
    - Structured note → Prospectus
  - Copy from similar NPA

**Sub-field 4.1.2: Regulatory Requirements**
- **Type:** Multi-select checkbox + Text (required)
- **Options:**
  - MAS Regulations (Singapore): MAS Notice 610, 637, 645, 1015
  - HKMA Regulations (Hong Kong)
  - FCA Regulations (UK/London)
  - CFTC Regulations (US)
  - ISDA Dodd-Frank (US Persons)
  - EMIR (EU)
  - Local Regulations (specify)
- **Auto-Fill Logic:**
  - Location → Regulations:
    - Singapore → MAS
    - Hong Kong → HKMA
    - London → FCA

**Sub-field 4.1.3: Compliance Sign-Off Required?**
- **Type:** Auto-calculated (read-only)
- **Logic:** If retail distribution OR new jurisdiction OR complex structure → YES

---

#### Field 4.2: Finance & Tax Considerations

**Sub-field 4.2.1: Accounting Treatment**
- **Type:** Dropdown (required)
- **Options:** Mark-to-Market, Accrual, Hedge Accounting (Cash Flow / Fair Value), AFS, HTM, Other
- **Auto-Fill Logic:** Derivatives → Mark-to-Market; Loans → Accrual
- **Validation:** If hedge accounting → Require hedge documentation

**Sub-field 4.2.2: Tax Implications**
- **Type:** Long text (required)
- **Auto-Fill Logic:** Location → Tax template. Cross-border → Tax treaty implications
- **Guidance:** Cover withholding tax, VAT, transfer pricing

**Sub-field 4.2.3: Capital Adequacy Impact**
- **Type:** Structured input (required if notional >$10M)
- **Sub-fields:** Risk-Weighted Assets (RWA), Capital Charge, RWA Calculation Method
- **Auto-Fill Logic:** Notional × Risk Weight × 8%

---

### IV.B: Market, Liquidity & Counterparty Credit Risk

---

#### Field 4.3: Market Risk

**Sub-field 4.3.1: VaR (Value at Risk)**
- **Type:** Structured input (required)
- **Sub-fields:** VaR Amount, Confidence Level (95%/99%), Time Horizon (1-day/10-day), Methodology
- **Auto-Fill Logic:** Notional × Volatility × Confidence Factor / √Trading Days
- **Validation:** If VaR >$1M → MLR sign-off mandatory

**Sub-field 4.3.2: Greeks (for Options)**
- **Type:** Conditional (visible if product = option)
- **Sub-fields:** Delta, Gamma, Vega, Theta, Rho
- **Auto-Fill Logic:** Black-Scholes Greeks from pricing model

**Sub-field 4.3.3: Stress Testing**
- **Type:** Long text (required if notional >$20M)
- **Guidance:** Cover: Market crash, vol spike, counterparty default

---

#### Field 4.4: Liquidity Risk

**Sub-field 4.4.1: Liquidity Assessment**
- **Type:** Dropdown + Text (required)
- **Options:** Highly Liquid, Liquid, Moderately Liquid, Illiquid

**Sub-field 4.4.2: Funding Requirements**
- **Type:** Structured input
- **Sub-fields:** Funding Required (Y/N), Amount, Duration, Source

---

#### Field 4.5: Counterparty Credit Risk

**Sub-field 4.5.1: Counterparty Information**
- **Type:** Structured input (required)
- **Sub-fields:** Name, Type, Credit Rating, Rating Agency, Jurisdiction, RM
- **Auto-Fill Logic:** N/A (counterparty-specific, manual entry)
- **Validation:**
  - Must exist in CRM (C720) OR require KYC
  - If rating <BBB- → Credit sign-off mandatory (Group Risk Head level)

**Sub-field 4.5.2: Credit Exposure**
- **Type:** Structured input (required)
- **Sub-fields:** Current Exposure, PFE, EPE, CVA

**Sub-field 4.5.3: Collateral/Mitigants**
- **Type:** Long text (required)
- **Auto-Fill Logic:** If counterparty <A- → Daily collateral REQUIRED

---

### IV.C: Credit Risk (for Lending/Loan Products)

**Note:** This section only required if product involves lending/credit extension

---

#### Field 4.6: Credit Assessment
- **Type:** Conditional section (visible if product = loan, credit facility, repo)
- **Sub-fields:** Credit Line Available/Utilized/Post-Transaction, LTV, Collateral, PD, LGD, Expected Loss
- **Validation:** If credit line exceeded → Credit approval required (override)

---

### IV.D: Reputational Risk

---

#### Field 4.7: Reputational Risk Assessment
- **Type:** Long text (required)
- **Min Length:** 100 characters
- **Guidance:** Cover: Counterparty reputation, product complexity, regulatory, ESG, concentration

---

### SECTION V: Data Management

**Purpose:** Define data fields, quality, and reporting requirements

---

#### Field 5.1: Data Fields Required
- **Type:** Structured table (required)
- **Columns:** Field Name, Data Type, Mandatory, Source System, Regulatory Reporting
- **Auto-Fill Logic:** Standard data fields from product type template. MAS 610 mandatory fields for derivatives.
- **Validation:** All MAS 610 fields must be captured

---

#### Field 5.2: Data Quality Standards
- **Type:** Long text (required)
- **Auto-Fill Logic:** Standard PURE (Purposeful, Unsurprising, Respectful, Explainable) template
- **Guidance:** Describe how data adheres to PURE principles and D4D (Design for Data) requirements

---

#### Field 5.3: Reporting Requirements
- **Type:** Multi-select checkbox + Text (required)
- **Checkboxes:** MAS 610 (Daily), MAS 637 (Monthly), MAS 645 (Monthly), Internal Risk Reports (Daily), Management Reports (Weekly)
- **Auto-Fill Logic:** Singapore + Derivatives → MAS 610 daily

---

### SECTION VI: Other Risk Identification

**Purpose:** Capture any risks not covered in standard sections (Sections I-V)

---

#### Field 6.0: Other Risks Not Covered
- **Type:** Long text (required)
- **Guidance:** Assess and document the following if applicable:
  - **Conduct Risk:** Mis-selling potential, client suitability concerns, market manipulation
  - **Model Risk:** Valuation uncertainty, model limitations, parameter sensitivity
  - **Concentration Risk:** Single counterparty/sector/geography exposure beyond standard limits
  - **Emerging Risks:** Regulatory changes in pipeline, market structure shifts, technology disruption
  - **Environmental Risk:** Climate-related financial risk, transition risk
  - **Step-in Risk:** Implicit support obligations to SPVs or structured vehicles
- **Auto-Fill Logic:** Standard risk identification template based on product complexity
- **Validation:** Cannot be left blank — minimum "No additional risks identified beyond Sections I-V"

---

### SECTION VII: Trading Products Specific Information

**Purpose:** Trading-specific details for products booked on trading desks

---

#### Field 7.1: Collateral and Pledged Assets
- **Type:** Structured input (required for trading products)
- **Sub-fields:**
  - **Collateral Type:** Multi-select (Cash, Government Bonds, Corporate Bonds, Equities, Real Estate, None)
  - **Collateral Valuation Method:** Dropdown (Mark-to-Market Daily, Monthly, Haircut-Adjusted)
  - **Pledged Asset Description:** Long text (if applicable)
- **Auto-Fill Logic:** Standard collateral terms from CSA template

---

#### Field 7.2: Valuation Models and Funding
- **Type:** Structured input (required for derivatives)
- **Sub-fields:**
  - **Model Name:** Text (e.g., Black-Scholes, Monte Carlo)
  - **Model Validation Status:** Dropdown (Validated, Pending Validation, Expired)
  - **Model Validation Date:** Date
  - **SIMM Treatment:** Dropdown (Standard, Custom, Exempt)
  - **Funding Source:** Dropdown (MBS Treasury, External, Client Collateral)
  - **Funding Cost (bps):** Numeric
- **Auto-Fill Logic:** Product type → Model mapping; Copy from similar NPA

---

#### Field 7.3: Booking Schemas and Portfolio Mappings
- **Type:** Structured input (required for all trading products)
- **Sub-fields:**
  - **Murex Typology:** Text (e.g., `IRD|IRS|Vanilla`)
  - **Murex Generator:** Text (e.g., `CNH 7DREPO 3M SWAPCON`)
  - **Portfolio Code:** Text (e.g., `MBSSG AMM BCB1`)
  - **Booking Entity:** Dropdown (from Appendix II entity list)
  - **Front-Office System:** Dropdown (Murex, Calypso, Summit, Bloomberg, Other)
  - **Cross-Border Booking?:** Auto-calculated from Appendix II
- **Auto-Fill Logic:** Product type + location → Standard Murex typology mapping
- **CRITICAL NOTE:** Booking schema is scrutinized in every NPA. Murex typology, portfolio mapping, and generator specifications must be precise.

---

### Supporting Documents Checklist

**Purpose:** Track uploaded documents and validate completeness

---

#### Field DOC.1: Document Upload Checklist
- **Type:** Interactive checklist with file upload
- **Categories (10 total, from Agent-Document Mapping):**
  1. Product Specifications
  2. Operational & Technology
  3. Pricing Model
  4. Risk Analysis
  5. Data Management
  6. Entity/Location
  7. Intellectual Property
  8. Financial Crime
  9. Risk Reporting
  10. Trading Products
- **Auto-Fill Logic:**
  - Document Checklist Agent validates completeness per category
  - ML Prediction Agent suggests missing documents
- **Validation:**
  - Checker cannot approve if completeness <90%
  - Display warnings for missing critical documents

---

### Loop-Back & Circuit Breaker Tracking

**Purpose:** Track rework cycles and enforce circuit breaker [R35, R36]

---

#### Field LB.1: Loop-Back History
- **Type:** Auto-tracked table (read-only)
- **4 Loop-Back Types [R36]:**

| Type | Trigger | Impact | Routing |
|------|---------|--------|---------|
| **Type 1: Checker Rejection** | Maker submits → Checker REJECTS | +3-5 days per iteration | Back to Maker (Draft stage) |
| **Type 2: Approval Clarification** | SOP needs clarification during sign-off | Smart routing: if doc changes needed → Maker; if answerable → direct response | Saves ~2-3 days |
| **Type 3: Launch Prep Issues** | System config/UAT discovers issue | Loop to specific SOP only (not all) | Back to specific Sign-Off |
| **Type 4: Post-Launch Corrective** | PIR identifies amendment needed | Expedited re-approval | Back to Review Stage |

- **Columns:** Loop-Back #, Type, Date, Initiated By, Reason, Resolution Date, Days Added
- **Current Metrics Baseline:** 8 loop-backs/month, 1.4 avg rework iterations, ~1 circuit breaker/month

---

#### Field LB.2: Circuit Breaker Status [R35]
- **Type:** Auto-calculated (read-only)
- **RULE:** After **3 loop-backs** on the same NPA → **AUTOMATIC ESCALATION**
- **Escalation To:** Group BU/SU COO + NPA Governance Forum
- **Rationale:** 3 loop-backs indicate a fundamental problem — unclear requirements, complex edge case, or process breakdown needing senior intervention
- **Display:**
  ```
  Current Loop-Back Count: [N] of 3
  Circuit Breaker Status: [NORMAL / WARNING (2 of 3) / TRIGGERED (≥3)]
  If TRIGGERED: Escalated to [GFM COO / Governance Forum] on [date]
  ```
- **Validation:** When loop_back_count ≥ 3 → auto-create escalation record, transition to ESCALATED stage

---

### Validity & PIR Tracking

**Purpose:** Track NPA validity, extensions, and PIR obligations [R27-R32]

---

#### Field VP.1: Validity Period [R27]
- **Type:** Auto-calculated display (read-only)
- **Rules:**
  - **Full NPA / NPA Lite:** 1 year from approval date
  - **Evergreen:** 3 years from approval date
- **Extension Rules [R28]:**
  - ONE extension allowed: +6 months (total maximum: 18 months)
  - Requirements: No variations, no risk profile changes, no operating model changes
  - **Unanimous consensus** from ALL original sign-off parties required
  - Group BU/SU COO approval required
  - If ANY SOP disagrees → extension denied
- **Expiry Actions [R29]:**
  - NPA expires → product CANNOT be traded
  - Reactivation: engage Group BU/SU COO
  - No variations → NPA Lite - Reactivation track
  - Variations → Full NPA (treated as new)
- **Auto-Reminders:**
  - Approval + 11 months: "NPA expires in 30 days"
  - Approval + 11.5 months: "NPA expires in 15 days - URGENT"

---

#### Field VP.2: PIR Requirements [R30, R31, R32]
- **Type:** Auto-calculated display (read-only)
- **PIR Mandatory When:**
  1. ALL New-to-Group products (even without conditions) [R30]
  2. ALL products with post-launch conditions imposed by SOPs [R31]
  3. **GFM stricter rule:** ALL launched products regardless of classification [R32]
- **Timeline:** Must be initiated within **6 months** of product launch
- **PIR Reminders:**
  - Launch + 120 days: "PIR due in 60 days, begin preparation"
  - Launch + 150 days: "PIR due in 30 days, submit draft"
  - Launch + 173 days: "PIR OVERDUE, submit immediately"
- **PIR Sign-Off:**
  - All original SOPs who imposed post-launch conditions
  - For NTG: ALL original SOPs (even if no conditions)
  - Group Audit may conduct its own PIR
- **PIR Repeat Logic:** If SOPs identify issues → new PIR scheduled (90 days after failed PIR)

---

### APPENDIX I: Bundling Approval Form

**Purpose:** 8-condition checklist for Bundling track [R08, R17]

---

#### Field AI.1: Bundling 8-Condition Checklist
- **Type:** Checklist (ALL must pass for Bundling track)
- **CRITICAL GATE:** ANY fail → Block bundling, route to Full NPA or NPA Lite

| # | Condition | Pass/Fail | Evidence |
|---|-----------|-----------|----------|
| 1 | Building blocks can be booked in Murex/Mini/FA with no new model required | ☐ | System confirmation |
| 2 | No proxy booking in the transaction | ☐ | Booking schema review |
| 3 | No leverage in the transaction | ☐ | Product structure review |
| 4 | No collaterals involved (or can be reviewed) | ☐ | Collateral assessment |
| 5 | No third parties involved | ☐ | Party list review |
| 6 | Compliance considerations in each block complied with (PDD form submitted) | ☐ | PDD confirmation |
| 7 | No SCF (Structured Credit Financing) except structured warrant bundle | ☐ | Product classification |
| 8 | Bundle facilitates correct cashflow settlement | ☐ | Settlement flow review |

- **Result:** ALL 8 Pass → Bundling Arbitration Team review → Bundling Approval
- **Result:** ANY Fail → Route to Full NPA or NPA Lite (based on risk severity)

---

#### Field AI.2: Arbitration Team Composition
- **Type:** Read-only reference
- **Members:**
  - Head of GFM COO Office NPA Team
  - RMG-MLR
  - TCRM (Technology & Credit Risk Management)
  - Finance-GPC (Group Product Control)
  - GFMO (GFM Operations)
  - GFM Legal & Compliance

---

#### Field AI.3: Pre-Approved (Evergreen) Bundles
- **Type:** Read-only reference (no approval needed for these)
- **Standard Bundles:**
  - Dual Currency Deposit/Notes (FX Option + LNBR/Deposit/Bond)
  - Treasury Investment Asset Swap (Bond + IRS)
  - Equity-Linked Note (Equity Option + LNBR)
- **Approved FX Derivative Bundles:** 28+ pre-approved combinations maintained by GFM COO Office, including:
  - Best/Worst of Option, KIKO CLI, Boosted KO Forward with Guarantee
  - Multi-period EKI Strangle, Pivot Forward, Trigger Forward
  - Range Coupon CCY Linked SIP
  - Full list: "List of approved FX Bundled products.xlsx" (GFM COO Office)

---

### APPENDIX II: Entity/Location Information

**Purpose:** Define legal entities, booking locations, cross-border structure

---

#### Field AII.1: Booking Entity
- **Type:** Dropdown (required)
- **Options:** MBS Bank Ltd (SG), MBS Bank (HK) Ltd, MBS Bank Ltd (London), MBS Bank India Ltd, [etc.]
- **Auto-Fill Logic:** User's location/desk → Default booking entity

---

#### Field AII.2: Counterparty Entity
- **Type:** Text (manual entry required)
- **Validation:** Must match legal name in CRM (C720)

---

#### Field AII.3: Cross-Border Transaction? [R07]
- **Type:** Auto-calculated (read-only)
- **Logic:**
  ```
  IF (booking_entity_location ≠ counterparty_location)
  OR (booking_entity_location ≠ settlement_location)
  OR (multiple_booking_entities):
    cross_border = TRUE
  ELSE:
    cross_border = FALSE
  ```
- **CRITICAL IMPACT [R07]:** If YES → 5 MANDATORY SOPs added: Finance, Credit, MLR, Tech, Ops — CANNOT be waived

---

#### Field AII.4: Jurisdictions Involved
- **Type:** Multi-select (auto-populated from entities)
- **Options:** Singapore (MAS), Hong Kong (HKMA), UK (FCA), US (CFTC/SEC), India (RBI/SEBI), etc.
- **Auto-Fill Logic:** Booking entity + Counterparty entity → Jurisdictions

---

#### Field AII.5: Transfer Pricing (if Cross-Border)
- **Type:** Conditional (visible if Cross-Border = YES)
- **Sub-fields:** Transfer Pricing Method, Description, Finance Approval checkbox
- **Validation:** If cross-border → Finance approval REQUIRED

---

### APPENDIX III: ROAE Sensitivity Analysis

**Purpose:** Mandatory sensitivity analysis for products with notional >$20M [R40]

---

#### Field AIII.1: ROAE Sensitivity Model
- **Type:** Structured input + file upload (REQUIRED if notional >$20M)
- **Sub-fields:**
  - **Base Case ROAE:** Percentage
  - **Stress Scenario 1 (Market Crash):** ROAE under adverse market conditions
  - **Stress Scenario 2 (Volatility Spike):** ROAE under elevated volatility
  - **Best Case:** ROAE under favorable conditions
  - **Break-Even Analysis:** Minimum deal count / volume to achieve target ROAE
- **Attachment:** Excel ROAE model (required for >$50M, recommended for >$20M)
- **Escalation:**
  - >$20M → This appendix MANDATORY
  - >$50M → Finance VP must sign off on this appendix [R41]
  - >$100M → CFO must sign off on this appendix [R42]

---

### APPENDIX IV: Intellectual Property (IP)

**Purpose:** Identify proprietary models, third-party licenses, IP considerations

---

#### Field AIV.1: Proprietary Models Used?
- **Type:** Yes/No (required)
- **If Yes:** Model Name, Model Owner (quant team), Model Validation Date, Model Risk Review Required (auto: Yes if proprietary)
- **Auto-Fill Logic:** Standard models (Black-Scholes, DCF) → No; Custom → Yes
- **Validation:** If proprietary → Model Risk review mandatory

---

#### Field AIV.2: Third-Party IP/Licenses
- **Type:** Multi-select + Text
- **Options:** Bloomberg Terminal, Reuters Eikon, MarkitSERV, ISDA Documentation, External Valuation Model, None
- **Auto-Fill Logic:** If derivative → ISDA documentation; If Bloomberg data → Bloomberg license

---

### APPENDIX V: Financial Crime Risk Areas

**Purpose:** AML/KYC, sanctions screening, fraud risk assessment [R01, R10]

---

#### Field AV.1: AML/KYC Status
- **Type:** Structured input (required)
- **Sub-fields:** KYC Completed (Y/N), Date, Reviewer, Client Risk Rating (Low/Medium/High), Enhanced Due Diligence Required
- **Auto-Fill Logic:** Query CRM (C720) for existing KYC status
- **Validation:** If KYC not completed → Block NPA submission

---

#### Field AV.2: Sanctions Screening [R01, R10]
- **Type:** Auto-executed (read-only results)
- **CRITICAL — PROHIBITED CHECK [R01]:** This check runs BEFORE classification (Step 0). Hard stop if FAIL.
- **Three Prohibition Layers:**
  1. **Internal bank policy** — Products MBS has decided not to offer (risk appetite, reputational)
  2. **Regulatory restrictions** — MAS, CFTC, FCA, local regulators
  3. **Sanctions/embargoes** — OFAC SDN, UN Security Council, EU Sanctions, MAS Sanctions, HKMA Sanctions (zero tolerance, criminal liability)
- **Screening:** Counterparty + Ultimate Beneficial Owner (UBO) against all lists
- **Result:** PASS → proceed; FAIL → HARD STOP [R10], workflow terminated, no exceptions without Compliance/EVP review
- **Auto-Fill Logic:** Prohibited List Checker Agent executes sanctions check
- **Validation:** If FAIL → Block NPA submission absolutely (Prohibited track)

---

#### Field AV.3: Fraud Risk Assessment
- **Type:** Long text (required)
- **Guidance:** Check: Identity verification, transaction patterns, payment methods, red flags

---

### APPENDIX VI: Risk Data Aggregation and Reporting Requirements

**Purpose:** Define regulatory reporting and risk aggregation methodologies

---

#### Field AVI.1: Risk Aggregation Methodology
- **Type:** Long text (required)
- **Auto-Fill Logic:** Standard risk aggregation template for product type
- **Guidance:** Describe: Aggregation levels, metrics, frequency, sources, reconciliation

---

#### Field AVI.2: Regulatory Reporting Obligations
- **Type:** Structured table (required)
- **Columns:** Report Name, Regulator, Frequency, Data Source, Submission Deadline
- **Auto-Fill Logic:** Location + Product type → Regulatory reports

---

### APPENDIX VII: Evergreen FAQ/Checklist

**Purpose:** Evergreen-specific validation, limits, and trading workflow [R09, R18, R43, R44]

---

#### Field AVII.1: Evergreen Eligibility Criteria
- **Type:** Checklist (all must pass for Evergreen track)
- **Criteria:**
  1. No significant changes since last approval
  2. Back-to-Back (BTB) basis with professional counterparty
  3. Vanilla/foundational product (building block for other variants)
  4. Liquidity management product (including for MBS Group Holdings)
  5. Exchange product used as hedge against customer trades
  6. ABS origination to meet client demand
- **NOT Eligible for Evergreen:**
  - Products requiring deal-by-deal approval
  - Products dormant/expired for >3 years
  - Joint-unit NPAs (Evergreen is GFM-only)

---

#### Field AVII.2: Evergreen Limits (GFM-Wide) [R43]
- **Type:** Read-only reference + real-time usage tracking

| Limit Type | Amount | Current Usage | Remaining |
|------------|--------|---------------|-----------|
| Total Notional (GFM-wide) | $500M | [auto] | [auto] |
| Long Tenor >10Y (sub-limit) | $250M | [auto] | [auto] |
| Non-Retail Deal Cap (per NPA) | 10 deals | [auto] | [auto] |
| Retail Deal Cap (per NPA) | 20 deals | [auto] | [auto] |
| Retail Transaction Size (per trade) | $25M | N/A | N/A |
| Retail Aggregate Notional (sub-limit) | $100M | [auto] | [auto] |

- **Special exemption [R44]:** Liquidity management products → caps WAIVED due to exigency
- **Counting rule:** Customer leg only (BTB/hedge excluded)
- **If ANY limit FAIL:** Downgrade to NPA Lite template, notify user

---

#### Field AVII.3: Evergreen Trading Workflow [R18]
- **Type:** Read-only process reference
- **Steps:**
  1. Sales/Trader executes the deal with the client
  2. **IMMEDIATELY** (within 30 min) email GFM COD SG – COE NPA with deal details
  3. SG NPA Team updates Evergreen limits worksheet (chalk usage)
  4. Location COO Office confirms within 30 minutes (sanity check)
  5. Initiate NPA Lite reactivation in parallel
  6. When NPA Lite approved → Uplift (restore) Evergreen limits

---

#### Field AVII.4: Evergreen Validity and Annual Review
- **Type:** Read-only reference
- **Validity:** 3 years from approval date (GFM deviation approved 21-Feb-2023)
- **Annual Review:** Required by NPA Working Group
- **Dormancy Rule:** Products dormant >3 years at review time → removed from Evergreen list
- **Reactivated Products:** Maintain Evergreen status for NPA approval date + 3 years, OR last transaction date during NPA validity + 3 years

---

## 3. NPA Lite Template (Simplified)

**Purpose:** Simplified template for low-risk variations, existing products (new location), dormant <3 years

**Structure:** Same sections as Full NPA, but reduced fields

---

### 3.1 NPA Lite Sub-Types (B1-B4) [R12-R15]

**CRITICAL:** NPA Lite has **4 distinct sub-types**, each with different rules, timelines, and eligibility criteria:

---

#### Sub-Type B1: Impending Deal (48-Hour Express Approval) [R12]
- **Eligibility:**
  - Back-to-back deal with professional counterparty, OR
  - Dormant/expired product with UAT completed, OR
  - Singapore-approved NPA applicable regionally on BTB basis
- **Process:**
  - 48-hour notice period sent to ALL relevant SOPs
  - If **ANY** SOP objects → Falls back to standard NPA Lite
  - If no objections after 48 hours → **Auto-approved**
- **Template:** NPA Lite (40 fields), emphasis on referencing existing approvals
- **Timeline:** 48 hours (hard deadline)
- **Field Count:** ~35 fields (further reduced from standard NPA Lite)

---

#### Sub-Type B2: NLNOC (NPA Lite No Objection Concurrence) [R13]
- **Eligibility:**
  - Simple change to payoff of approved product
  - Reactivation of dormant/expired NPA with no structural changes
- **Process:**
  - Decision by **GFM COO + Head of RMG-MLR jointly**
  - SOPs provide "no-objection concurrence" (lighter than full sign-off)
  - Joint COO+MLR decision documented
- **Template:** NPA Lite (40 fields)
- **Timeline:** 5-10 business days
- **Field Count:** ~40 fields

---

#### Sub-Type B3: Fast-Track Dormant Reactivation (48-Hour) [R14]
- **Eligibility — ALL 5 criteria must pass:**
  1. Existing live trade in the past (trade history confirmed)
  2. NOT on prohibited list (sanctions/regulatory clear)
  3. PIR completed for original NPA (post-implementation done)
  4. No variation or changes to product features
  5. No change to booking model/system
- **Process:**
  - 48-hour no-objection notice to original approvers
  - If no objections → Auto-approved
  - If ANY criterion fails → Route to standard NPA Lite
- **Template:** NPA Lite (40 fields), heavily pre-filled from original NPA
- **Timeline:** 48 hours (hard deadline)
- **Field Count:** ~30 fields (maximum auto-fill from original NPA)

---

#### Sub-Type B4: Approved NPA Addendum (Minor Changes) [R15]
- **Eligibility:**
  - Applies to **LIVE** (not expired) NPAs only
  - Minor/incremental updates only
  - Examples: adding cash settlement option, bilateral → tripartite, typo fixes
  - **NOT** eligible for: new features, new payoffs, new risk profiles
- **Process:**
  - Original NPA reference kept intact (same GFM ID)
  - Addendum document attached to parent NPA
  - Reduced sign-off (typically 1-2 SOPs affected by the change)
- **CRITICAL:** Validity period NOT extended (maintains original expiry date)
- **Template:** Addendum form (subset of NPA Lite)
- **Timeline:** <5 business days
- **Field Count:** ~20 fields (only changed fields + justification)

---

### 3.2 Key Differences from Full NPA

**Reduced Fields (40 fields vs 65):**

**SECTION I: Product Specifications**
- Remove: PAC Approval (not required for NPA Lite)
- Remove: Detailed Business Rationale (reduced to 100 chars)
- Keep: All identification fields (NPA ID, Product Name, Maker, etc.)
- Add: **Justification for NPA Lite** (required, explain why not Full NPA)
- Add: **Reference NPA ID** (link to existing approved NPA)

**SECTION II: Operational & Technology**
- Remove: Technology Requirements (assumed standard, no new build)
- Keep: Booking System, Trade Capture, Valuation Model (simplified)

**SECTION III: Pricing Model**
- Remove: Sensitivity Analysis (not required unless >$20M)
- Keep: Pricing Methodology, Pricing Assumptions

**SECTION IV: Risk Analysis**
- Remove: Detailed Stress Testing (simplified to 1 scenario)
- Remove: Credit Risk section (unless lending product)
- Keep: Legal & Compliance, Finance & Tax, Market/Liquidity Risk (simplified)

**APPENDICES:**
- Remove: Appendix I (Bundling) — not applicable
- Remove: Appendix IV (IP) — assumed no proprietary models
- Keep: Appendix II (Entity/Location), Appendix V (Financial Crime), Appendix VI (Reporting)

---

### 3.3 Auto-Fill Coverage (NPA Lite)
- **85% average auto-fill** (34/40 fields)
- Higher auto-fill because referencing existing NPA (copy/adapt approach)

---

## 4. Bundling NPA Template

**Purpose:** Template for bundled products (multiple products combined, e.g., FX + IRS + Commodity)

**Structure:** Enhanced Full NPA with bundling-specific sections

---

### 4.1 Bundling Pre-Requisites [R08, R17]

**BEFORE creating a Bundling NPA, the 8-Condition Gate (Appendix I) MUST pass.**

ALL 8 conditions must be satisfied:
1. Building blocks bookable in Murex/Mini/FA (no new model)
2. No proxy booking
3. No leverage
4. No collaterals (or reviewable)
5. No third parties
6. Compliance PDD submitted for each block
7. No SCF (except structured warrant bundle)
8. Correct cashflow settlement

**If ANY condition fails → CANNOT use Bundling template. Route to Full NPA or NPA Lite.**

**Arbitration Team** reviews and approves bundling decisions:
- Head of GFM COO Office NPA Team, RMG-MLR, TCRM, Finance-GPC, GFMO, GFM Legal & Compliance

---

### 4.2 Additional Bundling Fields (75 fields total)

**SECTION I: Product Specifications — BUNDLING SECTION**

#### Field 1.16: Bundled Products Count
- **Type:** Numeric (read-only, auto-calculated)

#### Field 1.17: Bundled Components Table
- **Type:** Structured table (required)
- **Columns:** Component #, Product Type, Notional (USD), Standalone Tier, Standalone Approvers

#### Field 1.18: Aggregate Notional
- **Type:** Numeric (auto-calculated, sum of all components)
- **Notional Threshold Escalation [R40-R42]:** Same rules apply to aggregate notional

#### Field 1.19: Bundling Rationale
- **Type:** Long text (required, min 200 chars)
- **Guidance:** Explain: (1) Client need, (2) Why bundling vs separate NPAs, (3) Economic substance, (4) Hedging relationship

#### Field 1.20: Bundling Approval Requirements
- **Type:** Auto-calculated display
- **Steps:** Arbitration Team Review (2-3 days) → Aggregate Approvers (tier-based) → Bundling Team Sign-Off

#### Field 1.21: Component Interdependencies
- **Type:** Long text (required)
- **Guidance:** Describe risk interactions, VaR diversification, netting benefits

---

**SECTION IV: Risk Analysis — BUNDLING RISK SECTION**

#### Field 4.8: Aggregate Risk Assessment
- **Sub-fields:** Aggregate VaR, Diversification Benefit %, Aggregate PFE, Netting Benefit %

#### Field 4.9: Bundling-Specific Risks
- **Type:** Long text (required)
- **Guidance:** Cover: Execution risk, Documentation risk, Operational risk, Regulatory risk, Unwind risk

---

## 5. Field Definitions & Validation Rules

### 5.1 Validation Types

**1. Format Validation**
- **Regex patterns** for structured fields (NPA ID, dates, emails)
- **Example:** NPA ID must match `^[A-Z]{2,4}[0-9]{4}-[0-9]{3}$`

**2. Range Validation**
- **Numeric ranges** (notional >$0, ROAE 0-100%)
- **Date ranges** (expiry date > trade date)

**3. Business Rule Validation**
- **Cross-field validation** (if cross-border → Finance + Ops + Tech required)
- **Threshold checks** (if notional >$50M → Finance VP required)

**4. Completeness Validation**
- **Required fields** (cannot submit NPA with missing required fields)
- **Document checklist** (warn if <90% complete)

**5. Sign-Off Validation**
- **Approval matrix** (ensure correct approvers assigned)
- **SLA tracking** (warn if approaching SLA breach)

---

### 5.2 Validation Error Messages

**Severity Levels:**
1. **BLOCKING ERROR (Red):** Cannot proceed (e.g., missing required field)
2. **WARNING (Yellow):** Can proceed with caution (e.g., ROAE <5%)
3. **INFO (Blue):** Informational only (e.g., "Similar NPA found: TSG1917")

**Example Error Messages:**
```
BLOCKING: Field "Counterparty Name" is required (cannot submit)
WARNING: ROAE (4.2%) below minimum threshold (5.0%) - Finance may reject
INFO: Similar NPA found (TSG1917, 94% match) - auto-fill available
```

---

### 5.3 Cross-Cutting Business Rule Gates (NON-NEGOTIABLE)

**These rules are enforcement gates that OVERRIDE normal flow. They cannot be bypassed, waived, or skipped under any circumstances.**

| Rule | Gate | Enforcement | Consequence of Violation |
|------|------|-------------|------------------------|
| **R01** | Prohibited check BEFORE classification | Hard gate — Step 0 | Regulatory violation, sanctions breach |
| **R07** | Cross-border → 5 mandatory SOPs (Finance, Credit, MLR, Tech, Ops) | Auto-add to sign-off matrix, CANNOT be waived | Missing sign-off = incomplete governance |
| **R10** | Prohibited = HARD STOP, workflow termination | Block all stage transitions if prohibited | Criminal liability for sanctions |
| **R11** | NTG → ALWAYS Full NPA | DB constraint: `npa_type != NTG OR track = FULL_NPA` | NTG through Lite = missing mandatory reviews |
| **R16** | NTG requires PAC approval BEFORE NPA starts | Block NPA initiation if PAC ≠ Approved | Group governance violation, audit finding |
| **R22** | NTG from overseas → Head Office sign-offs | Auto-add Head Office parties when NTG + non-SG jurisdiction | Insufficient oversight of overseas NTG products |
| **R25-R26** | Maker → Checker → SOPs → COO final approval (sequential) | State machine: DRAFT → PENDING_CHECKER → PENDING_SIGN_OFFS → PENDING_FINAL_APPROVAL → APPROVED | Approval integrity |
| **R27** | 1-year validity (Evergreen: 3 years) | Auto-expire after validity period | Expired product traded = unauthorized activity |
| **R28** | One-time +6mo extension, unanimous SOP consent | Extension denied if ANY SOP disagrees | Over-extension without review |
| **R30-R32** | PIR mandatory (NTG: 6 months; GFM: ALL launched products) | Auto-schedule PIR on launch, send reminders | Missing PIR = audit finding |
| **R35** | Circuit breaker: 3 loop-backs → auto-escalate | Auto-create escalation at loop-back #3 | Infinite rework with no resolution |
| **R40** | Notional >$20M → ROAE sensitivity required | Block submission without Appendix III | Financial control gap |
| **R41** | Notional >$50M → Finance VP review | Auto-add Finance VP to sign-off matrix | Insufficient financial oversight |
| **R42** | Notional >$100M → CFO review | Auto-add CFO to sign-off matrix | Insufficient executive oversight |

---

## 6. Auto-Fill Logic & Data Sources

### Auto-Fill Data Sources:

**1. User Profile**
- **Fields:** Maker, Desk/BU, Location, NPA Champion
- **Source:** User authentication session

**2. Historical NPAs (KB Search)**
- **Fields:** Product specifications, risk analysis, pricing model, operational details
- **Source:** Semantic search over 1,784+ historical NPAs
- **Matching:** Product type + notional + location + counterparty type

**3. Classification Router Agent**
- **Fields:** Product Classification, Approval Track
- **Source:** KB_NPA_Classification_Rules + KB_NPA_Approval_Matrix
- **Logic:** Two-stage classification — Stage 1 (NTG/Variation/Existing) THEN Stage 2 (track selection) [R02]

**4. Approval Matrix (KB)**
- **Fields:** Required Sign-Off Parties, Approver Levels, Timeline SLA
- **Source:** KB_NPA_Approval_Matrix
- **Logic:** Tier determination (notional + cross-border + risk) → Approvers

**5. Prohibited List Checker Agent**
- **Fields:** Sanctions Screening Result
- **Source:** OFAC, UN, EU, MAS sanctions lists
- **Logic:** Counterparty name + UBO name → Screening [R01]

**6. CRM System (C720)**
- **Fields:** Counterparty details, KYC status, credit rating, relationship manager
- **Source:** MBS internal CRM
- **API:** Real-time query

**7. Limit Management System (MINV)**
- **Fields:** Desk limits, VaR limits, concentration limits
- **Source:** MBS internal limit system
- **API:** Real-time query

**8. Market Data (Bloomberg/Reuters)**
- **Fields:** Pricing assumptions (spot, forward, volatility, interest rates)
- **Source:** Bloomberg Terminal (if available)
- **API:** Bloomberg API or manual upload

---

### Auto-Fill Workflow:

```
Step 0: PROHIBITED CHECK (Step 0, BEFORE everything) [R01]
  - Sanctions/regulatory/internal prohibited list screening
  - If FAIL → HARD STOP, no NPA created [R10]

Step 1: User starts NPA (NPA ID auto-generated)

Step 2: Product Ideation Agent interview (gather product details)

Step 3: Classification Router Agent
  - Stage 1: Classify product (NTG/Variation/Existing) [R02]
  - Stage 2: Determine approval track [R11: NTG → ALWAYS Full NPA]

Step 4: KB Search Agent (find similar historical NPA, 80%+ similarity)

Step 5: Template Auto-Fill Engine:
  - Copy 37/47 base fields from similar NPA
  - Adapt: Notional, counterparty, dates (user-specific)
  - Query CRM: Counterparty details, KYC, credit rating
  - Query MINV: Desk limits, VaR limits
  - Calculate: Aggregate notional, post-transaction limits, risk metrics
  - Check notional thresholds [R40/R41/R42] → auto-add escalation approvers

Step 6: Display to user:
  - GREEN: Auto-filled & verified (37 fields)
  - YELLOW: Auto-filled, verify (3 fields - user should double-check)
  - WHITE: Manual entry required (7 fields)

Step 7: User reviews, edits, submits
```

---

### Auto-Fill Confidence Scoring:

**High Confidence (GREEN):**
- Exact match from similar NPA (>90% similarity)
- Standard fields (desk, maker, booking system)
- Calculated fields (aggregate notional, post-transaction limits)

**Medium Confidence (YELLOW):**
- Adapted from similar NPA (80-90% similarity)
- Market data (may have changed since reference NPA)
- Risk assumptions (should validate)

**Low Confidence (WHITE):**
- No similar NPA found (<80% similarity)
- Counterparty-specific (must be entered manually)
- Future events (trade date, expiry date)

---

## 7. Template Selection Decision Tree

```
START: User initiates NPA

  ↓
Step 0: PROHIBITED CHECK [R01, R10]
  - Run Prohibited List Checker Agent
  - Screen counterparty + UBO against: OFAC, UN, EU, MAS, HKMA, internal policy
  - IF PROHIBITED → HARD STOP (no template, no NPA, no exceptions)

  ↓
Phase 0: Product Ideation Interview
  - Product details gathered (type, notional, counterparty, etc.)

  ↓
Classification Router Agent (Stage 1: Product Type) [R02]
  - New-to-Group (NTG)? → triggers: new product, role, channel, segment, exchange, geography [R03]
  - Variation? → triggers: bundling, cross-book, accounting, manual, ESG, fintech, 3rd-party [R04]
  - Existing? → sub-categories: new-to-location, dormant, expired [R05]

  ↓
Classification Router Agent (Stage 2: Approval Track)
  - Apply override rules (cross-border, notional, bundling, etc.)

  ↓
TEMPLATE SELECTION:

IF Product = NEW-TO-GROUP:
  → PAC approval MUST exist [R16]
  → Use FULL NPA TEMPLATE (47 base / 65+ expanded fields) [R11]
  → Auto-fill: 37/47 base fields (78%)
  → Required approvers: ALL 7 SOPs [R20]
  → If overseas: Head Office sign-offs [R22]
  → Timeline: 7-12 days
  → PIR: MANDATORY within 6 months [R30]

ELSE IF Product = VARIATION (High-Risk):
  → Use FULL NPA TEMPLATE (same as NTG)
  → High-risk = accounting change, cross-book, fintech
  → Timeline: 7-12 days

ELSE IF Product = VARIATION (Medium/Low-Risk):
  → Use NPA LITE TEMPLATE (40 fields)
  → Auto-fill: 34/40 fields (85%)
  → Required approvers: 2-3
  → Timeline: 4-5 days

ELSE IF Product = EXISTING:

  IF Active + on Evergreen list:
    → EVERGREEN (auto-approved if within limits) [R18]
    → Check Evergreen limits [R43]: $500M notional, deal count caps
    → IF limits PASS → Auto-approve (<1 hour), initiate NPA Lite reactivation in parallel
    → IF limits FAIL → Downgrade to NPA LITE TEMPLATE

  ELSE IF Active + NOT on Evergreen list:
    → NPA LITE - Reference Existing
    → Timeline: 4-5 days

  ELSE IF Dormant <3 years + fast-track criteria pass:
    → NPA LITE B3 - FAST-TRACK DORMANT (48 hours) [R14]
    → 5 criteria: live trade, not prohibited, PIR done, no variation, no booking change
    → If ALL pass → 48-hour no-objection, auto-approve
    → If ANY fail → Standard NPA Lite

  ELSE IF Dormant <3 years + variations detected:
    → NPA LITE (standard)
    → Timeline: 4-5 days

  ELSE IF Dormant ≥3 years:
    → ESCALATE to GFM COO [R05]
    → May require FULL NPA (COO decision)

  ELSE IF Expired + no variations:
    → NPA LITE - Reactivation [R29]
    → Timeline: 4-5 days

  ELSE IF Expired + variations:
    → FULL NPA (treated as effectively NTG) [R29]
    → Timeline: 7-12 days

ELSE IF Approval Track = "Bundling":
  → Check 8-Condition Gate (Appendix I) [R08, R17]
  → IF ALL 8 pass:
    → Use BUNDLING NPA TEMPLATE (75 fields)
    → Step 1: Bundling Arbitration Team review (2-3 days)
    → Step 2: Aggregate approvers (based on bundle tier + notional thresholds [R40-R42])
    → Timeline: 8-10 days
  → IF ANY condition FAILS:
    → Route to FULL NPA or NPA LITE (based on risk severity)

ELSE IF NPA Lite - Impending Deal (B1):
  → NPA LITE B1 template [R12]
  → 48-hour notice to all SOPs
  → ANY SOP objection → Fallback to standard NPA Lite
  → No objections after 48 hours → Auto-approved

ELSE IF NPA Lite - NLNOC (B2):
  → NPA LITE B2 template [R13]
  → GFM COO + RMG-MLR joint decision
  → SOPs provide no-objection concurrence
  → Timeline: 5-10 days

ELSE IF NPA Lite - Addendum (B4):
  → NPA LITE B4 (Addendum) template [R15]
  → LIVE NPA only (not expired)
  → Minor changes, same GFM ID, validity NOT extended
  → Timeline: <5 days

CROSS-CUTTING OVERRIDES (apply to ALL tracks):
  → If cross-border → Add 5 mandatory SOPs [R07]
  → If notional >$20M → ROAE sensitivity required [R40]
  → If notional >$50M → Finance VP added [R41]
  → If notional >$100M → CFO added [R42]
  → If loop-back count ≥ 3 → Circuit breaker → Escalate to COO [R35]

END
```

---

## 8. Real NPA Reference Examples

**Purpose:** Provide LLM agents with real precedents for classification, track selection, and complexity assessment

---

### 8.1 TSG1917: Exchange-Listed IR Options (No NPA Required)
- **Product:** US Exchange-listed Interest Rate Futures and Options
- **Classification:** Existing (grandfathered product with T&M HK precedent)
- **Track:** No NPA Required
- **Key Features:** Model validation already completed, Murex infrastructure in place
- **Lesson:** When a product has clear precedent and no variations, the system routes to the lightest possible track
- **Pattern:** Clear precedent + no variations = lightest track

---

### 8.2 TSG2042: NAFMII Repo China (Full NPA)
- **Product:** Pledged Bond Repo in China Interbank Bond Market (CIBM)
- **Classification:** New-to-Group (new legal framework, new market)
- **Track:** Full NPA [R11: NTG → always Full NPA]
- **Complexity:**
  - New legal framework (NAFMII vs traditional GMRA)
  - Cross-border settlement via MBS China and ABOC [R07: 5 mandatory SOPs]
  - Restricted currency handling (CNY/CNH)
  - Chinese withholding tax and VAT implications
  - Daily trade volume: RMB 4 billion in a RMB 4 trillion market
- **Lesson:** Products involving new jurisdictions and legal frameworks ALWAYS go Full NPA, regardless of how "vanilla" the underlying instrument
- **Pattern:** New jurisdiction = NTG = Full NPA + all SOPs + PIR

---

### 8.3 TSG2055: ETF Subscription (Deal-Specific)
- **Product:** Nikko AM-ICBC SG China Bond ETF subscription
- **Classification:** Deal-specific
- **Track:** Individual deal approval
- **Lesson:** Some products require individual deal approval rather than standing NPA
- **Pattern:** Specific counterparty/deal = deal-specific approval

---

### 8.4 TSG2339: Swap Connect (Full NPA)
- **Product:** Interest Rate Swaps via Swap Connect platform (cross-border HK ↔ China)
- **Classification:** NTG (new infrastructure changes operational model)
- **Track:** Full NPA [R11]
- **Key Details:**
  - Booking: `IRD|IRS|Vanilla` typology with `CNH 7DREPO 3M SWAPCON` generator
  - Portfolio: `MBSSG AMM BCB1` mapped for margin requirements
  - Legal: ISDA with novation to HKEx OTC Clear
- **Lesson:** Infrastructure/market access products require Full NPA because they change the operational model fundamentally, even if IRS itself is an existing product
- **Pattern:** New infrastructure/platform = NTG even if underlying product exists

---

### 8.5 TSG2543: Complex Structured Product (Full NPA)
- **Product:** Complex structured product across multiple asset classes
- **Classification:** NTG (multi-asset structure = new complexity)
- **Track:** Full NPA [R11]
- **Lesson:** Multi-asset products trigger multiple SOP reviews and tend to have the longest timelines
- **Pattern:** Multi-asset complexity = Full NPA + extended timeline

---

### 8.6 Common Patterns Across Real NPAs

| Pattern | Observation |
|---------|-------------|
| **Booking schema matters enormously** | Murex typology, portfolio mapping, and generator specifications are scrutinized in every NPA |
| **Legal documentation is a frequent bottleneck** | ISDA, GMRA, NAFMII agreements take time |
| **Cross-border always adds complexity** | At minimum +5 mandatory sign-offs [R07] |
| **Tax is often underestimated** | Withholding tax, VAT, transfer pricing delays |
| **PIR conditions are common** | Most Full NPAs launch with 1-2 post-launch conditions [R30-R32] |

---

## END OF KB_NPA_Templates.md

**This document provides complete NPA template specifications for LLM agents.**

**Key Features:**
- 3 primary templates (Full NPA, NPA Lite with 4 sub-types B1-B4, Bundling)
- 47 base fields (RMG OR) expanded to 65+ for Full NPA with detailed definitions
- 40+ fields for NPA Lite (simplified, 4 sub-type variants)
- 75+ fields for Bundling (enhanced with 8-condition gate)
- Official Part A/B/C document structure aligned with RMG OR Version Jun 2025
- All 44 business rules (R01-R44) encoded as field validations and enforcement gates
- Notional threshold escalation ($20M/$50M/$100M) [R40-R42]
- Evergreen limits (6 limit types, special exemptions) [R43-R44]
- Circuit breaker (3 loop-backs → auto-escalate) [R35]
- 4 loop-back types tracked [R36]
- NPA Lite B1-B4 sub-types with eligibility criteria [R12-R15]
- Bundling 8-condition gate with Arbitration Team [R08, R17]
- Cross-cutting business rule gates table (13 NON-NEGOTIABLE rules)
- 5 real NPA reference examples with pattern analysis
- Complete template selection decision tree with all routing logic
- Validation types & error messages
- Data sources for auto-fill (CRM, MINV, Bloomberg, Historical NPAs)
- Dify KB chunking compatible (--- separators, <1000 tokens per chunk)

**Business Rule Coverage:** All 44 rules from Architecture Gap Register (R01-R44) are referenced or encoded.

**Usage:** Upload to Dify KB, link to Template Auto-Fill Engine, Product Ideation Agent, Document Checklist Agent

**Total Length:** ~30,000 words | ~55 KB
