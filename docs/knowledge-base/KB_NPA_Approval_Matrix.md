# KB_NPA_Approval_Matrix.md
## Sign-Off Requirements & Approval Matrix for NPA Products

**Document Version:** 1.0  
**Last Updated:** December 31, 2025  
**Purpose:** Complete approval requirements for LLM agents to determine WHO approves WHAT

---

## Table of Contents

1. [Overview & Principles](#1-overview--principles)
2. [Core Approval Departments](#2-core-approval-departments)
3. [Approval Tiers by Product & Risk](#3-approval-tiers-by-product--risk)
4. [Cross-Border Mandatory Rules](#4-cross-border-mandatory-rules)
5. [Notional Threshold Escalations](#5-notional-threshold-escalations)
6. [Special Cases & Exceptions](#6-special-cases--exceptions)
7. [Timeline SLAs by Tier](#7-timeline-slas-by-tier)
8. [Approval Mode (Parallel vs Sequential)](#8-approval-mode-parallel-vs-sequential)
9. [Examples & Decision Trees](#9-examples--decision-trees)

---

## 1. Overview & Principles

### Core Principles

**Principle 1: Cumulative Requirements**
- If multiple rules apply, **combine ALL required approvers** (do NOT replace)
- Example: Base rule requires Credit + Finance, Cross-border rule adds Operations + Technology
- Result: Credit + Finance + Operations + Technology (all 4)

**Principle 2: Parallel Approvals by Default**
- Unless explicitly stated, all approvers work **in parallel** (simultaneously)
- Approvals do NOT wait for each other
- Example: Credit, Finance, Legal all review at same time (not Credit → Finance → Legal)

**Principle 3: Higher Thresholds Add Approvers**
- Escalation thresholds **add** senior approvers, do NOT replace junior ones
- Example: $75M notional adds Finance VP, but Finance Manager still reviews
- Result: Finance Manager + Finance VP (both)

**Principle 4: Most Conservative Wins**
- If conflicting rules, apply **most stringent** requirement
- Example: Rule A says "Credit Analyst", Rule B says "Credit VP"
- Result: Credit VP (more senior)

**Principle 5: Cross-Border is Absolute**
- Cross-border flag = TRUE **always** adds 5 mandatory departments
- NO exceptions (even for small, low-risk products)

---

## 2. Core Approval Departments

### Department Roster (7 Core + 3 Special)

#### Core Departments (Always Considered)

**1. Credit (RMG-Credit)**
- **Role:** Assess counterparty credit risk, determine credit limits, collateral requirements
- **Levels:**
  - Analyst: <$5M notional, A- or above rating
  - Senior Analyst: $5M-$20M, BBB+ or above
  - VP: $20M-$50M, BBB- or above
  - Regional Risk Head: $50M-$100M, any rating
  - Group Risk Head: >$100M or rating <BB-

**2. Finance (Group Product Control)**
- **Role:** Assess financial impact, profitability (ROAE), capital allocation, P&L impact
- **Levels:**
  - Manager: <$5M notional
  - Senior Manager: $5M-$20M
  - Head of Finance: $20M-$100M
  - CFO: >$100M

**3. Legal (GLC - Group Legal & Compliance)**
- **Role:** Review legal documentation, regulatory compliance, contractual terms
- **Levels:**
  - VP: All NPAs requiring Legal review
  - (No junior levels, VP is minimum)

**4. MLR (Market & Liquidity Risk)**
- **Role:** Assess market risk (VaR, Greeks), liquidity risk, hedging requirements
- **Levels:**
  - Senior Analyst: All derivative products
  - VP: Exotic derivatives, >$50M notional

**5. Operations**
- **Role:** Settlement, reconciliation, operational workflows, system compatibility
- **Levels:**
  - Operations Head: All NPAs requiring Operations review

**6. Technology**
- **Role:** System capability, booking engine support, data feeds, IT infrastructure
- **Levels:**
  - Tech Lead: All NPAs requiring Technology review

**7. Compliance**
- **Role:** AML/KYC, regulatory reporting, sanctions screening, conduct risk
- **Levels:**
  - Compliance Officer: All NPAs requiring Compliance review

---

#### Special Approvers (Context-Dependent)

**8. PAC (Product Approval Committee)**
- **When Required:** ALL New-to-Group (NTG) products
- **Timing:** BEFORE NPA submission (pre-approval gate)
- **Composition:** Senior management committee (GFM COO, Group Risk Head, CFO, CRO)
- **Purpose:** Strategic approval for entirely new product types

**9. CEO**
- **When Required:** Notional >$100M OR strategic importance
- **Timing:** AFTER all other approvals (final gate)

**10. Bundling Arbitration Team**
- **When Required:** Bundled products (multiple product types combined)
- **Purpose:** Determine bundling approach, aggregate risk assessment

---

## 3. Approval Tiers by Product & Risk

### Tier Structure

Approval requirements organized by **product type + risk attributes** into 5 tiers.

---

### Tier 1: Small, Low-Risk, Domestic

**Conditions (ALL must be met):**
- Notional: <$5M
- Cross-border: NO
- Counterparty rating: A- or above
- Product type: Standard (FX Forward, Vanilla IRS, Standard FX Option)
- Jurisdiction: Same as existing approved products

**Required Approvers:**
- **Credit** (Analyst level)
- **Finance** (Manager level)

**Optional (depending on product):**
- MLR (if derivative with market risk)

**Timeline SLA:** 2 business days

**Example Products:**
- FX Forward EUR/USD, $3M, AA- rated bank, Singapore-Singapore
- Interest Rate Swap, $4.5M, A+ rated corporate, domestic
- Standard FX Option, $2M, A rated counterparty

---

### Tier 2: Medium, Domestic, Good Credit

**Conditions (ALL must be met):**
- Notional: $5M - $50M
- Cross-border: NO
- Counterparty rating: BBB+ or above
- Product type: Standard to moderate complexity

**Required Approvers:**
- **Credit** (Senior Analyst)
- **Finance** (Senior Manager)
- **MLR** (Senior Analyst) - if derivative product

**Conditional Approvers:**
- **Legal** (VP) - if new counterparty OR complex structure OR new legal documentation

**Timeline SLA:** 4 business days

**Example Products:**
- FX Forward GBP/USD, $30M, BBB+ corporate, Singapore-Singapore
- Interest Rate Swap, $25M, A- rated bank, domestic
- FX Option with knock-out barrier, $15M, A rated counterparty

---

### Tier 3: Large OR Cross-Border

**Conditions (ANY triggers Tier 3):**
- Notional: >$50M
- **OR** Cross-border: YES (regardless of notional)

**Required Approvers:**
- **Credit** (VP if $50M-$100M, Regional Risk Head if >$100M)
- **Finance** (Head of Finance if $50M-$100M, CFO if >$100M)
- **Legal** (VP) - MANDATORY
- **MLR** (VP if >$50M)

**Cross-Border Mandatory Additions:**
- **Operations** (Operations Head) - MANDATORY for cross-border
- **Technology** (Tech Lead) - MANDATORY for cross-border

**Additional Escalations:**
- **CEO** - if notional >$100M (after all other approvals)

**Timeline SLA:** 
- Domestic, >$50M: 7 business days
- Cross-border: 7 business days
- >$100M: 10 business days (CEO approval adds time)

**Example Products:**
- FX Forward EUR/USD, $75M, A- corporate, Singapore-Singapore (domestic large)
- Interest Rate Swap, $8M, BBB+ bank, Singapore-Hong Kong (cross-border triggers Tier 3)
- Commodity Swap, $120M, AA corporate, Singapore-London (cross-border + CEO)

---

### Tier 4: High Risk

**Conditions (ANY triggers Tier 4):**
- Counterparty rating: BBB- or below
- **OR** Exotic structure (barrier options, digital options, path-dependent)
- **OR** New-to-Group (NTG) product

**Required Approvers:**
- **Credit** (Regional Risk Head) - MANDATORY
- **Finance** (Head of Finance) - MANDATORY
- **Legal** (VP) - MANDATORY
- **MLR** (VP) - MANDATORY
- **Risk Management** (Group Risk Head) - MANDATORY if rating <BB-
- **Operations** - MANDATORY
- **Technology** - MANDATORY
- **Compliance** - MANDATORY

**NTG Additional:**
- **PAC** (Product Approval Committee) - MANDATORY **BEFORE** NPA starts

**Timeline SLA:** 10-12 business days (20 days for NTG with PAC)

**Example Products:**
- Credit Default Swap, $10M, BBB- corporate (low rating)
- Digital FX Option (exotic payoff), $25M, A- bank
- Cryptocurrency derivatives (NTG), any notional (PROHIBITED if against policy)

---

### Tier 5: Evergreen (Auto-Approved)

**Conditions (ALL must be met):**
- Product on pre-approved Evergreen list
- Notional: <$10M per deal
- Aggregate: <$500M annual cap per desk
- Deal count: <10 deals per month per desk
- Counterparty rating: A- or above
- No variations from pre-approved structure
- Validity: Within 3-year Evergreen approval period

**Required Approvers:**
- **NONE** (auto-approved, log-only)

**Timeline SLA:** Same day (<1 hour, automated)

**Example Products:**
- Standard FX Forward EUR/USD, $7M, A+ bank (exact match to pre-approved)
- Plain Vanilla Interest Rate Swap, $5M, AA- corporate (on Evergreen list)

---

## 4. Cross-Border Mandatory Rules

### The Cross-Border Override

**Rule:** If `is_cross_border = TRUE`, the following 5 departments are **MANDATORY** regardless of product type, notional, or risk level.

**Mandatory Cross-Border Approvers:**

1. **Credit** (appropriate level based on notional + rating)
2. **Finance** (appropriate level based on notional)
3. **Legal** (VP) - MANDATORY
4. **Operations** (Operations Head) - MANDATORY
5. **Technology** (Tech Lead) - MANDATORY

**Why These 5?**
- **Credit:** Cross-border counterparty exposure (different jurisdiction credit risk)
- **Finance:** FX exposure, transfer pricing, multi-entity P&L
- **Legal:** Multi-jurisdiction contracts, local law compliance, cross-border ISDA
- **Operations:** Cross-border settlement (SWIFT, local clearing), reconciliation
- **Technology:** System connectivity across regions, data feeds, inter-company interfaces

**No Exceptions:**
- Even if notional = $1M, domestic equivalent = Tier 1 (2 approvers)
- Cross-border flag adds 3 more → Total 5 approvers (Tier 3)

---

### Cross-Border Definition

**A product is cross-border if ANY of the following:**

**Condition 1: Different Booking Entities**
- Example: Singapore desk books in MBSH (Hong Kong entity)
- Example: Hong Kong desk books in MBS Bank Ltd (Singapore entity)

**Condition 2: Different Settlement Locations**
- Example: Singapore booking, Hong Kong settlement
- Example: London trade, Singapore settlement

**Condition 3: Different Counterparty Jurisdiction**
- Example: Singapore desk trades with Hong Kong counterparty
- Example: London desk trades with US counterparty

**Condition 4: Different Regulatory Regimes**
- Example: Product subject to both MAS (Singapore) and FCA (UK) regulation
- Example: EMIR reporting (EU) + Dodd-Frank (US) applicable

**Condition 5: Multi-Currency with Cross-Border FX Settlement**
- Example: EUR/USD FX Forward where EUR settles in Frankfurt, USD in New York
- Note: Same-currency different locations (e.g., SGD Singapore, SGD London) = cross-border

---

### Cross-Border Examples

**Example 1: Singapore → Hong Kong**
```
Product: FX Forward EUR/USD
Notional: $8M
Counterparty: ABC Corp (Hong Kong), A- rated
Booking: Singapore desk → Hong Kong entity
Settlement: Hong Kong

Cross-Border: YES (Condition 1: Different booking entity)

Base Classification: Tier 1 (small, good rating, domestic equivalent)
Base Approvers: Credit (Analyst) + Finance (Manager) = 2 approvers

Cross-Border Override Adds:
  + Legal (VP)
  + Operations (Operations Head)
  + Technology (Tech Lead)

Final Approvers: 5 total (Credit Analyst + Finance Manager + Legal VP + Operations + Technology)
Timeline: 7 business days (Tier 3 cross-border SLA)
```

**Example 2: Domestic (NOT Cross-Border)**
```
Product: Interest Rate Swap SGD
Notional: $25M
Counterparty: XYZ Bank (Singapore), BBB+ rated
Booking: Singapore desk → MBS Bank Ltd (Singapore entity)
Settlement: Singapore

Cross-Border: NO (same jurisdiction, same entity, same settlement)

Classification: Tier 2 (medium, domestic, good rating)
Approvers: Credit (Senior Analyst) + Finance (Senior Manager) + MLR (Senior Analyst) = 3 approvers
Timeline: 4 business days
```

---

## 5. Notional Threshold Escalations

### Threshold Table

Notional thresholds **add** senior approvers (do NOT replace junior approvers).

| Notional Range (USD) | Credit Approver | Finance Approver | Additional Approvers |
|----------------------|-----------------|------------------|----------------------|
| <$5M | Analyst | Manager | - |
| $5M - $20M | Senior Analyst | Senior Manager | - |
| $20M - $50M | VP | Head of Finance | + MLR VP (if derivative) |
| $50M - $100M | Regional Risk Head | CFO | + Legal VP (mandatory) |
| $100M - $500M | Group Risk Head | CFO | + CEO (final approval) |
| >$500M | Group Risk Head + CEO | CFO + CEO | + Board approval (case-by-case) |

---

### Threshold Rules

**Threshold 1: $5M (Tier 1 → Tier 2)**
```
IF (notional_usd >= 5000000):
  Credit: Analyst → Senior Analyst
  Finance: Manager → Senior Manager
  Add: MLR (Senior Analyst) if derivative product
```

**Threshold 2: $20M (Tier 2 → Tier 3 Junior)**
```
IF (notional_usd >= 20000000):
  Credit: Senior Analyst → VP
  Finance: Senior Manager → Head of Finance
  Add: ROAE sensitivity analysis required (Finance attachment)
```

**Threshold 3: $50M (Tier 3 Junior → Tier 3 Senior)**
```
IF (notional_usd >= 50000000):
  Credit: VP → Regional Risk Head
  Finance: Head of Finance → CFO (if not already CFO)
  Add: Legal VP (mandatory)
  Add: MLR VP (if derivative)
```

**Threshold 4: $100M (CEO Gate)**
```
IF (notional_usd >= 100000000):
  Credit: Regional Risk Head → Group Risk Head
  Finance: CFO (already required at $50M)
  Add: CEO (final approval AFTER all others)
  Timeline: +3 days for CEO review
```

**Threshold 5: $500M (Board Consideration)**
```
IF (notional_usd >= 500000000):
  All previous approvers required
  Add: Board of Directors approval (case-by-case, strategic decision)
  Timeline: +10-15 days (board meeting schedule)
```

---

### Counterparty Rating Escalations

**Rating Threshold 1: BBB+ to A- (Base)**
- No escalation (standard approvers)

**Rating Threshold 2: BBB- to BBB+ (Caution)**
```
IF (counterparty_rating in ["BBB", "BBB-"]):
  Credit: Add one level (Analyst → Senior Analyst, VP → Regional Risk Head)
  Add: Collateral requirements discussion (Credit memo)
```

**Rating Threshold 3: BB+ to BBB- (High Risk)**
```
IF (counterparty_rating in ["BB+", "BB", "BB-"]):
  Credit: Regional Risk Head (mandatory, regardless of notional)
  Finance: Head of Finance (mandatory)
  Add: Legal VP (mandatory)
  Add: Risk Management (Group Risk Head if <BB)
  Approval Track: Full NPA (not NPA Lite)
```

**Rating Threshold 4: <BB (Very High Risk)**
```
IF (counterparty_rating in ["B+", "B", "B-", "CCC+", "CCC", "CCC-", "D"]):
  Credit: Group Risk Head (mandatory)
  Finance: CFO (mandatory)
  Add: CEO approval (case-by-case)
  Condition: Daily collateral mark-to-market REQUIRED
  Approval Track: Full NPA + special committee review
```

---

## 6. Special Cases & Exceptions

### Case 1: Bundled NPAs

**Definition:** Multiple products combined (e.g., FX Forward + Interest Rate Swap + Commodity Hedge).

**Approval Principle:** Use **highest tier** among bundled products + aggregate notional check.

**Example:**
```
Bundle Components:
1. FX Forward: $10M (Tier 2)
2. Interest Rate Swap: $15M (Tier 2)
3. Commodity Hedge (variation): $5M (Tier 2, but variation = higher scrutiny)

Aggregate Notional: $30M
Highest Tier: Tier 2 (but aggregate $30M pushes to higher approval level)

Approvers:
  - Credit (Senior Analyst) - from Tier 2
  - Finance (Senior Manager) - from Tier 2, but notional $30M → escalate to Head of Finance
  - MLR (Senior Analyst) - all 3 products have market risk
  - Operations - Commodity Hedge (variation) requires Ops review
  - Bundling Arbitration Team - special review for bundling approach

Total: 5 approvers + Bundling Arbitration Team
Timeline: 8-10 business days (longer due to bundling complexity)
```

**Bundling Arbitration Team Role:**
- Decide if products should be approved together or separately
- Assess aggregate risk (e.g., hedging relationships, correlation)
- Determine if bundling creates new risk not present in components

---

### Case 2: Evergreen Products

**Definition:** Pre-approved products with auto-approval if within limits.

**Approvers:** NONE (system auto-approves, log-only)

**Limits Check (ALL must pass):**
```
1. Product on Evergreen list (e.g., "Standard FX Forward EUR/USD")
2. Notional <= $10M per deal
3. Aggregate notional <= $500M annual cap per desk
4. Deal count <= 10 deals per month per desk
5. Counterparty rating >= A-
6. No variations from pre-approved structure
7. Validity period active (within 3 years)

IF (ALL limits pass):
  Approval Track: Evergreen (auto-approve)
  Approvers: NONE
  Timeline: Same day (<1 hour)
  Action: Log transaction in Evergreen usage tracker
  
ELSE (any limit breached):
  Approval Track: NPA Lite (downgrade from Evergreen)
  Approvers: Credit + Finance + MLR (reduced set)
  Timeline: 5 business days
  Reason: Specify which limit breached (e.g., "Notional $12M exceeds cap $10M")
```

---

### Case 3: Emergency Approvals

**Definition:** Time-sensitive product requiring faster approval (e.g., market window closing).

**Process:**
1. Verbal approval from at least **2 of {Credit VP, Finance VP, Legal VP}**
2. Documented via email within **24 hours**
3. Full NPA documentation within **5 business days** (retroactive)

**Conditions for Emergency:**
- Market opportunity with <48 hour window
- Client deadline cannot be extended
- Product NOT high-risk (no NTG, no exotic structures)
- Notional <$50M

**Post-Approval:**
- Full NPA process completes within 5 days
- If any approver objects retroactively → Trade may be unwound (risk)

**Timeline:** 
- Verbal approval: Same day
- Full documentation: 5 days post-trade

---

### Case 4: NTG (New-to-Group)

**Definition:** Product MBS Group has NEVER done before.

**Mandatory Requirements:**
1. **PAC Approval FIRST** (before NPA submission)
   - PAC = Product Approval Committee (senior management)
   - Composition: GFM COO, Group Risk Head, CFO, CRO
   - Purpose: Strategic go/no-go decision

2. **Full NPA Process** (after PAC)
   - All 7 approvers: Credit, Finance, Legal, MLR, Operations, Technology, Compliance
   - Approver levels: Senior (VP or above)

3. **PIR Mandatory** (within 6 months of launch)
   - Post-Implementation Review
   - All original approvers participate

**Approval Sequence:**
```
Step 1: PAC Meeting (strategic approval)
  ↓ (if approved)
Step 2: Full NPA Submission
  ↓
Step 3: Parallel approvals (Credit, Finance, Legal, MLR, Ops, Tech, Compliance)
  ↓ (if all approved)
Step 4: Launch
  ↓ (6 months later)
Step 5: PIR (mandatory review)
```

**Timeline:** 20-30 business days total (PAC + Full NPA + coordination)

---

### Case 5: Dormant Reactivation

**Definition:** Product approved before but no trades in last 12 months.

**Fast-Track Criteria (ALL must be met):**
- Dormant period: <3 years
- PIR completed (if original NPA was Full NPA)
- No variations to product
- Not on prohibited list

**If Fast-Track Eligible:**
```
Approval Track: NPA Lite - Fast-Track Dormant Reactivation
Process: 48-hour no-objection notice to original approvers
Approvers: Original sign-off parties (notified, but approval assumed if no objection)
Timeline: 2 business days (48 hours)

Example:
  - Original NPA (2023): Credit + Finance + Legal + MLR approved
  - Dormant since: Feb 2024 (22 months)
  - Reactivation: Dec 2025
  - Process: Notify Credit + Finance + Legal + MLR, if no objection within 48 hours → Approved
```

**If NOT Fast-Track Eligible:**
```
Approval Track: NPA Lite (standard) or Full Assessment (if dormant >3 years)
Approvers: Reduced set (Credit + Finance + MLR typically)
Timeline: 5 business days (NPA Lite)
```

---

### Case 6: Policy Deviation

**Definition:** Product requires deviation from bank policy (e.g., exceeding risk limit).

**Additional Approval:**
- **EVP (Executive Vice President)** or **GFM COO**
- Purpose: Policy exception approval

**Process:**
```
Standard Approvers: (Credit, Finance, Legal, MLR, Ops, Tech as per tier)
  +
Policy Deviation Approval: EVP/GFM COO

Timeline: +2-3 days (EVP review)
Condition: Deviation must be explicitly documented with justification
```

---

## 7. Timeline SLAs by Tier

### SLA Table

| Tier | Conditions | Approvers | Timeline SLA (Business Days) |
|------|------------|-----------|------------------------------|
| Tier 1 | <$5M, domestic, A- rating | Credit Analyst + Finance Manager | 2 days |
| Tier 2 | $5M-$50M, domestic, BBB+ rating | Credit SA + Finance SM + MLR SA | 4 days |
| Tier 3 | >$50M OR cross-border | Credit VP/RRH + Finance HoF/CFO + Legal + (Ops + Tech if cross-border) | 7 days |
| Tier 4 | High risk (BBB- rating, exotic, NTG) | All 7 departments + PAC (if NTG) | 10-12 days (20 days if NTG) |
| Tier 5 | Evergreen (auto-approved) | NONE | <1 hour (same day) |

**Notes:**
- SLA = time from "Pending Approvals" state to "All Approvals Received"
- Does NOT include Maker draft time, Checker review time, or loop-back time
- Assumes no loop-backs or clarifications (clean approval path)

---

### SLA Escalation Rules

**75% SLA (Warning)**
```
When approver reaches 75% of SLA deadline:
  - System sends reminder: "NPA TSG2025-042 review due in 12 hours"
  - Notification to approver
```

**100% SLA (Breach)**
```
When approver exceeds SLA deadline:
  - Escalate to approver's manager
  - Email: "NPA TSG2025-042 overdue by 6 hours, please expedite"
  - Dashboard flag: "SLA BREACHED"
```

**150% SLA (Critical Escalation)**
```
When approver exceeds 150% of SLA:
  - Escalate to GFM COO
  - Email: "NPA TSG2025-042 critically delayed, requires immediate attention"
  - Potential: Reassign to backup approver
```

---

## 8. Approval Mode (Parallel vs Sequential)

### Default: Parallel Approvals

**All approvers at the same level review simultaneously** (no waiting for others).

**Example (Tier 3 Cross-Border):**
```
Approvers: Credit VP, Finance Head, Legal VP, MLR VP, Operations, Technology

Notification: All 6 receive notification at same time (e.g., 9:00 AM Dec 16)

Review Process:
  - Credit VP starts review: 9:15 AM Dec 16
  - Finance Head starts review: 10:30 AM Dec 16
  - Legal VP starts review: 9:00 AM Dec 17
  - MLR VP starts review: 11:00 AM Dec 16
  - Operations starts review: 2:00 PM Dec 16
  - Technology starts review: 9:00 AM Dec 17

Approvals Received (parallel, not sequential):
  - Operations: Dec 16 5:45 PM (0.36 days)
  - MLR VP: Dec 17 8:30 AM (0.98 days)
  - Technology: Dec 17 9:00 AM (1.0 days)
  - Credit VP: Dec 17 10:15 AM (1.05 days)
  - Finance Head: Dec 17 2:00 PM (1.2 days) ← BOTTLENECK
  - Legal VP: Dec 18 9:00 AM (2.0 days)

Total Timeline: 2.0 days (Legal VP was slowest, but all worked in parallel)
```

**Benefit:** Faster than sequential (if sequential: 0.36 + 0.98 + 1.0 + 1.05 + 1.2 + 2.0 = 6.59 days!)

---

### Exception: Sequential Approvals

**Some approvals have dependencies (must wait for previous approver).**

**Sequential Case 1: Finance Manager → Finance VP**
```
IF (notional_usd > 50000000):
  Finance Manager reviews first
    ↓ (after Finance Manager approves)
  Finance VP reviews (escalation approval)

Reason: VP validates Manager's work, not duplicate review
```

**Sequential Case 2: Credit → MLR (for Credit Derivatives)**
```
IF (product_type == "Credit Default Swap"):
  Credit must approve FIRST
    ↓ (Credit sets collateral terms)
  MLR reviews (validates hedging approach using Credit's collateral assumptions)

Reason: MLR needs Credit's input before assessing market risk
```

**Sequential Case 3: All Approvers → CEO**
```
IF (notional_usd > 100000000):
  All standard approvers (Credit, Finance, Legal, MLR, Ops, Tech)
    ↓ (after ALL approve)
  CEO (final strategic approval)

Reason: CEO doesn't review until all technical approvers have signed off
```

---

### Hybrid: Mostly Parallel with Sequential Gates

**Most common pattern:**

```
Parallel Group 1: Credit, Finance, Legal, MLR, Operations, Technology (all review simultaneously)
  ↓ (after ALL in Group 1 approve)
Sequential Gate: Finance VP (validates Finance Manager's approval)
  ↓ (after Finance VP approves)
Sequential Gate: CEO (final approval, if >$100M)
```

**Timeline Calculation:**
```
Parallel Group 1 bottleneck: 2.0 days (slowest approver in group)
Sequential Gate 1 (Finance VP): +0.5 days
Sequential Gate 2 (CEO): +1.0 days (if >$100M)

Total: 2.0 + 0.5 + 1.0 = 3.5 days
```

---

## 9. Examples & Decision Trees

### Example 1: Simple Domestic FX Forward (Tier 1)

**Input:**
```
Product: FX Forward EUR/USD
Notional: $3M
Counterparty: XYZ Bank, AA- rated
Cross-border: NO (Singapore-Singapore)
Product Type: Standard
```

**LLM Decision Process:**

**Step 1: Check Prohibited**
```
Result: Not prohibited → Continue
```

**Step 2: Determine Base Tier**
```
Notional: $3M < $5M → Tier 1 candidate
Rating: AA- >= A- → Tier 1 eligible
Cross-border: NO → Tier 1 eligible
Product: Standard FX Forward → Tier 1 eligible

Base Tier: Tier 1
```

**Step 3: Apply Threshold Escalations**
```
Notional $3M:
  - No escalation (below all thresholds)
  
Rating AA-:
  - No escalation (high quality)

Result: Tier 1 confirmed
```

**Step 4: Determine Approvers**
```
Tier 1 Base Approvers:
  - Credit (Analyst level)
  - Finance (Manager level)

Cross-Border Check:
  - Cross-border = NO → No additional approvers

Final Approvers: Credit Analyst + Finance Manager
```

**Step 5: Timeline SLA**
```
Tier 1 SLA: 2 business days
Approval Mode: Parallel (both review simultaneously)
```

**LLM Output:**
```json
{
  "tier": "Tier 1 (Small, Low-Risk, Domestic)",
  "required_approvers": [
    {"department": "Credit", "level": "Analyst", "name": "To be assigned"},
    {"department": "Finance", "level": "Manager", "name": "To be assigned"}
  ],
  "approval_mode": "Parallel",
  "timeline_sla_days": 2,
  "reasoning": "FX Forward $3M with AA- counterparty qualifies for Tier 1 (small, domestic, high credit quality). Standard two-approver process (Credit Analyst + Finance Manager). No cross-border, no threshold escalations.",
  "source": "KB_NPA_Approval_Matrix - Section 3, Tier 1"
}
```

---

### Example 2: Cross-Border Override (Tier 3)

**Input:**
```
Product: Interest Rate Swap SGD
Notional: $8M
Counterparty: ABC Corp (Hong Kong), BBB+ rated
Cross-border: YES (Singapore booking, Hong Kong settlement)
```

**LLM Decision Process:**

**Step 1: Check Prohibited**
```
Result: Not prohibited → Continue
```

**Step 2: Determine Base Tier (without cross-border)**
```
Notional: $8M → Between $5M-$50M → Tier 2 candidate
Rating: BBB+ → Tier 2 eligible
Product: Interest Rate Swap (derivative) → Tier 2 eligible

Base Tier (if domestic): Tier 2
Base Approvers (if domestic): Credit SA + Finance SM + MLR SA = 3 approvers
```

**Step 3: Apply Cross-Border Override**
```
Cross-Border Flag: YES

Cross-Border Mandatory Rule:
  - ALL cross-border products → Tier 3 (minimum)
  - Add 5 mandatory departments (regardless of base tier)

Cross-Border Approvers:
  1. Credit (appropriate level for notional $8M → Senior Analyst)
  2. Finance (appropriate level for notional $8M → Senior Manager)
  3. Legal (VP) - MANDATORY
  4. Operations (Operations Head) - MANDATORY
  5. Technology (Tech Lead) - MANDATORY

Additional (derivative):
  6. MLR (Senior Analyst) - market risk

Final Approvers: 6 total (override Tier 2 → Tier 3)
```

**Step 4: Timeline SLA**
```
Tier 3 Cross-Border SLA: 7 business days
Approval Mode: Parallel (all 6 review simultaneously)
```

**LLM Output:**
```json
{
  "tier": "Tier 3 (Cross-Border Override)",
  "base_tier_without_cross_border": "Tier 2",
  "cross_border_triggered": true,
  "required_approvers": [
    {"department": "Credit", "level": "Senior Analyst"},
    {"department": "Finance", "level": "Senior Manager"},
    {"department": "Legal", "level": "VP", "reason": "Cross-border mandatory"},
    {"department": "MLR", "level": "Senior Analyst", "reason": "Derivative product"},
    {"department": "Operations", "level": "Operations Head", "reason": "Cross-border settlement"},
    {"department": "Technology", "level": "Tech Lead", "reason": "Cross-border systems"}
  ],
  "approval_mode": "Parallel",
  "timeline_sla_days": 7,
  "reasoning": "Interest Rate Swap $8M normally qualifies for Tier 2 (3 approvers). However, cross-border flag (Singapore-Hong Kong) triggers MANDATORY Tier 3 with 5 core approvers (Credit, Finance, Legal, Operations, Technology) + MLR (derivative). Cross-border products require comprehensive review across jurisdictions regardless of size.",
  "override_applied": "Cross-Border Mandatory Rule (Section 4)",
  "source": "KB_NPA_Approval_Matrix - Section 4 (Cross-Border)"
}
```

---

### Example 3: High Notional with CEO Gate (Tier 3 + CEO)

**Input:**
```
Product: FX Option GBP/USD
Notional: $120M
Counterparty: DEF Bank, A- rated
Cross-border: NO (Singapore-Singapore)
```

**LLM Decision Process:**

**Step 1: Check Prohibited**
```
Result: Not prohibited → Continue
```

**Step 2: Determine Base Tier**
```
Notional: $120M > $100M → Tier 3 (high notional)
Rating: A- → Good quality
Cross-border: NO → No cross-border override
Product: FX Option (derivative) → Standard complexity

Base Tier: Tier 3
```

**Step 3: Apply Threshold Escalations**
```
Notional $120M:
  - Threshold 3 ($50M): Add Legal VP ✓
  - Threshold 4 ($100M): Add CEO ✓ (sequential gate)
  
Credit Approver:
  - $120M > $100M → Group Risk Head (highest level)
  
Finance Approver:
  - $120M > $100M → CFO (already required at $50M)
  
MLR:
  - FX Option (derivative) + $120M > $50M → MLR VP
```

**Step 4: Determine Approvers**
```
Tier 3 Approvers:
  - Credit (Group Risk Head)
  - Finance (CFO)
  - Legal (VP) - mandatory for >$50M
  - MLR (VP) - derivative >$50M
  
Sequential Gate (after all above approve):
  - CEO (mandatory for >$100M)
```

**Step 5: Timeline SLA**
```
Tier 3 Base SLA: 7 days (parallel approvals)
CEO Gate: +3 days (sequential)
Total: 10 days
```

**LLM Output:**
```json
{
  "tier": "Tier 3 (High Notional) + CEO Gate",
  "required_approvers_parallel": [
    {"department": "Credit", "level": "Group Risk Head", "reason": "Notional >$100M"},
    {"department": "Finance", "level": "CFO", "reason": "Notional >$50M"},
    {"department": "Legal", "level": "VP", "reason": "Notional >$50M mandatory"},
    {"department": "MLR", "level": "VP", "reason": "Derivative >$50M"}
  ],
  "required_approvers_sequential": [
    {"department": "CEO", "level": "CEO", "timing": "After all parallel approvers", "reason": "Notional >$100M"}
  ],
  "approval_mode": "Hybrid (Parallel Group 1 → Sequential CEO Gate)",
  "timeline_sla_days": 10,
  "timeline_breakdown": {
    "parallel_group_1": 7,
    "ceo_sequential_gate": 3
  },
  "reasoning": "FX Option $120M exceeds $100M threshold, triggering senior approvals (Group Risk Head, CFO, Legal VP, MLR VP) + CEO gate. Parallel approvals complete first (7 days estimated), then CEO reviews as final strategic gate (+3 days). Total 10 days.",
  "threshold_triggers": ["$50M → Legal + CFO", "$100M → CEO"],
  "source": "KB_NPA_Approval_Matrix - Section 5 (Notional Thresholds)"
}
```

---

### Example 4: High-Risk Counterparty (Tier 4)

**Input:**
```
Product: Credit Default Swap
Notional: $15M
Counterparty: GHI Corp, BB+ rated (high risk)
Cross-border: NO
```

**LLM Decision Process:**

**Step 1: Check Prohibited**
```
Result: Not prohibited → Continue
```

**Step 2: Determine Base Tier**
```
Product: Credit Default Swap (derivative)
Rating: BB+ (below BBB-) → HIGH RISK
Notional: $15M → Medium

Rating Tier Trigger:
  - BB+ < BBB- → Tier 4 (High Risk)
```

**Step 3: Apply High-Risk Rules**
```
Rating BB+ Mandatory Approvers:
  - Credit: Regional Risk Head (mandatory, regardless of notional)
  - Finance: Head of Finance (mandatory)
  - Legal: VP (mandatory)
  - MLR: VP (credit derivative requires MLR)
  - Risk Management: Not yet (Group Risk Head only if <BB)
  - Operations: MANDATORY (high risk)
  - Technology: MANDATORY (high risk)
  - Compliance: MANDATORY (high risk)

Total: 7 approvers (all departments except PAC, CEO)
```

**Step 4: Timeline SLA**
```
Tier 4 High Risk SLA: 10-12 business days
Approval Mode: Parallel (all 7 review simultaneously)
```

**LLM Output:**
```json
{
  "tier": "Tier 4 (High Risk - Low Counterparty Rating)",
  "risk_trigger": "Counterparty rating BB+ (below BBB- threshold)",
  "required_approvers": [
    {"department": "Credit", "level": "Regional Risk Head", "reason": "BB+ rating requires senior credit review"},
    {"department": "Finance", "level": "Head of Finance", "reason": "High risk requires senior finance approval"},
    {"department": "Legal", "level": "VP", "reason": "High risk mandatory"},
    {"department": "MLR", "level": "VP", "reason": "Credit derivative market risk"},
    {"department": "Operations", "level": "Operations Head", "reason": "High risk mandatory"},
    {"department": "Technology", "level": "Tech Lead", "reason": "High risk mandatory"},
    {"department": "Compliance", "level": "Compliance Officer", "reason": "High risk counterparty due diligence"}
  ],
  "approval_mode": "Parallel",
  "timeline_sla_days": 10,
  "additional_requirements": [
    "Daily collateral mark-to-market REQUIRED (Credit will impose condition)",
    "Enhanced monitoring (Credit Risk team)"
  ],
  "reasoning": "Credit Default Swap with BB+ counterparty (high risk, below BBB-) triggers Tier 4 full review. All 7 core departments must approve (Credit Regional Risk Head, Finance Head, Legal, MLR, Operations, Technology, Compliance). Enhanced due diligence required for below-investment-grade counterparty.",
  "source": "KB_NPA_Approval_Matrix - Section 3, Tier 4 + Section 5 (Rating Escalations)"
}
```

---

### Example 5: Evergreen Auto-Approval (Tier 5)

**Input:**
```
Product: Standard FX Forward EUR/USD
Notional: $7M
Counterparty: JKL Bank, A+ rated
Cross-border: NO
Match to Evergreen: Yes (exact structure match)
```

**LLM Decision Process:**

**Step 1: Check Prohibited**
```
Result: Not prohibited → Continue
```

**Step 2: Check Evergreen Eligibility**
```
Product on Evergreen List: YES (Standard FX Forward EUR/USD)

Evergreen Limits Check:
  1. Notional <= $10M cap? → ✓ ($7M <= $10M)
  2. Aggregate <= $500M annual cap? → ✓ (Current YTD $320M, $320M + $7M = $327M <= $500M)
  3. Deal count <= 10/month? → ✓ (Current month 4 deals, 4 < 10)
  4. Counterparty rating >= A-? → ✓ (A+ >= A-)
  5. Validity active? → ✓ (Evergreen approval valid until Dec 2026)
  6. No variations? → ✓ (Exact match, no modifications)

ALL Limits PASS → Evergreen APPROVED
```

**Step 3: Auto-Approval**
```
Approval Track: Evergreen
Approvers: NONE (auto-approved)
Action: Log transaction in Evergreen usage tracker
Timeline: Same day (<1 hour, automated)
```

**LLM Output:**
```json
{
  "tier": "Tier 5 (Evergreen Auto-Approved)",
  "auto_approved": true,
  "required_approvers": [],
  "approval_mode": "Automated",
  "timeline_sla_hours": 1,
  "evergreen_limits_status": {
    "notional_check": "PASS ($7M / $10M cap)",
    "aggregate_check": "PASS ($327M / $500M annual cap after this trade)",
    "deal_count_check": "PASS (4 deals this month / 10 cap)",
    "rating_check": "PASS (A+ >= A- minimum)",
    "validity_check": "PASS (valid until Dec 2026)",
    "variation_check": "PASS (exact match to pre-approved structure)"
  },
  "action": "AUTO-APPROVED - Trade can execute immediately",
  "logging": "Transaction logged in Evergreen usage tracker",
  "reasoning": "Standard FX Forward EUR/USD $7M matches Evergreen pre-approved structure. All Evergreen criteria met (within notional cap, aggregate cap, deal count cap, counterparty rating minimum, no variations). Auto-approved for same-day execution.",
  "source": "KB_NPA_Approval_Matrix - Section 3, Tier 5 (Evergreen) + Section 6, Case 2"
}
```

---

## Decision Tree Diagram (Text)

```
START: Determine Approvers
│
├─► STEP 1: Prohibited Check
│   ├─► PROHIBITED? → HARD STOP (no approvers, cannot proceed)
│   └─► NOT PROHIBITED? → Continue
│
├─► STEP 2: Check Evergreen Eligibility (if applicable)
│   ├─► On Evergreen list + All limits pass? → Tier 5 (auto-approve, DONE)
│   └─► NOT Evergreen? → Continue to tier determination
│
├─► STEP 3: Determine Base Tier (before overrides)
│   │
│   ├─► Notional <$5M + Domestic + Rating >=A- → Tier 1 (2 approvers)
│   │
│   ├─► Notional $5M-$50M + Domestic + Rating >=BBB+ → Tier 2 (3 approvers)
│   │
│   ├─► Notional >$50M OR Cross-border → Tier 3 (4-6 approvers)
│   │
│   └─► Rating <BBB- OR Exotic OR NTG → Tier 4 (7+ approvers)
│
├─► STEP 4: Apply Override Rules (Priority Order)
│   │
│   ├─► Cross-Border = TRUE?
│   │   └─► Add: Legal + Operations + Technology (mandatory)
│   │       Upgrade to: Tier 3 minimum
│   │
│   ├─► Notional >$50M?
│   │   └─► Add: Legal VP (mandatory)
│   │       Escalate: Credit → Regional Risk Head
│   │       Escalate: Finance → CFO
│   │
│   ├─► Notional >$100M?
│   │   └─► Add: CEO (sequential gate, AFTER all others)
│   │       Escalate: Credit → Group Risk Head
│   │
│   ├─► Rating <BBB-?
│   │   └─► Upgrade to: Tier 4
│   │       Add: All 7 departments
│   │
│   └─► NTG (New-to-Group)?
│       └─► Add: PAC (BEFORE NPA submission)
│           Require: All 7 departments
│           Mandate: PIR within 6 months
│
├─► STEP 5: Combine Approvers (Cumulative)
│   │
│   ├─► Base Tier Approvers
│   ├─► + Override Additions
│   ├─► + Threshold Escalations
│   └─► = Final Approver List
│
├─► STEP 6: Determine Approval Mode
│   │
│   ├─► Default: Parallel (all at same level)
│   │
│   ├─► Sequential Gates:
│   │   - Finance Manager → Finance VP (if >$50M)
│   │   - All Approvers → CEO (if >$100M)
│   │
│   └─► Timeline: Parallel time + Sequential time
│
└─► OUTPUT: Approver List + Timeline SLA + Approval Mode
```

---

## END OF KB_NPA_Approval_Matrix.md

**This document provides complete approval requirements for LLM agents to determine required approvers.**

**Key Features:**
- ✅ 7 core departments + 3 special approvers (PAC, CEO, Bundling Team)
- ✅ 5 tiers with clear conditions (Small/Medium/Large/High-Risk/Evergreen)
- ✅ Cross-border mandatory rules (5 departments, absolute)
- ✅ Notional threshold escalations ($5M/$20M/$50M/$100M/$500M)
- ✅ Counterparty rating escalations (BBB+/BBB-/BB+/<BB)
- ✅ 6 special cases (Bundling, Evergreen, Emergency, NTG, Dormant, Policy Deviation)
- ✅ SLA timelines by tier (2/4/7/10/20 days)
- ✅ Approval modes (Parallel vs Sequential)
- ✅ 5 detailed examples with LLM reasoning
- ✅ Decision tree diagram

**Total Length:** ~20,000 words | ~35 KB

**Usage:** Upload to Dify KB, link to Classification Router Agent, Governance Agent, Product Ideation Agent
