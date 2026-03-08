# KB-1: Document Taxonomy — DCE Account Opening
*Version: 1.0 | Last Updated: 2026-03-02 | Regulatory Scope: MAS (SGP), HKMA (HKG)*

---

## Account Type Definitions

### INSTITUTIONAL_FUTURES
**Definition**: Account for institutional clients (CORP, FUND, FI, SPV) trading exchange-listed futures and options.
**Eligible Entities**: CORP, FUND, FI, SPV
**Eligible Jurisdictions**: SGP, HKG, CHN, OTHER (with enhanced due diligence)
**Products Covered**: 
- FUTURES_SGX, FUTURES_CME, FUTURES_ICE
- OPTIONS_SGX, OPTIONS_CME
- Spread strategies, calendar spreads
**Excluded Products**: OTC derivatives, physical commodities, FX forwards
**Mandatory Documents**:
- Corporate Resolution / Board Authorization
- Financial Statements (audited, last 2 years)
- MAS Form 1A (SGP) / SFC Form 3 (HKG)
- FATCA/CRS Self-Certification
- Authorized Signatory List with specimen signatures
**Classification Signals**:
- Entity type ≠ INDIVIDUAL
- Products include "FUTURES" or "OPTIONS" + exchange suffix
- LEI or registration number present
- RM notes mention "institutional", "fund", "bank"

---

### RETAIL_FUTURES
**Definition**: Account for individual (INDIVIDUAL) clients trading exchange-listed futures/options for personal investment.
**Eligible Entities**: INDIVIDUAL only
**Eligible Jurisdictions**: SGP, HKG (retail access restricted in CHN)
**Products Covered**:
- FUTURES_SGX (mini/micro contracts only)
- OPTIONS_SGX (limited strike ranges)
**Excluded Products**: OTC derivatives, physical commodities, block trades, institutional-only contracts
**Mandatory Documents**:
- NRIC/Passport copy (certified)
- Proof of Address (<3 months)
- Risk Disclosure Acknowledgement (MAS Notice SFA 04-N12)
- Financial Experience Declaration
- Source of Wealth Declaration (if leverage >5x)
**Classification Signals**:
- Entity type = INDIVIDUAL
- Products limited to SGX mini/micro contracts
- No LEI, no corporate documents
- RM notes mention "retail", "personal", "HNWI"

---

### OTC_DERIVATIVES
**Definition**: Account for clients trading over-the-counter derivatives (swaps, forwards, bespoke options).
**Eligible Entities**: CORP, FUND, FI, SPV (INDIVIDUAL only if Accredited Investor status verified)
**Eligible Jurisdictions**: SGP, HKG (CHN requires PBOC approval)
**Products Covered**:
- IRS_SGD, IRS_USD, IRS_EUR
- NDF_ASIA, FX_FORWARD, FX_OPTION
- Commodity swaps (energy, metals)
**Excluded Products**: Exchange-listed futures (unless MULTI_PRODUCT), physical delivery commodities
**Mandatory Documents**:
- ISDA Master Agreement (executed) or ABS Derivatives Terms
- Credit Support Annex (if margin required)
- Accredited Investor Certification (if INDIVIDUAL)
- Enhanced Due Diligence Questionnaire
- Regulatory Reporting Consent (MAS TR, HKMA HKTR)
**Classification Signals**:
- Products include "OTC", "SWAP", "NDF", "FORWARD"
- Entity type ≠ INDIVIDUAL OR AI certification present
- RM notes mention "OTC", "bespoke", "hedging"

---

### COMMODITIES_PHYSICAL
**Definition**: Account for clients trading physical commodity delivery (metals, energy, agriculture).
**Eligible Entities**: CORP, FUND, SPV (FI only for proprietary trading)
**Eligible Jurisdictions**: SGP, HKG, CHN (with commodity trading license)
**Products Covered**:
- PHYSICAL_GOLD, PHYSICAL_SILVER, PHYSICAL_OIL
- WAREHOUSE_RECEIPTS, DELIVERY_CONTRACTS
**Excluded Products**: Cash-settled futures, financial derivatives without physical delivery clause
**Mandatory Documents**:
- Commodity Trading License (jurisdiction-specific)
- Warehouse Agreement (if storage required)
- Logistics/Shipping Documentation Template
- Customs Declaration Authorization
- Environmental & Social Risk Assessment (for energy/agri)
**Classification Signals**:
- Products include "PHYSICAL", "DELIVERY", "WAREHOUSE"
- Entity type = CORP/SPV with commodity business activity
- RM notes mention "physical", "delivery", "logistics"

---

### MULTI_PRODUCT
**Definition**: Account for clients requiring access to ≥2 distinct product categories (e.g., futures + OTC + physical).
**Eligible Entities**: CORP, FUND, FI (SPV case-by-case)
**Eligible Jurisdictions**: SGP, HKG (CHN requires separate licenses per product type)
**Products Covered**: Any combination of futures, OTC, physical commodities
**Excluded Products**: None (by definition)
**Mandatory Documents**: Union of all mandatory documents from each product category requested
**Additional Requirements**:
- Cross-product risk attestation
- Integrated margin methodology acceptance
- Multi-jurisdiction regulatory consent (if applicable)
**Classification Signals**:
- Products_requested array contains items from ≥2 category prefixes (FUTURES_, OTC_, PHYSICAL_)
- RM notes mention "multi-asset", "cross-product", "integrated"
- Client has existing ABS relationships in multiple product lines

---

## Entity Type Classification Criteria

| Entity Type | Definition | Key Identifiers | Jurisdiction Notes |
|------------|------------|----------------|-------------------|
| **CORP** | Incorporated company, Pte Ltd, Ltd, GmbH, etc. | Registration number, LEI, Certificate of Incorporation | SGP: ACRA UEN required; HKG: BR number required |
| **FUND** | Collective investment scheme, hedge fund, private equity | Fund registration number, CIS license, PPM | SGP: MAS CIS authorization; HKG: SFC Type 9 license |
| **FI** | Bank, broker-dealer, insurance company, licensed financial institution | Financial license number, SWIFT BIC, regulatory supervisor | Cross-border FI: home regulator approval letter required |
| **SPV** | Special purpose vehicle, single-asset entity, bankruptcy-remote structure | SPV charter, trust deed, sponsor letter | Enhanced scrutiny: beneficial owner tracing to ultimate parent |
| **INDIVIDUAL** | Natural person, sole proprietor, accredited investor | NRIC/Passport, proof of address, AI certification | AI status requires asset/income verification per MAS Notice SFA 04-N12 |

---

## Product-to-Account Mapping Rules

### Product Prefix → Account Type
FUTURES_SGX, FUTURES_CME, FUTURES_ICE → INSTITUTIONAL_FUTURES or RETAIL_FUTURES
OPTIONS_SGX, OPTIONS_CME → INSTITUTIONAL_FUTURES or RETAIL_FUTURES
IRS_*, NDF_*, FX_FORWARD, FX_OPTION → OTC_DERIVATIVES
PHYSICAL_*, WAREHOUSE_*, DELIVERY_* → COMMODITIES_PHYSICAL

### Disambiguation Logic
1. If products_requested contains ONLY futures/options AND entity_type = INDIVIDUAL → RETAIL_FUTURES
2. If products_requested contains ONLY futures/options AND entity_type ≠ INDIVIDUAL → INSTITUTIONAL_FUTURES
3. If products_requested contains ANY OTC_* prefix → OTC_DERIVATIVES (unless MULTI_PRODUCT criteria met)
4. If products_requested contains ANY PHYSICAL_* prefix → COMMODITIES_PHYSICAL (unless MULTI_PRODUCT criteria met)
5. If products_requested spans ≥2 distinct prefixes above → MULTI_PRODUCT

### Jurisdiction Overrides
- **CHN**: OTC_DERIVATIVES and COMMODITIES_PHYSICAL require PBOC/CSRC approval documentation
- **HKG**: RETAIL_FUTURES restricted to SGX mini/micro contracts only
- **SGP**: All account types permitted; MULTI_PRODUCT requires MAS notification for cross-product risk

---

## Classification Confidence Scoring Guidance
- **High Confidence (≥0.90)**: Clear entity type + unambiguous product set + jurisdiction matches rules
- **Medium Confidence (0.70-0.89)**: Minor ambiguity (e.g., SPV entity, mixed product signals) — flag for RM review
- **Low Confidence (<0.70)**: Missing entity type, conflicting product signals, unsupported jurisdiction — DO NOT auto-classify; route to HITL

*Note: Confidence score is computed by SKL-02 LLM using this taxonomy as reference. Do not override LLM confidence with rule-based scoring.*