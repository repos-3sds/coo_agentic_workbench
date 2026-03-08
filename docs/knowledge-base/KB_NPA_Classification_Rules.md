# KB_NPA_Classification_Rules.md
## Two-Stage Classification Logic for NPA Products

**Document Version:** 1.0  
**Last Updated:** December 31, 2025  
**Purpose:** Complete classification rules for LLM agents to determine (1) Product Type and (2) Approval Track

---

## Table of Contents

1. [Overview](#1-overview)
2. [Stage 1: Product Type Classification](#2-stage-1-product-type-classification)
3. [Stage 2: Approval Track Selection](#3-stage-2-approval-track-selection)
4. [Priority & Precedence Rules](#4-priority--precedence-rules)
5. [Edge Cases & Resolution Logic](#5-edge-cases--resolution-logic)
6. [Confidence Scoring Guidelines](#6-confidence-scoring-guidelines)
7. [Examples & Decision Trees](#7-examples--decision-trees)

---

## 1. Overview

### The Two-Stage Classification Model

**Stage 1: Product Type Classification** (WHAT is this?)
- Output: **NTG** (New-to-Group) | **Variation** | **Existing**
- Purpose: Determine novelty and risk level

**Stage 2: Approval Track Selection** (HOW to approve?)
- Output: **Full NPA** | **NPA Lite** | **Bundling** | **Evergreen** | **Prohibited**
- Purpose: Route to appropriate approval workflow

### Critical Principles

1. **ALWAYS complete Stage 1 before Stage 2**
2. **Stage 1 classification drives Stage 2 routing**
3. **Multiple rules may apply → Use priority order**
4. **When in doubt → Default to most conservative (Full NPA)**
5. **Prohibited check is FIRST → Hard stop, no exceptions**

---

## 2. Stage 1: Product Type Classification

### Classification 1: New-to-Group (NTG)

**Definition:**  
MBS Group has **NEVER** done this before, anywhere, in any form.

**Priority:** HIGHEST (if NTG, automatically → Full NPA in Stage 2)

#### NTG Criteria (ANY triggers NTG)

**Category A: Product Novelty (Criteria 1-6)**

**Criterion 1: New Asset Class**
- **Condition:** Asset class not in MBS product catalog
- **Examples:**
  - ✅ Cryptocurrency derivatives (MBS never traded crypto)
  - ✅ Carbon credit derivatives (new asset class)
  - ✅ NFT-backed lending (blockchain assets)
  - ❌ FX Options (existing asset class: FX)

**Criterion 2: New Product Type Within Asset Class**
- **Condition:** Asset class exists, but this specific product type does not
- **Examples:**
  - ✅ Credit Default Swaps (MBS trades credit derivatives, but never CDS)
  - ✅ Barrier Options (MBS trades FX options, but never barrier style)
  - ✅ Digital Options (vanilla options exist, digitals do not)
  - ❌ Standard FX Forward (product type exists)

**Criterion 3: New Role in Product Ecosystem**
- **Condition:** MBS has distributed/brokered this product, but never as principal
- **Examples:**
  - ✅ Acting as market maker (previously only distributor)
  - ✅ Principal trading (previously only agency broker)
  - ✅ Proprietary position (previously only client facilitation)
  - ❌ Same role as before

**Criterion 4: New Distribution Channel**
- **Condition:** New method of delivering product to customers
- **Examples:**
  - ✅ Self-service mobile app (previously only via RM)
  - ✅ API-based trading (previously only phone/email)
  - ✅ White-label partner distribution (previously only MBS channels)
  - ❌ Same distribution channel

**Criterion 5: New Customer Segment**
- **Condition:** Product sold to different customer type than before
- **Examples:**
  - ✅ Retail customers (previously only institutional)
  - ✅ SME segment (previously only large corporates)
  - ✅ Non-residents (previously only residents)
  - ❌ Same customer segment

**Criterion 6: New Geography/Jurisdiction**
- **Condition:** First time offering product in this country/region
- **Examples:**
  - ✅ First FX derivatives in Vietnam
  - ✅ First structured products in Philippines
  - ✅ First crypto custody in Hong Kong
  - ❌ Same geography (e.g., Singapore → Singapore)

---

**Category B: Infrastructure & Operations (Criteria 7-12)**

**Criterion 7: New Exchange Membership**
- **Condition:** First time joining this exchange/platform
- **Examples:**
  - ✅ First time joining Singapore Exchange (SGX) for futures
  - ✅ First time on Chicago Mercantile Exchange (CME)
  - ✅ First time on Binance for crypto trading
  - ❌ Already member of this exchange

**Criterion 8: New Technology Platform**
- **Condition:** Requires new trading/booking/settlement system
- **Examples:**
  - ✅ Blockchain-based smart contract settlement
  - ✅ New core banking system for this product
  - ✅ AI-driven automated trading (first use of AI for execution)
  - ❌ Uses existing Murex/Calypso/Kondor systems

**Criterion 9: New Counterparty Type**
- **Condition:** First time transacting with this type of entity
- **Examples:**
  - ✅ Decentralized Autonomous Organization (DAO)
  - ✅ Central Bank Digital Currency (CBDC) issuer
  - ✅ Peer-to-peer lending platform
  - ❌ Standard corporate/bank counterparty

**Criterion 10: New Settlement Method**
- **Condition:** Settlement mechanism not used before
- **Examples:**
  - ✅ Blockchain settlement (previously only SWIFT)
  - ✅ Atomic swap (previously only gross settlement)
  - ✅ Instant settlement via RTGS (previously T+2)
  - ❌ Standard SWIFT/local clearing

**Criterion 11: New Collateral Structure**
- **Condition:** Collateral type or arrangement never used
- **Examples:**
  - ✅ NFT as collateral (previously only cash/securities)
  - ✅ Tri-party collateral management (previously bilateral)
  - ✅ Dynamic margining algorithm (previously static)
  - ❌ Standard cash collateral

**Criterion 12: New Accounting Treatment**
- **Condition:** Requires accounting methodology not used before
- **Examples:**
  - ✅ Fair value through P&L (previously amortized cost)
  - ✅ Hedge accounting for new product type
  - ✅ Embedded derivative bifurcation (first time)
  - ❌ Same accounting as existing products
- **Action Required:** Consult Group Finance if uncertain

---

**Category C: Regulatory & Compliance (Criteria 13-16)**

**Criterion 13: New Regulatory Regime**
- **Condition:** Subject to regulations MBS hasn't navigated before
- **Examples:**
  - ✅ MiFID II compliance (first EU product)
  - ✅ Dodd-Frank Title VII (first US swaps)
  - ✅ MAS Guidelines on Digital Assets (first crypto product)
  - ❌ Standard MAS 656/643 compliance (familiar)

**Criterion 14: New Booking Desk/Entity**
- **Condition:** Product booked in legal entity never used for this purpose
- **Examples:**
  - ✅ Booking in MBS Bank Ltd (previously only MBSH)
  - ✅ Booking in newly established SPV
  - ✅ Cross-border booking (SG booking for HK client)
  - ❌ Same booking entity as before

**Criterion 15: New Compliance Requirement**
- **Condition:** Requires compliance checks not done before
- **Examples:**
  - ✅ FATCA reporting (first US person product)
  - ✅ CRS compliance (first cross-border reportable)
  - ✅ EMIR trade reporting (first EU derivative)
  - ❌ Standard KYC/AML (already doing)

**Criterion 16: New Legal Documentation**
- **Condition:** Legal framework never used before
- **Examples:**
  - ✅ ISDA 2002 with custom CSA (previously only ISDA 1992)
  - ✅ Smart contract legal framework
  - ✅ First use of GMRA for repo
  - ❌ Standard MBS T&Cs

---

**Category D: Risk & Pricing (Criteria 17-20)**

**Criterion 17: New Pricing Methodology**
- **Condition:** Valuation approach not used before
- **Examples:**
  - ✅ Monte Carlo simulation (previously only Black-Scholes)
  - ✅ Machine learning pricing model
  - ✅ Market-making spread (previously mid-price only)
  - ❌ Standard yield curve discounting

**Criterion 18: New Risk Measurement**
- **Condition:** Risk metric/methodology not used before
- **Examples:**
  - ✅ VaR for new product type
  - ✅ Counterparty CVA calculation (first time)
  - ✅ Climate risk stress testing (first ESG product)
  - ❌ Standard VaR/Greeks

**Criterion 19: New Third-Party Dependency**
- **Condition:** Relies on external vendor/service not used before
- **Examples:**
  - ✅ Fintech partner for product distribution
  - ✅ New data vendor for pricing
  - ✅ Cloud provider for trade processing
  - ❌ Existing Bloomberg/Reuters feeds

**Criterion 20: New Operational Model**
- **Condition:** Workflow/process never done before
- **Examples:**
  - ✅ Fully automated STP (previously manual)
  - ✅ 24/7 trading (previously market hours only)
  - ✅ Algorithmic execution (previously manual)
  - ❌ Standard trade capture workflow

---

#### NTG Decision Logic

```
IF ANY of Criteria 1-20 is TRUE:
  → Classification = "New-to-Group (NTG)"
  → Confidence = HIGH (if multiple criteria met)
  → Confidence = MEDIUM (if 1 criterion met, but borderline)
  
ELSE:
  → Continue to Variation check
```

#### NTG Mandatory Requirements

When classified as NTG, the following are **AUTOMATIC**:

1. **PAC Approval REQUIRED** (Product Approval Committee, before NPA starts)
2. **Approval Track = Full NPA** (never NPA Lite)
3. **All Sign-Off Parties** (Credit, Finance, Legal, MLR, Operations, Technology, Compliance)
4. **PIR Mandatory** (Post-Implementation Review within 6 months of launch)
5. **Validity Period = 1 year** (can extend once for +6 months with unanimous SOP consent)

---

### Classification 2: Variation

**Definition:**  
Modification to an **existing** product that **alters the risk profile** for customer and/or bank.

**Priority:** MEDIUM (may route to Full NPA or NPA Lite depending on risk severity)

#### Variation Criteria (ANY triggers Variation)

**Criterion 1: Bundling/Combination**
- **Condition:** Two or more existing products combined
- **Examples:**
  - ✅ FX Option + Deposit → Dual Currency Deposit (DCD)
  - ✅ Loan + Interest Rate Swap → Synthetic Fixed Rate Loan
  - ✅ Equity Option + Capital Protection → Structured Note
  - ❌ Standalone FX Forward (not bundled)
- **Risk Assessment:** Check if bundling creates new risk not present in components

**Criterion 2: Cross-Book Structures**
- **Condition:** Product spans banking book AND trading book
- **Examples:**
  - ✅ Deposit (banking) linked to equity performance (trading)
  - ✅ Loan (banking) with commodity hedge (trading)
  - ✅ Credit facility (banking) with FX forward (trading)
  - ❌ Pure trading book derivative
- **Risk Assessment:** Capital treatment differs across books

**Criterion 3: Accounting Treatment Change**
- **Condition:** Different accounting from standard product
- **Examples:**
  - ✅ Accrual → Mark-to-market
  - ✅ Amortized cost → Fair value through P&L
  - ✅ Hedge accounting applied (first time for this product)
  - ❌ Same accounting as existing product
- **Action Required:** **MUST consult Group Finance** if accounting changes

**Criterion 4: Significant Manual Workarounds**
- **Condition:** System cannot handle product, requires offline processing
- **Examples:**
  - ✅ Manual Excel calculations for exotic payoff
  - ✅ Manual risk reporting (system can't calculate Greeks)
  - ✅ Manual settlement instructions (system limitation)
  - ❌ Fully automated STP
- **Risk Assessment:** Operational risk increases with manual steps

**Criterion 5: Sustainability Features/Labels**
- **Condition:** Product has ESG, green, social, or sustainability label
- **Examples:**
  - ✅ Green bond (standard bond + green label)
  - ✅ Sustainability-linked loan (interest tied to ESG KPIs)
  - ✅ Social impact investment
  - ❌ Standard bond without ESG label
- **Risk Assessment:** Greenwashing risk, ESG reporting requirements

**Criterion 6: Innovative/Advanced Technology**
- **Condition:** Uses technology not standard for MBS
- **Examples:**
  - ✅ Fintech partnership (e.g., robo-advisor, API integration)
  - ✅ Blockchain/DLT settlement
  - ✅ AI/ML for pricing/execution
  - ❌ Standard Murex/Calypso processing
- **Risk Assessment:** Technology risk, cybersecurity, vendor dependency

**Criterion 7: New Risks Not in Base Product**
- **Condition:** Variation introduces risk type not present before
- **Examples:**
  - ✅ Liquidity risk (base product has market risk only)
  - ✅ Counterparty credit risk (base product cash-settled)
  - ✅ FX risk (base product single currency)
  - ❌ Same risk profile as base product

**Criterion 8: Structural Changes**
- **Condition:** Payoff/cashflow structure differs materially
- **Examples:**
  - ✅ Barrier added to vanilla option (knock-in/knock-out)
  - ✅ Digital payout added (binary option)
  - ✅ Path-dependent feature (Asian averaging)
  - ❌ Same payoff structure

---

#### Variation Decision Logic

```
IF ANY of Variation Criteria 1-8 is TRUE:
  → Classification = "Variation"
  → Assess Risk Severity:
     
     IF (High Risk):
       • Criteria 3 (accounting change) → HIGH RISK
       • Criteria 4 (manual workarounds) → HIGH RISK
       • Criteria 6 (innovative tech) + new vendor → HIGH RISK
       • Multiple criteria (3+) → HIGH RISK
       → Approval Track = Full NPA (Stage 2)
     
     ELSE IF (Medium/Low Risk):
       • Single criterion, low impact → MEDIUM RISK
       • No new risk types introduced → LOW RISK
       → Approval Track = NPA Lite (Stage 2)

ELSE:
  → Continue to Existing check
```

---

### Classification 3: Existing

**Definition:**  
Product **already approved** elsewhere in MBS Group, now being introduced to new location/desk/entity.

**Priority:** LOWEST (most likely NPA Lite or Evergreen)

#### Existing Sub-Classifications

**Sub-Classification A: Active - Reference Existing**
- **Condition:** Original NPA is LIVE and VALID (approved <1 year ago, actively traded)
- **Examples:**
  - ✅ FX Forward approved in Singapore (6 months ago), now Hong Kong wants it
  - ✅ Interest Rate Swap approved in London (3 months ago), now Singapore wants it
  - ❌ Original NPA expired (>1 year ago)
- **Approval Track:** NPA Lite - Reference Existing OR Evergreen (if on list)

**Sub-Classification B: Dormant (<3 years)**
- **Condition:** Product approved before but NO transactions in last 12 months, dormant period <3 years
- **Examples:**
  - ✅ Commodity Swap approved 2023, last trade Feb 2024, now Dec 2025 (dormant 22 months)
  - ✅ Credit derivative approved 2024, never traded, now reactivating (dormant 18 months)
  - ❌ Dormant >3 years (36 months)
- **Approval Track:** NPA Lite - Fast-Track Dormant Reactivation (48-hour notice period)

**Sub-Classification C: Dormant (>3 years)**
- **Condition:** Product approved but dormant for 3+ years
- **Examples:**
  - ✅ Exotic option approved 2020, no trades since, now 2025 (dormant 60 months)
  - ❌ Dormant <3 years
- **Approval Track:** Full Assessment Required by GFM COO (may be Full NPA or NPA Lite)

**Sub-Classification D: Expired - No Variations**
- **Condition:** Original NPA validity period expired, but NO changes to product
- **Examples:**
  - ✅ NPA approved Jan 2024, never launched, now Jan 2026 (expired 1 year)
  - ✅ NPA valid until Dec 2024, now reactivating Jan 2025 (just expired)
  - ❌ Variations introduced (not same product)
- **Approval Track:** NPA Lite - Reactivation (PIR required if original was Full NPA)

**Sub-Classification E: Expired - With Variations**
- **Condition:** Original NPA expired AND product has changed
- **Examples:**
  - ✅ Expired NPA, now with different tenor/notional limits
  - ✅ Expired NPA, now with new counterparty type
  - ❌ Exact same product as original
- **Approval Track:** Full NPA (treat as effectively NTG due to changes)

**Sub-Classification F: Active - Evergreen Eligible**
- **Condition:** Product on pre-approved Evergreen list, within limits
- **Examples:**
  - ✅ Standard FX Forward (on Evergreen list, notional <$10M, A- rated counterparty)
  - ✅ Plain vanilla Interest Rate Swap (on Evergreen list, <$5M, within monthly limit)
  - ❌ Exotic barrier option (not on Evergreen list)
- **Approval Track:** Evergreen (auto-approved if within limits)
- **Limit Checks Required:**
  - Notional cap per deal (e.g., $10M)
  - Aggregate notional cap (e.g., $500M per year)
  - Deal count cap (e.g., 10 deals per month)
  - Counterparty rating minimum (e.g., A- or above)

---

#### Existing Decision Logic

```
IF (Original NPA status == ACTIVE AND validity_remaining > 0):
  
  IF (Product on Evergreen list):
    Check Evergreen Limits:
      IF (notional <= cap AND aggregate <= annual_cap AND deal_count <= monthly_cap):
        → Classification = "Existing - Evergreen"
        → Approval Track = Evergreen (auto-approve, trade same day)
      ELSE:
        → Classification = "Existing - Reference"
        → Approval Track = NPA Lite
  
  ELSE:
    → Classification = "Existing - Reference"
    → Approval Track = NPA Lite

ELSE IF (Original NPA status == DORMANT):
  
  IF (Dormant period < 3 years):
    Check Fast-Track Eligibility:
      IF (PIR completed AND no variations AND not prohibited):
        → Classification = "Existing - Dormant Fast-Track"
        → Approval Track = NPA Lite (48-hour notice)
      ELSE:
        → Classification = "Existing - Dormant Standard"
        → Approval Track = NPA Lite
  
  ELSE IF (Dormant period >= 3 years):
    → Classification = "Existing - Dormant Long-Term"
    → Approval Track = Full Assessment (GFM COO decides Full NPA vs NPA Lite)

ELSE IF (Original NPA status == EXPIRED):
  
  IF (No variations detected):
    → Classification = "Existing - Expired Reactivation"
    → Approval Track = NPA Lite (PIR required)
  
  ELSE:
    → Classification = "Existing - Expired with Variations"
    → Approval Track = Full NPA
```

---

## 3. Stage 2: Approval Track Selection

**Purpose:** Determine the workflow path based on Stage 1 classification and additional factors.

### Track A: Full NPA

**When to Use:**
- ✅ ALL New-to-Group (NTG) products (mandatory)
- ✅ High-risk Variations (accounting changes, manual workarounds, innovative tech)
- ✅ Expired products with variations
- ✅ Cross-border products (override rule)
- ✅ High notional (override rule)
- ✅ Low counterparty rating (override rule)

**Required Approvals:**
- Credit (RMG-Credit)
- Finance (Group Product Control)
- Legal (GLC)
- MLR (Market & Liquidity Risk)
- Operations
- Technology
- Compliance

**Additional Approvals (if applicable):**
- PAC (Product Approval Committee) - MANDATORY for NTG before NPA starts
- CEO - if notional >$100M or strategic importance
- Group Risk Head - if high risk or low counterparty rating (<BB-)

**Timeline SLA:** 12 days (baseline), 4 days (AI-assisted target)

**PIR Required:** Yes (within 6 months of launch)

**Validity Period:** 1 year (can extend once for +6 months with unanimous SOP consent)

---

### Track B: NPA Lite

**When to Use:**
- ✅ Low/Medium risk Variations
- ✅ Existing - Reference (active NPA being used in new location)
- ✅ Existing - Dormant (<3 years)
- ✅ Existing - Expired Reactivation (no variations)

**Required Approvals (Reduced Set):**
- Credit
- Finance
- MLR (if market/liquidity risk material)
- Legal (if new counterparty or complex structure)
- Operations (if cross-border or new settlement)

**Timeline SLA:** 
- Standard NPA Lite: 5 business days
- Fast-Track Dormant Reactivation: 48 hours (2 business days)

**PIR Required:** 
- If original NPA was Full NPA (NTG): Yes
- If no conditions imposed: No

**Validity Period:** Same as original NPA (if reference) or 1 year (if new)

---

### Track C: Bundling Approval

**When to Use (ANY triggers Bundling):**

**Bundling Trigger 1: Multiple Underlyings**
- **Condition:** Product payoff references >1 underlying asset
- **Example:** Basket option on 5 stocks, dual currency deposit, rainbow option

**Bundling Trigger 2: User Keywords**
- **Condition:** User mentions "bundle", "package", "suite", "combined", "multi-product"
- **Example:** "We want to offer a package of FX + IRS + commodity hedge"

**Bundling Trigger 3: Multiple Product Types**
- **Condition:** >1 distinct product type mentioned in single request
- **Example:** "FX Forward AND Interest Rate Swap for same client"

**Bundling Trigger 4: Multiple Jurisdictions**
- **Condition:** Product involves >1 country/regulatory regime
- **Example:** Singapore booking, Hong Kong settlement, US counterparty

**Bundling Trigger 5: Multiple Counterparties**
- **Condition:** Trade with >1 counterparty as part of structure
- **Example:** Tri-party repo, multi-party securitization

**Bundling Trigger 6: Multiple Booking Desks**
- **Condition:** Product booked across >1 desk/entity
- **Example:** FX desk books FX leg, Rates desk books interest rate leg

**Bundling Trigger 7: Phased Rollout**
- **Condition:** User mentions "phase 1", "pilot", "initial launch then expand"
- **Example:** "Start with Singapore, then roll out to Hong Kong and London"

**Bundling Trigger 8: Reference to Existing Bundle**
- **Condition:** User says "similar to TSG1234" where TSG1234 was bundled
- **Example:** "Same structure as NPA TSG5678 which had 3 products"

**Bundling Decision Logic:**
```
IF ANY Bundling Trigger 1-8 is TRUE:
  → Approval Track = Bundling Approval
  → Special Handling: Arbitration Team reviews bundling approach
  → Timeline: Longer than standard NPA (case-by-case)
  → Approval: Highest tier among bundled products
```

**Example:**
- Bundle: 3 FX Forwards ($3M each = $9M total)
- Individual classification: Each is "Existing" → would be NPA Lite
- Bundled classification: Aggregate $9M → NPA Lite (but reviewed as package)
- If aggregate $60M → Full NPA (bundling pushes to higher tier)

---

### Track D: Evergreen

**Definition:** Pre-approved products that can be traded immediately with minimal/no approval.

**Eligibility Criteria (ALL must be met):**

**Criterion 1: Product on Evergreen List**
- Maintain centralized list of Evergreen-eligible products
- Examples: Standard FX Forward, Plain Vanilla IRS, Standard FX Option
- NOT eligible: Exotic options, structured products, new asset classes

**Criterion 2: Within Notional Limits**
- Per-deal notional cap (e.g., $10M for FX, $5M for IRS)
- Check: `notional_usd <= evergreen_notional_cap`

**Criterion 3: Within Aggregate Limits**
- Monthly aggregate cap (e.g., $50M per desk)
- Annual aggregate cap (e.g., $200M per desk)
- Check: `current_month_total + notional <= monthly_cap`

**Criterion 4: Within Deal Count Limits**
- Monthly deal count (e.g., 10 deals per desk)
- Check: `current_month_deal_count < monthly_deal_cap`

**Criterion 5: Counterparty Rating**
- Minimum rating threshold (e.g., A- or above)
- Check: `counterparty_rating >= "A-"`

**Criterion 6: Validity Period Active**
- Evergreen approval valid for 3 years from original approval
- Check: `approval_date + 36 months >= today`

**Criterion 7: No Variations**
- Product must match pre-approved structure exactly
- Check: No changes to tenor limits, settlement, payoff, etc.

**Evergreen Decision Logic:**
```
IF (Product on Evergreen list):
  
  Check ALL Limits:
    notional_check = (notional <= notional_cap)
    aggregate_check = (current_aggregate + notional <= annual_cap)
    deal_count_check = (current_count < monthly_cap)
    rating_check = (counterparty_rating >= minimum_rating)
    validity_check = (approval_date + 36 months >= today)
    variation_check = (no_variations == TRUE)
  
  IF (ALL checks PASS):
    → Approval Track = Evergreen
    → Action: Auto-approve, trade immediately, log transaction
  
  ELSE:
    → Approval Track = NPA Lite (one or more limits breached)
    → Reason: Specify which limit breached
```

**Auto-Approval Process:**
1. System checks all criteria automatically
2. If PASS: Trade executed same day, logged in Evergreen usage tracker
3. If FAIL: Route to NPA Lite, notify Maker which limit breached

---

### Track E: Prohibited

**Definition:** Products that are **HARD STOP** - cannot proceed under any circumstances.

**Prohibited Check is FIRST** - run before any other classification.

**Prohibited Sources (Check ALL):**

**Source 1: Internal Bank Policy**
- Products banned by MBS Group policy
- Check: Query Supabase `prohibited_products` table
- Example: Crypto derivatives (if bank policy prohibits)

**Source 2: Regulatory Restrictions**
- MAS prohibitions (Singapore)
- CFTC prohibitions (US)
- Local country prohibitions
- Check: Query KB_Global_Regulatory_Policies for prohibited instruments
- Example: Certain structured products banned by MAS Notice 1015

**Source 3: Sanctions/Embargoes**
- OFAC sanctions (US)
- UN sanctions
- EU sanctions
- Check: Real-time API call to sanctions database
- Example: Trading with sanctioned Russian entities

**Source 4: Jurisdictional Prohibitions**
- Country/region where MBS cannot operate
- Check: Cross-reference jurisdiction against approved list
- Example: Trading in North Korea, Iran (sanctioned countries)

**Source 5: Counterparty Prohibitions**
- Specific counterparties on prohibited list
- Check: Query `prohibited_products` table for counterparty name
- Example: Counterparty previously defaulted, added to prohibited list

**Prohibited Decision Logic:**
```
Prohibited Check (RUN FIRST):

Check 1: Query prohibited_products table
  SELECT * FROM prohibited_products 
  WHERE product_type = {input_product_type}
    OR jurisdiction = {input_jurisdiction}
    OR counterparty_name = {input_counterparty}
  
  IF (match found):
    → HARD STOP
    → Approval Track = Prohibited
    → Reason: {prohibition_reason from database}
    → Action: Notify user, cannot proceed

Check 2: Sanctions API
  Call OFAC API: Check counterparty against sanctions list
  
  IF (sanctioned):
    → HARD STOP
    → Approval Track = Prohibited
    → Reason: "Counterparty on OFAC sanctions list"
    → Action: Escalate to Compliance immediately

Check 3: Regulatory KB search
  RAG Query KB_Global_Regulatory_Policies:
    "Is {product_type} prohibited in {jurisdiction}?"
  
  IF (prohibited found):
    → HARD STOP
    → Approval Track = Prohibited
    → Reason: {regulatory citation}
    → Action: Notify user, suggest alternative jurisdictions

IF (No prohibitions found):
  → Continue to Stage 1 classification
```

---

## 4. Priority & Precedence Rules

### Rule 1: Prohibited Check is FIRST

**Always run Prohibited check before any classification.**

```
Priority Order:
1. Prohibited check (HARD STOP if match)
2. Stage 1: Product Type (NTG > Variation > Existing)
3. Stage 2: Approval Track (with overrides)
```

---

### Rule 2: NTG Always Routes to Full NPA

**NTG classification ALWAYS results in Full NPA, no exceptions.**

```
IF (Stage 1 = "NTG"):
  → Stage 2 = "Full NPA" (mandatory)
  → Cannot be overridden by Evergreen, NPA Lite, etc.
```

---

### Rule 3: Override Rules Trump Base Classification

**Certain attributes override the base classification logic.**

**Override 1: Cross-Border Mandate**
- **Rule:** ALL cross-border products require Full NPA
- **Priority:** Highest (after NTG)
- **Logic:**
  ```
  IF (is_cross_border == TRUE):
    → Approval Track = Full NPA
    → Required Approvers = ["Credit", "Finance", "Legal", "Operations", "Technology"]
    → Reason: "Cross-border products require comprehensive review across jurisdictions"
  ```
- **Example:** 
  - Base classification: "Existing - Reference" (would be NPA Lite)
  - Override: Cross-border flag = TRUE
  - Result: Full NPA (cross-border override)

**Override 2: High Notional Threshold**
- **Rule:** Notional >$50M requires Full NPA
- **Priority:** High
- **Logic:**
  ```
  IF (notional_usd > 50000000):
    → Approval Track = Full NPA
    → Additional Approver: Regional Risk Head
    
  IF (notional_usd > 100000000):
    → Approval Track = Full NPA
    → Additional Approver: CEO
  ```
- **Example:**
  - Base classification: "Variation - Low Risk" (would be NPA Lite)
  - Override: Notional = $75M
  - Result: Full NPA (high notional override)

**Override 3: Low Counterparty Rating**
- **Rule:** Counterparty rating BBB- or below requires Full NPA
- **Priority:** High
- **Logic:**
  ```
  IF (counterparty_rating in ["BBB-", "BB+", "BB", "BB-", "B+", "B", "B-", "CCC+", "CCC", "CCC-"]):
    → Approval Track = Full NPA
    → Required Approvers: Add "Risk Management"
    → Reason: "Elevated credit risk requires thorough due diligence"
  ```
- **Example:**
  - Base classification: "Existing - Reference" (would be NPA Lite)
  - Override: Counterparty rating = BB+
  - Result: Full NPA (low rating override)

**Override 4: Bundling Detection**
- **Rule:** If ANY bundling trigger detected, route to Bundling Approval
- **Priority:** Medium (after cross-border, notional, rating)
- **Logic:** See Track C: Bundling Approval section

**Override 5: Evergreen Limit Breach**
- **Rule:** If Evergreen criteria met BUT any limit breached, downgrade to NPA Lite
- **Priority:** Low (final check)
- **Logic:**
  ```
  IF (Product on Evergreen list BUT notional > cap):
    → Approval Track = NPA Lite (not Evergreen)
    → Reason: "Notional exceeds Evergreen cap ($10M)"
  ```

---

### Rule 4: Multiple Overrides → Most Conservative Wins

**If multiple override rules apply, use the most conservative (Full NPA > NPA Lite > Evergreen).**

**Example:**
- Base classification: "Existing - Evergreen Eligible"
- Override 1: Cross-border = TRUE → Full NPA
- Override 2: Notional = $8M → NPA Lite (under $10M, but >$5M)
- **Result:** Full NPA (cross-border is most conservative)

---

### Rule 5: Confidence <75% → Escalate to Human

**If LLM confidence score <75%, escalate rather than auto-classify.**

```
IF (confidence_score < 0.75):
  → Action: Escalate to human review
  → Escalation Path:
     - Confidence 0.60-0.75 → GFM COO + RMG-MLR review
     - Confidence <0.60 → NPA Governance Forum review
  → Flag: "Low confidence classification - manual review required"
```

---

## 5. Edge Cases & Resolution Logic

### Edge Case 1: Conflicting Signals

**Scenario:** Multiple classification criteria point to different outcomes.

**Example:**
- Criterion 1: Product type exists (→ not NTG)
- Criterion 8: New technology platform (→ NTG)

**Resolution:**
```
IF (conflicting_signals):
  → Use most conservative classification (default to NTG if any NTG criterion met)
  → Reasoning: Better to over-scrutinize than under-scrutinize
  → Confidence score: Lower (0.65-0.80) due to ambiguity
```

---

### Edge Case 2: Borderline Notional

**Scenario:** Notional exactly at threshold (e.g., exactly $50M).

**Resolution:**
```
IF (notional_usd == threshold):
  → Treat as EXCEEDING threshold (conservative)
  → Example: $50M notional → Full NPA (same as $50.01M)
  → Reasoning: "At threshold" = higher risk, requires full review
```

---

### Edge Case 3: Multiple Variations in Bundle

**Scenario:** Bundled product where each component is a variation.

**Resolution:**
```
IF (bundling_detected AND all_components_are_variations):
  → Approval Track = Bundling (special handling)
  → Risk Assessment: Aggregate risk of all variations
  → Approvals: Superset of all approvers needed for components
  → Example: FX Option (variation) + IRS (variation) → Bundling with Finance+Credit+Legal+MLR+Ops+Tech
```

---

### Edge Case 4: Evergreen with One Limit Breach

**Scenario:** Product meets 6 out of 7 Evergreen criteria, but one limit breached.

**Resolution:**
```
IF (evergreen_eligible BUT one_limit_breached):
  → Approval Track = NPA Lite (not Evergreen)
  → Reason: Specify which limit breached
  → Example: "Product qualifies for Evergreen but notional $12M exceeds cap $10M → NPA Lite required"
  → User Option: Reduce notional to $10M to qualify for Evergreen
```

---

### Edge Case 5: Dormant Period Exactly 3 Years

**Scenario:** Product dormant for exactly 36 months (3 years).

**Resolution:**
```
IF (dormant_period_months == 36):
  → Treat as >=3 years (conservative)
  → Approval Track = Full Assessment by GFM COO
  → Reasoning: Exactly at threshold, treat as long-term dormant
```

---

### Edge Case 6: Cross-Border BUT Low Risk

**Scenario:** Cross-border flag TRUE, but product is simple, low risk, low notional.

**Resolution:**
```
IF (is_cross_border == TRUE):
  → ALWAYS Full NPA (no exceptions)
  → Reasoning: Cross-border complexity (regulatory, settlement, operations) requires comprehensive review regardless of product simplicity
  → Override: Cross-border mandate is absolute
```

---

### Edge Case 7: User Challenges Classification

**Scenario:** LLM classifies as NTG, but user says "We've done this before."

**Resolution:**
```
IF (user_challenges_classification):
  → Present evidence to user:
     "RAG similarity search returned 0 results >90%"
     "Product type 'X' not found in product catalog"
     "No historical NPAs found for '{user_description}'"
  
  → Ask user: "Can you provide NPA ID of previous approval?"
  
  IF (user provides NPA ID):
    → Query Supabase: SELECT * FROM npa_instances WHERE npa_id = {user_npa_id}
    → If found: Reclassify as "Existing - Reference"
    → If not found: Maintain "NTG", explain no record found
  
  ELSE:
    → Escalate: "GFM COO will review classification (manual review)"
```

---

### Edge Case 8: Accounting Treatment Uncertain

**Scenario:** LLM unsure if product requires different accounting.

**Resolution:**
```
IF (accounting_treatment_uncertain):
  → Flag: "Accounting treatment to be confirmed"
  → Action: MUST consult Group Finance before final classification
  → Provisional Classification: "Variation - Pending Finance Review"
  → Do NOT auto-approve until Finance confirms
```

---

### Edge Case 9: Prohibited in One Jurisdiction, Not Another

**Scenario:** Product prohibited in Singapore but allowed in Hong Kong.

**Resolution:**
```
IF (prohibited_in_jurisdiction[A] BUT allowed_in_jurisdiction[B]):
  → Check user's intended jurisdiction
  
  IF (user_jurisdiction == jurisdiction[A]):
    → HARD STOP (Prohibited)
    → Message: "This product is prohibited in Singapore per MAS Notice XYZ. Consider alternative jurisdictions: Hong Kong, London."
  
  ELSE IF (user_jurisdiction == jurisdiction[B]):
    → Continue classification (not prohibited)
    → Proceed with Stage 1 and Stage 2
```

---

### Edge Case 10: Bundling vs Variation

**Scenario:** Is a bundled product a "Variation" or just "Bundling"?

**Resolution:**
```
Bundling takes precedence over Variation:

IF (bundling_detected):
  → Approval Track = Bundling (regardless of whether components are variations)
  → Bundling Approval process handles variation assessment within bundle
  
Example:
  - FX Option (variation) + IRS (variation) → Bundling (not "Variation")
  - Single FX Option with barrier → Variation (not bundling, just modified)
```

---

## 6. Confidence Scoring Guidelines

### Confidence Score Bands

**High Confidence (0.90-1.00)**
- Multiple classification criteria clearly met
- No conflicting signals
- Historical precedents found (for Existing classification)
- Clear-cut cases (e.g., exact match to NTG criterion)

**Medium-High Confidence (0.75-0.89)**
- Single classification criterion clearly met
- Minor ambiguity, but preponderance of evidence supports classification
- Some historical precedents (for Existing), but not exact match

**Medium Confidence (0.60-0.74)**
- Borderline case
- Conflicting signals present
- Limited historical precedents
- **Action:** Escalate to GFM COO + RMG-MLR for manual review

**Low Confidence (<0.60)**
- High ambiguity
- Multiple conflicting signals
- No clear classification criteria met
- **Action:** Escalate to NPA Governance Forum for manual review

---

### Confidence Calculation Methodology

**For NTG Classification:**
```
Confidence = Base Score + Evidence Boost - Ambiguity Penalty

Base Score:
  - 1 NTG criterion clearly met → 0.85
  - 2+ NTG criteria met → 0.95
  - Borderline criterion → 0.70

Evidence Boost:
  - RAG similarity = 0% (no similar products) → +0.05
  - User explicitly says "never done before" → +0.05
  - Product type not in catalog → +0.05

Ambiguity Penalty:
  - User description vague → -0.10
  - Conflicting signals (some criteria point to Variation) → -0.15
  - Borderline on multiple criteria → -0.20

Final Confidence = Clamp(Base + Boost - Penalty, 0.0, 1.0)
```

**For Existing Classification:**
```
Confidence = Similarity Score × Validity Factor

Similarity Score:
  - RAG match >95% → 0.95
  - RAG match 85-95% → 0.85
  - RAG match 75-85% → 0.75
  - RAG match <75% → 0.60 (escalate)

Validity Factor:
  - Original NPA active, valid → 1.0
  - Original NPA dormant <1 year → 0.95
  - Original NPA dormant 1-3 years → 0.85
  - Original NPA dormant >3 years → 0.70
  - Original NPA expired, no variations → 0.80
  - Original NPA expired, with variations → 0.60

Final Confidence = Similarity × Validity
```

**For Variation Classification:**
```
Confidence = Criterion Match Strength × Risk Clarity

Criterion Match Strength:
  - Single criterion clearly met → 0.80
  - Multiple criteria (2-3) met → 0.90
  - All criteria (4+) met → 0.95
  - Borderline criterion → 0.65

Risk Clarity:
  - Risk impact clearly defined (High/Medium/Low) → 1.0
  - Risk impact ambiguous → 0.85
  - Risk impact unknown → 0.60 (escalate)

Final Confidence = Match × Clarity
```

---

## 7. Examples & Decision Trees

### Example 1: Clear-Cut NTG

**User Input:**
```
Product: Credit Default Swaps (CDS)
Description: We want to start trading CDS on investment-grade corporates
Notional: $10M per trade
Counterparty: AAA-rated bank
Jurisdiction: Singapore
```

**LLM Classification Process:**

**Step 1: Prohibited Check**
```
Query prohibited_products: "Credit Default Swap" + "Singapore"
Result: No match (not prohibited)
→ Continue
```

**Step 2: Stage 1 Classification**
```
Check NTG Criteria:
  - Criterion 2: New product type? 
    → Query historical NPAs: SELECT * FROM npa_instances WHERE product_type LIKE '%CDS%'
    → Result: 0 matches
    → ✅ MBS has NEVER traded CDS → NTG Criterion 2 MET

Confidence Calculation:
  - Base: 0.85 (1 criterion clearly met)
  - Evidence boost: +0.05 (RAG similarity 0%, no CDS in catalog)
  - Total: 0.90 (HIGH CONFIDENCE)

Classification: "New-to-Group (NTG)"
```

**Step 3: Stage 2 Approval Track**
```
IF (NTG):
  → Approval Track = "Full NPA" (mandatory)
  → PAC Approval Required: TRUE (before NPA starts)
  → Required Approvers: ["Credit", "Finance", "Legal", "MLR", "Operations", "Technology", "Compliance"]
  → PIR Mandatory: TRUE (within 6 months)
  → Validity: 1 year
```

**LLM Output:**
```json
{
  "stage1_classification": "New-to-Group (NTG)",
  "stage2_approval_track": "Full NPA",
  "confidence": 0.90,
  "reasoning": "MBS has never traded Credit Default Swaps before. This constitutes a new product type for the entire Group, triggering NTG classification per Criterion 2.",
  "evidence": [
    "Historical NPA search returned 0 results for 'CDS' or 'Credit Default Swap'",
    "Product type 'CDS' not found in MBS product catalog",
    "RAG similarity search: 0% match to existing products"
  ],
  "mandatory_requirements": {
    "pac_approval": "REQUIRED before NPA submission",
    "pir": "REQUIRED within 6 months of launch",
    "validity_period": "1 year (extendable once for +6 months)"
  },
  "required_approvers": [
    {"department": "Credit", "level": "RMG-Credit"},
    {"department": "Finance", "level": "Group Product Control"},
    {"department": "Legal", "level": "GLC"},
    {"department": "MLR", "level": "Market & Liquidity Risk"},
    {"department": "Operations", "level": "Ops Head"},
    {"department": "Technology", "level": "Tech Lead"},
    {"department": "Compliance", "level": "Compliance Officer"}
  ],
  "estimated_timeline": "4 days (AI-assisted target)",
  "source": "KB_NPA_Classification_Rules - Section 2, NTG Criterion 2"
}
```

---

### Example 2: Variation (Low Risk)

**User Input:**
```
Product: FX Option with Sustainability Link
Description: Standard FX Option, but interest rate tied to client's ESG score
Notional: $5M
Counterparty: A-rated corporate
Jurisdiction: Singapore (same as existing FX Options)
```

**LLM Classification Process:**

**Step 1: Prohibited Check**
```
Result: Not prohibited
→ Continue
```

**Step 2: Stage 1 Classification**
```
Check NTG Criteria:
  - Criterion 1 (new asset class): ❌ FX exists
  - Criterion 2 (new product type): ❌ FX Option exists
  - Criterion 6 (new geography): ❌ Singapore (already doing FX there)

Check Variation Criteria:
  - Criterion 5: Sustainability features/labels?
    → ✅ ESG linkage = sustainability feature → VARIATION MET

Risk Severity Assessment:
  - Single criterion (Criterion 5)
  - No accounting change
  - No new technology
  - No manual workarounds
  → Risk = LOW

Confidence: 0.82 (medium-high)

Classification: "Variation (Low Risk)"
```

**Step 3: Stage 2 Approval Track**
```
IF (Variation AND Risk = LOW):
  → Approval Track = "NPA Lite"
  → Required Approvers: ["Credit", "Finance", "MLR"]
  → PIR: Only if conditions imposed
  → Timeline: 5 business days
```

**LLM Output:**
```json
{
  "stage1_classification": "Variation (Low Risk)",
  "stage2_approval_track": "NPA Lite",
  "confidence": 0.82,
  "reasoning": "Standard FX Option with ESG linkage constitutes a variation per Criterion 5 (sustainability features). Risk assessed as LOW because no structural, accounting, or operational changes beyond ESG reporting.",
  "variation_details": {
    "base_product": "FX Option (existing)",
    "variation_type": "Sustainability link (ESG score)",
    "risk_impact": "LOW - additional ESG reporting required, no material risk change"
  },
  "required_approvers": [
    {"department": "Credit", "level": "Analyst"},
    {"department": "Finance", "level": "Manager"},
    {"department": "MLR", "level": "Senior Analyst"}
  ],
  "pir_required": "Only if conditions imposed by approvers",
  "estimated_timeline": "5 business days",
  "source": "KB_NPA_Classification_Rules - Section 2, Variation Criterion 5"
}
```

---

### Example 3: Cross-Border Override

**User Input:**
```
Product: Standard FX Forward
Description: Same FX Forward we trade in Singapore, now Hong Kong desk wants it
Notional: $8M
Counterparty: AA- rated bank
Cross-Border: Singapore booking, Hong Kong settlement
```

**LLM Classification Process:**

**Step 1: Prohibited Check**
```
Result: Not prohibited
→ Continue
```

**Step 2: Stage 1 Classification**
```
Check NTG: ❌ (FX Forward exists)
Check Variation: ❌ (no variations)
Check Existing: ✅ 

RAG Search:
  Query: "FX Forward Singapore"
  Result: TSG1234 (approved 6 months ago, active)
  Similarity: 96%

Classification: "Existing - Reference"
Confidence: 0.93 (high)

Expected Track (without overrides): NPA Lite
```

**Step 3: Override Check**
```
Cross-Border Override:
  is_cross_border = TRUE (Singapore booking, HK settlement)
  → ✅ OVERRIDE TRIGGERED

Override Rule:
  "ALL cross-border products require Full NPA"
  → Approval Track = Full NPA (overrides base "NPA Lite")

Additional Approvers Required:
  - Operations (mandatory for cross-border settlement)
  - Technology (mandatory for cross-border systems)
```

**Step 4: Stage 2 Approval Track (After Override)**
```
Final Approval Track = "Full NPA" (cross-border override)
Required Approvers = ["Credit", "Finance", "Legal", "Operations", "Technology"]
```

**LLM Output:**
```json
{
  "stage1_classification": "Existing - Reference",
  "stage2_approval_track": "Full NPA",
  "base_track": "NPA Lite (before overrides)",
  "override_applied": "Cross-Border Mandate",
  "confidence": 0.93,
  "reasoning": "Standard FX Forward exists in Singapore (TSG1234, 96% match). Normally would qualify for NPA Lite. However, cross-border flag (Singapore booking, Hong Kong settlement) triggers MANDATORY Full NPA per Override Rule 1.",
  "override_explanation": "Cross-border products require comprehensive review across jurisdictions due to regulatory complexity, FX settlement risk, and multi-system integration. This applies regardless of product simplicity.",
  "matched_npa": "TSG1234 (FX Forward, Singapore, approved 6 months ago)",
  "required_approvers": [
    {"department": "Credit", "level": "VP"},
    {"department": "Finance", "level": "Head of Finance"},
    {"department": "Legal", "level": "VP"},
    {"department": "Operations", "level": "Operations Head", "reason": "Cross-border settlement"},
    {"department": "Technology", "level": "Tech Lead", "reason": "Cross-border system integration"}
  ],
  "estimated_timeline": "7 business days",
  "source": "KB_NPA_Classification_Rules - Section 4, Override Rule 1 (Cross-Border Mandate)"
}
```

---

### Example 4: Evergreen Auto-Approval

**User Input:**
```
Product: Standard FX Forward EUR/USD
Notional: $7M
Counterparty: A+ rated multinational
Tenor: 3 months
Jurisdiction: Singapore (same as existing)
```

**LLM Classification Process:**

**Step 1: Prohibited Check**
```
Result: Not prohibited
→ Continue
```

**Step 2: Stage 1 Classification**
```
Classification: "Existing - Reference"
Confidence: 0.95 (exact match to TSG1234)
```

**Step 3: Evergreen Eligibility Check**
```
Check if product on Evergreen list:
  → ✅ "Standard FX Forward" is on Evergreen list

Check Evergreen Criteria:
  1. Notional <= $10M cap? → ✅ $7M <= $10M
  2. Aggregate <= $500M annual cap? → ✅ Current YTD $320M, $320M + $7M = $327M <= $500M
  3. Deal count <= 10/month? → ✅ Current month 4 deals, 4 < 10
  4. Counterparty rating >= A-? → ✅ A+ >= A-
  5. Validity active? → ✅ Evergreen approval valid until Dec 2026
  6. No variations? → ✅ Standard structure, no modifications

ALL Criteria MET → Evergreen APPROVED
```

**Step 4: Stage 2 Approval Track**
```
Approval Track = "Evergreen"
Action = Auto-approve, trade immediately, log transaction
Timeline = Same day (< 1 hour)
```

**LLM Output:**
```json
{
  "stage1_classification": "Existing - Reference",
  "stage2_approval_track": "Evergreen",
  "confidence": 0.95,
  "auto_approved": true,
  "reasoning": "Standard FX Forward EUR/USD matches Evergreen-approved structure. All Evergreen criteria met: notional $7M (within $10M cap), aggregate $327M YTD (within $500M cap), 4 deals this month (within 10-deal cap), counterparty A+ (above A- minimum), no variations detected.",
  "evergreen_limits_status": {
    "notional_check": "PASS ($7M / $10M cap)",
    "aggregate_check": "PASS ($327M / $500M annual cap)",
    "deal_count_check": "PASS (4 / 10 monthly cap)",
    "rating_check": "PASS (A+ >= A- minimum)",
    "validity_check": "PASS (valid until Dec 2026)",
    "variation_check": "PASS (no variations)"
  },
  "action": "AUTO-APPROVED - Trade can execute immediately",
  "logging": "Transaction logged in Evergreen usage tracker",
  "estimated_timeline": "Same day (< 1 hour)",
  "source": "KB_NPA_Classification_Rules - Section 3, Track D (Evergreen)"
}
```

---

### Example 5: Bundling Detection

**User Input:**
```
Product: Multi-Product Package
Description: Client wants FX Forward + Interest Rate Swap + Commodity Hedge, all for same underlying exposure
Notional: FX $10M, IRS $15M, Commodity $5M (total $30M)
Counterparty: BBB+ rated corporate
```

**LLM Classification Process:**

**Step 1: Bundling Detection**
```
Check Bundling Triggers:
  - Trigger 2: User says "package" → ✅ BUNDLING
  - Trigger 3: Multiple product types (FX + IRS + Commodity) → ✅ BUNDLING
  
Bundling CONFIRMED
```

**Step 2: Stage 1 Classification (for each component)**
```
FX Forward: "Existing" (reference TSG1234)
Interest Rate Swap: "Existing" (reference TSG5678)
Commodity Hedge: "Variation" (new commodity type)

Aggregate Classification: "Bundle with Variation component"
```

**Step 3: Stage 2 Approval Track**
```
Approval Track = "Bundling Approval"
Special Handling = Arbitration Team reviews
Approvals = Superset of all components:
  - FX Forward alone: Credit + Finance
  - IRS alone: Credit + Finance + MLR
  - Commodity (variation): Credit + Finance + MLR + Operations
  → Bundle requires: Credit + Finance + MLR + Operations

Aggregate Notional = $30M
  → Check if aggregate triggers higher tier: $30M < $50M → no additional override
```

**LLM Output:**
```json
{
  "stage1_classification": "Bundle (FX Forward + IRS + Commodity Hedge)",
  "stage2_approval_track": "Bundling Approval",
  "confidence": 0.88,
  "bundling_triggers": [
    "Trigger 2: User keyword 'package'",
    "Trigger 3: Multiple product types (3 products)"
  ],
  "bundle_components": [
    {"product": "FX Forward", "classification": "Existing", "notional": "$10M"},
    {"product": "Interest Rate Swap", "classification": "Existing", "notional": "$15M"},
    {"product": "Commodity Hedge", "classification": "Variation", "notional": "$5M"}
  ],
  "aggregate_notional": "$30M",
  "required_approvers": [
    {"department": "Credit", "reason": "All components require Credit"},
    {"department": "Finance", "reason": "All components require Finance"},
    {"department": "MLR", "reason": "IRS and Commodity require MLR"},
    {"department": "Operations", "reason": "Commodity (variation) requires Operations"}
  ],
  "special_handling": "Arbitration Team will review bundling approach and determine if products should be approved together or separately",
  "estimated_timeline": "10 business days (longer than standard NPA due to bundling complexity)",
  "source": "KB_NPA_Classification_Rules - Section 3, Track C (Bundling)"
}
```

---

### Example 6: Prohibited (Hard Stop)

**User Input:**
```
Product: Cryptocurrency Derivatives
Description: Bitcoin futures
Notional: $20M
Counterparty: Crypto exchange
Jurisdiction: Singapore
```

**LLM Classification Process:**

**Step 1: Prohibited Check (FIRST)**
```
Query prohibited_products table:
  SELECT * FROM prohibited_products 
  WHERE product_type LIKE '%crypto%' 
     OR product_type LIKE '%bitcoin%'
  
  Result: MATCH FOUND
    - product_type: "Cryptocurrency derivatives"
    - reason: "MBS Group Policy - No crypto exposure"
    - jurisdiction: "ALL"

→ ❌ HARD STOP - PROHIBITED
```

**Step 2: STOP (Do not proceed to Stage 1 or Stage 2)**

**LLM Output:**
```json
{
  "stage1_classification": "N/A (Prohibited check failed)",
  "stage2_approval_track": "Prohibited",
  "confidence": 1.00,
  "hard_stop": true,
  "prohibition_reason": "MBS Group Policy prohibits all cryptocurrency-related products and derivatives. This includes Bitcoin, Ethereum, and all digital asset exposures.",
  "prohibition_source": "Internal Policy - MBS Group Risk Framework, Section 8.3",
  "applicable_jurisdictions": "ALL (global prohibition)",
  "action_required": "Cannot proceed with this NPA. Please contact Compliance if you believe this is an error or if you have senior management approval to override this policy.",
  "alternative_suggestions": [
    "Consider commodity derivatives on traditional assets (gold, oil, etc.)",
    "Consider equity derivatives on blockchain technology companies (not direct crypto exposure)",
    "Contact Innovation team for potential Proof-of-Concept (PoC) approval under controlled environment"
  ],
  "escalation_contact": "compliance@mbs.com",
  "source": "KB_NPA_Classification_Rules - Section 3, Track E (Prohibited)"
}
```

---

## Decision Tree Diagram (Text Representation)

```
START: New Product Request
│
├─► STEP 1: Prohibited Check (FIRST)
│   ├─► Query prohibited_products table
│   ├─► Check sanctions (OFAC, UN, EU)
│   └─► Query regulatory prohibitions (KB)
│       │
│       ├─► PROHIBITED? → ❌ HARD STOP (Track E)
│       └─► NOT PROHIBITED? → Continue to Stage 1
│
├─► STAGE 1: Product Type Classification
│   │
│   ├─► Check NTG Criteria (1-20)
│   │   ├─► ANY criterion met? → "NTG" → Auto-route to Full NPA (Stage 2)
│   │   └─► None met? → Continue
│   │
│   ├─► Check Variation Criteria (1-8)
│   │   ├─► ANY criterion met? → "Variation"
│   │   │   ├─► Assess Risk: HIGH → Full NPA (Stage 2)
│   │   │   └─► Assess Risk: LOW/MED → NPA Lite (Stage 2)
│   │   └─► None met? → Continue
│   │
│   └─► Check Existing Sub-Classifications
│       ├─► Active + Evergreen list? → "Existing - Evergreen" → Check limits (Stage 2)
│       ├─► Active? → "Existing - Reference" → NPA Lite (Stage 2)
│       ├─► Dormant <3yr? → "Existing - Dormant" → NPA Lite Fast-Track (Stage 2)
│       ├─► Dormant ≥3yr? → "Existing - Dormant Long" → Full Assessment (Stage 2)
│       ├─► Expired, no var? → "Existing - Expired" → NPA Lite (Stage 2)
│       └─► Expired, with var? → "Existing - Expired Var" → Full NPA (Stage 2)
│
├─► STAGE 2: Approval Track Selection (with Overrides)
│   │
│   ├─► Check Override Rules (Priority Order)
│   │   │
│   │   ├─► Cross-Border? → ✅ Full NPA (override)
│   │   ├─► Notional >$50M? → ✅ Full NPA (override)
│   │   ├─► Counterparty ≤BBB-? → ✅ Full NPA (override)
│   │   ├─► Bundling detected? → ✅ Bundling Track (override)
│   │   └─► Evergreen limits breached? → ✅ Downgrade to NPA Lite
│   │
│   ├─► Base Classification Routes (if no overrides)
│   │   ├─► NTG → Full NPA
│   │   ├─► Variation (High Risk) → Full NPA
│   │   ├─► Variation (Low Risk) → NPA Lite
│   │   ├─► Existing - Evergreen (limits OK) → Evergreen (auto-approve)
│   │   ├─► Existing - Reference → NPA Lite
│   │   ├─► Existing - Dormant <3yr → NPA Lite (48hr fast-track)
│   │   ├─► Existing - Dormant ≥3yr → Full Assessment
│   │   └─► Existing - Expired → NPA Lite or Full NPA (depends on variations)
│   │
│   └─► Confidence Check
│       ├─► Confidence ≥0.75? → Proceed with classification
│       ├─► Confidence 0.60-0.74? → Escalate to GFM COO + RMG-MLR
│       └─► Confidence <0.60? → Escalate to NPA Governance Forum
│
└─► OUTPUT: Classification + Approval Track + Required Approvers + Timeline + Reasoning
```

---

## END OF KB_NPA_Classification_Rules.md

**This document provides complete classification logic for LLM agents to interpret and apply.**

**Key Features:**
- ✅ Two-stage classification (Product Type → Approval Track)
- ✅ 20 NTG criteria, 8 Variation criteria, 6 Existing sub-classifications
- ✅ 5 approval tracks (Full NPA, NPA Lite, Bundling, Evergreen, Prohibited)
- ✅ Override rules (cross-border, high notional, low rating, bundling)
- ✅ Edge case resolution logic
- ✅ Confidence scoring methodology
- ✅ 6 detailed examples with LLM reasoning
- ✅ Decision tree diagram

**Total Length:** ~25,000 words | ~40 KB

**Usage:** Upload to Dify KB, link to Classification Router Agent
