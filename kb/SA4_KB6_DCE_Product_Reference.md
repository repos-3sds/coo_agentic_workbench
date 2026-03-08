# KB-6: DCE Product Reference — Risk Profiles and Margin Requirements

**Knowledge Base ID:** KB-6
**Used By:** SA-4 KYC/CDD Preparation Agent (N-3)
**Version:** 1.0.0 | 2026-03-07
**Source:** DCE Product Committee Approved Reference — March 2026

---

## 1. Overview

This knowledge base provides product risk profiles and typical margin requirements for DCE (Digital Client Experience) account products. SA-4 uses this reference when compiling Section 8 (Risk Factors) and Section 11 (Suggested Risk Rating Range) of the KYC/CDD brief. The product profile directly influences the RM's assessment of the client's trading risk level.

---

## 2. Product Catalogue and Risk Classification

### 2.1 FUTURES — Exchange-Traded Futures

| Parameter | Value |
|-----------|-------|
| **Product Code** | FUTURES |
| **Risk Classification** | MEDIUM |
| **Exchange** | SGX (SGP), HKEX (HKG), CME / ICE (USD-denominated) |
| **Margin Type** | Initial margin + variation margin (daily mark-to-market) |
| **Typical Initial Margin** | 5–15% of notional contract value |
| **Maximum Leverage** | Up to 20:1 |
| **Regulatory Licences Required** | MAS CMS Licence (SGP); SFC Type 2 (HKG) |
| **Retail Eligible** | Yes (with Customer Knowledge Assessment — CKA) |
| **Key Risk Factors** | Leverage risk; mark-to-market margin calls; liquidity risk on less-traded contracts |
| **KYC Risk Contribution** | LOW-MEDIUM (standard institutional product) |

**Eligible Clients:** Institutional (corporations, FI, funds); Retail (with CKA pass); Professional Investors.

**Product-Specific KYC Note:** Clients trading commodity futures (agricultural, energy, metals) require additional source of commercial purpose documentation if trade volumes exceed SGD 5M notional per month.

---

### 2.2 OPTIONS — Exchange-Traded Options

| Parameter | Value |
|-----------|-------|
| **Product Code** | OPTIONS |
| **Risk Classification** | MEDIUM-HIGH |
| **Exchange** | SGX, HKEX, CBOE (USD) |
| **Margin Type** | Premium (buyers); Initial + variation margin (sellers/writers) |
| **Typical Margin — Option Writers** | 10–25% of notional |
| **Maximum Leverage** | Up to 50:1 (for option writers) |
| **Regulatory Licences Required** | MAS CMS Licence; SFC Type 2 |
| **Retail Eligible** | No — Restricted to Accredited Investors and Professional Investors |
| **Key Risk Factors** | Theoretically unlimited downside for option writers; volatility risk; time decay |
| **KYC Risk Contribution** | MEDIUM (retail restriction adds complexity) |

**Special KYC Consideration:** Option writing requires explicit confirmation that client understands unlimited loss potential. RM must document this acknowledgement in the brief.

---

### 2.3 OTC_DERIVATIVES — Over-the-Counter Derivatives

| Parameter | Value |
|-----------|-------|
| **Product Code** | OTC_DERIVATIVES |
| **Risk Classification** | HIGH |
| **Instruments** | Interest Rate Swaps (IRS), Cross-Currency Swaps (CCS), FX Forwards, FX Options (NDF/NDO), Credit Default Swaps (CDS), Equity Derivatives |
| **Clearing** | Mandatory clearing via LCH/JSCC for standardised instruments (MAS MAS Notice SFA 04-N13); bilateral for bespoke |
| **Margin Type** | Initial margin (SIMM model) + variation margin (daily) for cleared; negotiated CSA/credit facility for bilateral |
| **Typical Margin Requirement** | 2–8% SIMM initial margin (varies significantly by instrument and tenor) |
| **Regulatory Licences Required** | MAS CMS Licence (derivative trading); Schedule 2 SFHA (SGP); SFC Type 2 + Type 5 (HKG) |
| **Retail Eligible** | No — Institutional and Accredited Investors only |
| **Key Risk Factors** | Counterparty credit risk; basis risk; liquidity risk for illiquid OTC instruments; model risk (SIMM sensitivity) |
| **KYC Risk Contribution** | HIGH (complexity; counterparty credit risk; regulatory complexity) |

**OSCA Requirement:** All OTC derivative accounts require OSCA (Options and Structured Credit Assessment) case number. RM must obtain OSCA approval before account goes live.

**Product-Specific KYC Note:** For clients requesting CDS: verify CDS is not being used for naked credit speculation without underlying exposure — this triggers enhanced suitability assessment.

---

### 2.4 COMMODITIES_PHYSICAL — Physical Commodity Trading

| Parameter | Value |
|-----------|-------|
| **Product Code** | COMMODITIES_PHYSICAL |
| **Risk Classification** | MEDIUM-HIGH |
| **Commodities** | Crude oil (Brent, WTI), LNG, refined products, base metals (copper, aluminium), precious metals (gold, silver), agricultural (rubber, palm oil, rice) |
| **Settlement** | Physical delivery or cash-settled (client elects at AO) |
| **Margin Type** | Commodity margin per MT/BBL/oz; warehouse receipt financing (for physical) |
| **Typical Margin** | 3–10% of commodity value at time of trade |
| **Regulatory Licences Required** | MAS CMS Licence (for commodity derivatives); no specific licence for pure physical; SGX Commodity memberships for exchange-traded |
| **Retail Eligible** | No — Institutional and Accredited Investors only |
| **Key Risk Factors** | Physical delivery logistics risk; storage and insurance; price volatility; jurisdiction-specific commodity regulations (e.g. Petronas rules for Malaysian crude) |
| **KYC Risk Contribution** | MEDIUM-HIGH (source of commercial purpose must be verified) |

**Source of Commercial Purpose — Mandatory for COMMODITIES_PHYSICAL:**
- Client must demonstrate legitimate commercial commodity trading purpose
- Acceptable evidence: trade invoices, warehouse receipts, off-take agreements, hedging policy documents
- Pure financial speculation in physical commodities requires specific approval from DCE Risk Committee

---

### 2.5 MULTI_PRODUCT — Multiple Product Categories

| Parameter | Value |
|-----------|-------|
| **Product Code** | MULTI_PRODUCT |
| **Risk Classification** | Determined by highest-risk individual product requested |
| **KYC Risk Contribution** | Composite — assessed per product (see individual product entries above) |

**MULTI_PRODUCT KYC Protocol:**
1. Assess KYC requirements for each product individually
2. Apply the most stringent documentation requirements
3. Risk rating based on the highest-risk product
4. OSCA required if any OTC derivative product included
5. Combined DCE limit must reflect aggregated product risk exposure

---

## 3. DCE Credit Limit Framework

### 3.1 Recommended DCE Limit Ranges

| Client Type | Product | Typical DCE Limit Range (SGD) | Notes |
|------------|---------|------------------------------|-------|
| Institutional CORP (large) | FUTURES | 5M – 50M | Based on net asset value |
| Institutional CORP (mid) | FUTURES | 1M – 5M | |
| Fund (FUND) | FUTURES + OTC | 5M – 100M | Depends on AUM |
| FI (Financial Institution) | FUTURES + OTC | 10M – 500M | SLA/credit line basis |
| Retail Individual | FUTURES | 50K – 500K | Subject to CKA pass |
| CORP — COMMODITIES_PHYSICAL | PHYSICAL | 2M – 20M | Per commodity and storage capacity |

### 3.2 DCE-PCE Limit (Potential Credit Exposure)

DCE-PCE limit is set at 25–50% of the DCE limit for most clients. For OTC derivative accounts, PCE uses SIMM methodology and is recalculated quarterly.

| Product | Typical PCE / DCE Ratio |
|---------|------------------------|
| FUTURES only | 25–35% |
| OTC_DERIVATIVES | 40–60% |
| COMMODITIES_PHYSICAL | 30–45% |
| MULTI_PRODUCT | 45–60% (highest of components) |

---

## 4. Margin Profile Summary

| Product | Initial Margin Range | Variation Margin | Margin Call Trigger |
|---------|---------------------|-----------------|-------------------|
| FUTURES | 5–15% notional | Daily MTM | Below maintenance margin |
| OPTIONS (writers) | 10–25% notional | Daily MTM | Premium erosion + delta shift |
| OTC_DERIVATIVES | 2–8% SIMM | Daily MTM | SIMM threshold breach |
| COMMODITIES_PHYSICAL | 3–10% commodity value | Price movement | Below 70% of initial |

---

## 5. Suggested Risk Rating Ranges by Product

The agent uses these ranges to populate the "Suggested Risk Rating Range" field in the KYC brief. The RM makes the final determination.

| Products Requested | Suggested Risk Range | Key Driver |
|-------------------|---------------------|------------|
| FUTURES only | LOW–MEDIUM | Standard institutional product |
| OPTIONS only | MEDIUM | Retail restriction; writer complexity |
| OTC_DERIVATIVES only | MEDIUM–HIGH | Counterparty credit; complexity |
| COMMODITIES_PHYSICAL only | MEDIUM | Commercial purpose verification |
| FUTURES + OPTIONS | MEDIUM | Option writing risk |
| FUTURES + OTC_DERIVATIVES | MEDIUM–HIGH | OTC complexity dominates |
| FUTURES + COMMODITIES_PHYSICAL | MEDIUM | Dual regulation |
| MULTI_PRODUCT (all) | HIGH | Full product complexity |

**Jurisdiction Modifier:**
- SGP or HKG entity → no adjustment (standard FATF jurisdiction)
- CHN entity → +1 tier (additional cross-border documentation)
- FATF grey-list jurisdiction → +1 tier
- FATF high-risk jurisdiction → UNACCEPTABLE (requires CCO approval)

---

## 6. OSCA Case Number Requirement Matrix

| Products Requested | OSCA Required? |
|-------------------|---------------|
| FUTURES only | No |
| OPTIONS only | No |
| OTC_DERIVATIVES (any) | **YES — mandatory** |
| COMMODITIES_PHYSICAL only | No (unless financial derivative overlay) |
| MULTI_PRODUCT including OTC | **YES — mandatory** |

**OSCA Process:** RM submits OSCA application through Credit Risk portal. OSCA case number is obtained before or during RM review of the KYC brief. RM enters OSCA case number in the mandatory decision form.
