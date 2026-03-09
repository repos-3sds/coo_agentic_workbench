# NPA Classification Criteria Reference
# Upload to Dify Knowledge Base: "NPA Classification" dataset

## Overview
The NPA Classification Framework uses 28 criteria across 4 categories to determine whether a proposed financial product is New-to-Group (NTG), a Variation of an existing product, or an Existing product requiring no new approval.

## Scoring System
- Each criterion has a weight (1 or 2 points)
- Score = 0 if criterion NOT triggered, Score = weight if triggered
- Maximum NTG score: 30 points (across 20 NTG criteria)
- Maximum Variation score: 8 points (across 8 VAR criteria)

## Classification Thresholds
| NTG Score | VAR Score | Classification | Approval Track |
|-----------|-----------|----------------|----------------|
| >= 10 | Any | New-to-Group | FULL_NPA |
| 5-9 | Any | NTG Borderline | FULL_NPA (with review) |
| 1-4 | > 0 | Variation | NPA_LITE |
| 0 | > 0 | Variation (minor) | NPA_LITE |
| 0 | 0 | Existing | EVERGREEN |

---

## Category 1: PRODUCT_INNOVATION (5 criteria)

### NTG_PI_01: Entirely new product category (Weight: 2)
Product has no existing equivalent in the bank's portfolio. This is the strongest NTG indicator.
- **Triggers**: Product type never previously offered (e.g., first-ever crypto ETF, first weather derivative)
- **Does NOT trigger**: FX Option when bank already offers FX options, adding a new currency pair to existing product
- **Evidence**: Check existing product catalog. If no match within same product family, score = 2.

### NTG_PI_02: Novel risk profile (Weight: 2)
Risk characteristics are fundamentally different from all existing products.
- **Triggers**: New Greeks not currently modeled, tail risk profiles not covered by existing VaR, new correlation risks
- **Does NOT trigger**: Same risk type with different magnitude (e.g., larger notional of existing product type)
- **Evidence**: Compare with existing risk models. If new risk factors required, score = 2.

### NTG_PI_03: New underlying asset class (Weight: 2)
The underlying asset has not been previously traded or held by the bank.
- **Triggers**: First commodity product when bank only does FX/rates, first crypto asset, first carbon credit
- **Does NOT trigger**: New currency pair in existing FX product line, new tenor for existing rate product
- **Evidence**: Check asset class coverage in existing booking systems.

### NTG_PI_04: New pricing/valuation methodology (Weight: 1)
Requires new models or valuation approaches not currently in production.
- **Triggers**: Monte Carlo simulation when only Black-Scholes exists, new correlation models, AI-based pricing
- **Does NOT trigger**: Parameter changes to existing models, recalibration of existing curves
- **Evidence**: Check with Quant team if existing models can price the product.

### NTG_PI_05: New technology platform required (Weight: 1)
Cannot be supported by existing trading, risk, or booking systems.
- **Triggers**: Requires new trading platform, new risk engine, new settlement system
- **Does NOT trigger**: Configuration changes to existing systems, adding new instrument types to Murex
- **Evidence**: System capability assessment from Technology team.

---

## Category 2: MARKET_CUSTOMER (5 criteria)

### NTG_MC_01: New customer segment (Weight: 2)
Targeting customer segments not previously served with this type of product.
- **Triggers**: Offering institutional products to retail for first time, entering private banking from corporate
- **Does NOT trigger**: Expanding within existing segment (e.g., more corporate clients for existing product)

### NTG_MC_02: New market/geography (Weight: 2)
Entering a market or geography where the bank has no existing presence for this product type.
- **Triggers**: First product offering in a new country, entering a market where bank has no license
- **Does NOT trigger**: Expanding sales in an existing licensed jurisdiction

### NTG_MC_03: New distribution channel (Weight: 1)
Requires fundamentally new distribution infrastructure.
- **Triggers**: First digital/online distribution when only phone-based existed, first API-based distribution
- **Does NOT trigger**: Adding a new sales team for existing channel

### NTG_MC_04: New regulatory framework (Weight: 2)
Subject to regulations the bank has not previously navigated.
- **Triggers**: First MiFID II product, first product under new MAS Notice, first CFTC-regulated product
- **Does NOT trigger**: Product under same regulatory framework as existing products

### NTG_MC_05: New competitive landscape (Weight: 1)
Operating in a market with entirely different competitive dynamics.
- **Triggers**: Entering fintech-dominated space, competing against non-bank players for first time
- **Does NOT trigger**: Adding another bank as competitor in existing market

---

## Category 3: RISK_REGULATORY (5 criteria)

### NTG_RR_01: New regulatory license required (Weight: 2)
Requires new licensing or regulatory approval to offer the product.
- **Triggers**: Need CFTC registration, need new MAS CMS license, need EU passporting
- **Does NOT trigger**: Operating under existing licenses

### NTG_RR_02: New risk management framework (Weight: 2)
Existing risk frameworks are insufficient to manage the product's risks.
- **Triggers**: Need new stress testing methodology, new limit frameworks, new risk aggregation
- **Does NOT trigger**: Adjusting parameters within existing framework

### NTG_RR_03: New compliance program needed (Weight: 1)
Requires dedicated compliance monitoring program.
- **Triggers**: New suitability requirements, new best execution obligations, new reporting requirements
- **Does NOT trigger**: Extending existing compliance programs to cover new product

### NTG_RR_04: Cross-border regulatory complexity (Weight: 2)
Multi-jurisdictional regulatory navigation required.
- **Triggers**: Booking in Singapore, selling in UK, counterparty in Hong Kong — three regulatory regimes
- **Does NOT trigger**: Single-jurisdiction product
- **CRITICAL**: This criterion is automatically scored if is_cross_border=true

### NTG_RR_05: Enhanced AML/KYC requirements (Weight: 1)
Standard AML/KYC procedures are insufficient for the product.
- **Triggers**: Products involving high-risk jurisdictions, PEP exposure, bearer instruments
- **Does NOT trigger**: Standard KYC for known client segments

---

## Category 4: FINANCIAL_OPERATIONAL (5 criteria)

### NTG_FO_01: New booking infrastructure (Weight: 2)
Existing booking systems (Murex, Calypso, etc.) cannot accommodate the product.
- **Triggers**: Need new instrument type in Murex, new asset class not in booking system
- **Does NOT trigger**: Adding new parameters to existing instrument type

### NTG_FO_02: New settlement mechanism (Weight: 2)
Settlement process is fundamentally different from existing products.
- **Triggers**: First DvP product when only FoP exists, first blockchain settlement, first T+0 settlement
- **Does NOT trigger**: Standard T+2 settlement for new FX product

### NTG_FO_03: New capital treatment (Weight: 1)
Product requires new regulatory capital calculation methodology.
- **Triggers**: First product under FRTB SA, new CVA calculation, new initial margin methodology
- **Does NOT trigger**: Standard RWA calculation for product in existing capital framework

### NTG_FO_04: Significant operational build (Weight: 1)
Requires new operational processes, procedures, and potentially new teams.
- **Triggers**: New operations desk needed, new reconciliation process, new reporting capability
- **Does NOT trigger**: Minor process adjustments for existing ops team

### NTG_FO_05: New external dependency (Weight: 1)
Critical dependency on new external parties or vendors not previously used.
- **Triggers**: New clearing house, new custodian, new data provider, new technology vendor
- **Does NOT trigger**: Using existing vendors for new product

---

## Variation Criteria (8 criteria, all Weight: 1)

These are scored ONLY when the product is NOT classified as NTG (NTG score < 5):

### VAR_01: Change in underlying asset or reference rate
Underlying shifts but product mechanics remain the same (e.g., FX Option now on AUD/JPY instead of EUR/USD).

### VAR_02: Change in tenor or maturity range
Extension or reduction of product tenor (e.g., 5Y swap when only 1-3Y existed).

### VAR_03: Change in target customer segment
Expanding to adjacent customer segments (e.g., corporate product now offered to HNW).

### VAR_04: Change in distribution channel
Adding new distribution channel to existing product (e.g., adding online execution).

### VAR_05: Change in jurisdiction or booking location
Extending product to new booking entity/jurisdiction (e.g., Singapore product now also booked in Hong Kong).

### VAR_06: Change in risk limits or parameters
Material change to risk thresholds or limits (e.g., increasing max notional from $50M to $200M).

### VAR_07: Change in external party or vendor
Switching or adding critical third-party providers (e.g., new clearing broker).

### VAR_08: Change in regulatory treatment or framework
Regulatory change affecting product operation (e.g., new margin requirements under UMR).
