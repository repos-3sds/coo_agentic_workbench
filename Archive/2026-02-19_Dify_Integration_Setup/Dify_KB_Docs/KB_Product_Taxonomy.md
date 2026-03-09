# Financial Product Taxonomy for NPA Classification
# Upload to Dify Knowledge Base: "NPA Classification" dataset

> **Updated: 2026-02-19 | Cross-verified against NPA_Business_Process_Deep_Knowledge.md**

## Overview
This taxonomy helps the Classification Agent map user descriptions to standard product categories, determine appropriate risk profiles, and identify the correct classification criteria to apply.

---

## Asset Class Hierarchy

### 1. Foreign Exchange (FX)
**Common NPA types**: Variation (most common), NTG (rare — only for exotic FX structures)

| Product | Typical Classification | Key Criteria Triggers |
|---------|----------------------|----------------------|
| FX Spot | Existing / Evergreen | None (standard product) |
| FX Forward | Existing | None unless new currency pair |
| FX Swap | Existing | VAR_01 if new currency pair |
| FX Option (Vanilla) | Existing / Variation | VAR_01, VAR_02 for new pairs/tenors |
| FX Accumulator | Variation | VAR_01, VAR_06 (risk limits) |
| FX Target Redemption (TARF) | Variation | VAR_01, VAR_03, VAR_06 |
| FX Exotic (Barrier, Digital) | Variation / NTG | NTG_PI_02, NTG_PI_04 if new payoff type |

### 2. Interest Rates
**Common NPA types**: Variation (rate products are well-established)

| Product | Typical Classification | Key Criteria Triggers |
|---------|----------------------|----------------------|
| IRS (Interest Rate Swap) | Existing | None unless new index |
| Cross-Currency Swap | Existing / Variation | VAR_05 if new jurisdiction |
| Swaption | Existing | VAR_02 for new tenors |
| Interest Rate Cap/Floor | Existing | None |
| Structured Rate Note | Variation | VAR_01, VAR_02 |
| CMS Spread Product | Variation | NTG_PI_04 if new pricing model |
| Inflation-Linked Product | Variation / NTG | NTG_PI_03 if first inflation product |

### 3. Fixed Income / Credit
**Common NPA types**: Varies widely

| Product | Typical Classification | Key Criteria Triggers |
|---------|----------------------|----------------------|
| Plain Bond | Existing | None |
| Structured Note (Principal Protected) | Variation | VAR_01, VAR_03 |
| Structured Note (Non-Protected) | Variation | VAR_01, VAR_03, NTG_RR_04 |
| Credit Default Swap (CDS) | Existing | VAR_07 for new clearing house |
| CLO / CDO Tranche | NTG / Variation | NTG_PI_01, NTG_PI_02, NTG_RR_02 |
| Contingent Convertible (CoCo) | Variation / NTG | NTG_PI_02, NTG_RR_02 |
| Green / ESG Bond | Variation | VAR_08, NTG_MC_04 if first ESG product |
| Sukuk (Islamic Finance) | NTG | NTG_PI_01, NTG_MC_04, NTG_RR_01 |

### 4. Equity
**Common NPA types**: Variation for flow products, NTG for exotic structures

| Product | Typical Classification | Key Criteria Triggers |
|---------|----------------------|----------------------|
| Equity Swap | Existing | VAR_01 for new underlying |
| Equity Option (Vanilla) | Existing | None |
| Equity Linked Note (ELN) | Variation | VAR_01, VAR_03 |
| Autocallable / Phoenix | Variation | VAR_01, VAR_02 |
| Worst-of Basket | Variation | NTG_PI_02 for correlation risk |
| Equity Accumulator | Variation | VAR_01, VAR_06 |
| SPAC-linked Product | NTG | NTG_PI_01, NTG_MC_01, NTG_RR_04 |

### 5. Commodities
**Common NPA types**: Often NTG if bank has limited commodity presence

| Product | Typical Classification | Key Criteria Triggers |
|---------|----------------------|----------------------|
| Gold / Precious Metal Spot | Existing (if offered) | NTG_PI_03 if first commodity |
| Commodity Swap (Oil, Gas) | NTG / Variation | NTG_PI_03, NTG_FO_01, NTG_FO_02 |
| Carbon Credit Product | NTG | NTG_PI_01, NTG_PI_03, NTG_MC_02 |
| Weather Derivative | NTG | NTG_PI_01, NTG_PI_02, NTG_PI_04 |
| Agricultural Commodity | NTG | NTG_PI_03, NTG_FO_01 |

### 6. Structured Products (Multi-Asset)
**Common NPA types**: Usually Variation, NTG if first of its kind

| Product | Typical Classification | Key Criteria Triggers |
|---------|----------------------|----------------------|
| Dual Currency Investment (DCI) | Existing | None |
| Range Accrual | Variation | VAR_01, VAR_02 |
| Snowball Note | Variation | NTG_PI_04 for path-dependent pricing |
| Multi-Asset Basket | Variation / NTG | NTG_PI_02 for cross-asset correlation |
| CPPI Structure | Variation | NTG_PI_04 for dynamic allocation model |
| Fund-Linked Note | Variation | VAR_01, VAR_07 |

### 7. Digital / Crypto (MOSTLY PROHIBITED)
**WARNING: Most products in this category trigger PROHIBITED hard stop**

| Product | Typical Classification | Notes |
|---------|----------------------|-------|
| Crypto Spot Trading | PROHIBITED | POLICY_001 |
| Crypto Derivatives | PROHIBITED | POLICY_001 |
| Crypto Custody | PROHIBITED | POLICY_001 |
| Crypto ETF (Regulated) | NTG (with PAC exemption) | Requires explicit PAC approval |
| Tokenized Securities | NTG | NTG_PI_01, NTG_PI_05, NTG_FO_01 |
| CBDC Products | NTG | NTG_PI_01, NTG_PI_03, NTG_MC_04 |

---

## Evergreen Bundles (No Approval Needed)

The following pre-approved bundled products are on the Evergreen list and can be traded immediately without a new NPA, provided they remain within Evergreen limits:

| Bundle Name | Component Building Blocks |
|-------------|--------------------------|
| Dual Currency Deposit/Notes | FX Option + LNBR/Deposit/Bond |
| Treasury Investment Asset Swap | Bond + IRS |
| Equity-Linked Note (ELN) | Equity Option + LNBR |

---

## Pre-Approved FX Derivative Bundles (28+ Products)

The following FX derivative bundles have been pre-approved by the GFM COO Office. They do not require a new NPA provided Evergreen limits are respected:

| Bundle Name |
|-------------|
| Best/Worst of Option |
| KIKO (Knock-In Knock-Out) CLI |
| Boosted KO Forward with Guarantee |
| Multi-period EKI Strangle |
| Pivot Forward |
| Trigger Forward |
| Range Coupon CCY Linked SIP |

> **Note:** This is a representative subset. The full list of 28+ approved FX bundled products is maintained in **"List of approved FX Bundled products.xlsx"** by the GFM COO Office. Always refer to that master file for the complete and current list.

---

## 8 Bundling Conditions (Deep Knowledge Section 8)

A bundled product can qualify for Evergreen / pre-approved treatment **only if ALL 8 conditions** are met:

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

> If any condition is NOT met, the bundle must go through the standard NPA process (NPA Lite or Full NPA depending on complexity).

---

## Evergreen Limits (Deep Knowledge)

Evergreen products operate within the following hard limits. Breaching any limit requires a new NPA or limit extension approval:

| Limit Type | Threshold |
|------------|-----------|
| Total Notional | $500M |
| Long Tenor (>10Y) | $250M |
| Non-Retail Deals | 10 per NPA |
| Retail Deals | 20 per NPA |
| Retail Transaction Size | $25M per trade |
| Retail Aggregate | $100M |
| **Special** | Liquidity management products have caps **WAIVED** |

### Counting Rules for Evergreen Limits
- Only the **customer leg** counts toward deal limits (BTB/hedge legs are excluded)
- For bond issuance: deal count = tranche count = client-facing deals
- Back-to-back and hedging transactions do not consume Evergreen capacity

---

## Customer Segment Risk Matrix

| Segment | Standard Products | Complex Products | Leverage Products |
|---------|------------------|-----------------|-------------------|
| Retail | Allowed | Restricted (suitability) | Prohibited (>5x) |
| HNW | Allowed | Allowed (AI disclosure) | Restricted (>10x) |
| Corporate | Allowed | Allowed (hedging purpose) | Allowed (with limits) |
| Institutional | Allowed | Allowed | Allowed |
| Bank/FI | Allowed | Allowed | Allowed |

---

## Notional Threshold Escalation Matrix

| Threshold | Required Action | Additional Sign-off | Timeline Impact |
|-----------|----------------|--------------------|--------------------|
| > $10M + Derivative | MLR Review required | MLRO | +0.5 day |
| > $20M | ROAE analysis likely needed | Finance VP | +1 day |
| > $50M | Finance VP approval | Finance VP, Risk Head | +1.5 days |
| > $100M | CFO approval | CFO, CRO, Finance VP | +2-3 days |
| > $500M | Board Risk Committee | Board, CEO, CFO, CRO | +5-10 days |

---

## Cross-Border Complexity Matrix

| Booking Location | Counterparty Location | Complexity | Mandatory Sign-offs |
|-----------------|----------------------|------------|---------------------|
| Same country | Same country | Low | Standard (Finance, Credit, Ops) |
| Singapore | ASEAN country | Medium | Standard + MLR |
| Singapore | Non-ASEAN | High | Finance, Credit, MLR, Tech, Ops |
| Multiple locations | Multiple locations | Very High | All 5 mandatory + Legal |

---

## Bundling Detection Keywords

When users describe products containing these phrases, flag as potential BUNDLING:
- "package deal", "suite of products", "bundled offering"
- "combined with", "together with", "alongside"
- "multi-leg", "multi-tranche", "multi-currency"
- "phased rollout", "staged implementation"
- "cross-asset", "cross-product", "cross-border package"
- "multiple underlyings in different asset classes"
- References to 2+ distinct product types in same description
