# KB-1 — DCE Document Taxonomy
## Knowledge Base for SA-1 (N-0) Account Type Classification & SA-2 (N-1) Document Processing

| Field | Value |
|---|---|
| **KB ID** | KB-1 |
| **KB Name** | Document Taxonomy |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-03-01 |
| **Owner** | DCE Operations — Document Management |
| **Classification** | ABS Internal — Restricted |
| **Used By** | N-0 (SA-1 Intake & Triage), N-1 (SA-2 Document Collection) |
| **Chunk Size** | 500 tokens |
| **Chunk Overlap** | 50 tokens |
| **Max Chunks** | 5 |
| **Relevance Threshold** | 0.75 |

---

## 1. Account Type Definitions

The DCE Hub supports five account types. Classification is based on the combination of entity type, requested products, and trading intent.

### 1.1 INSTITUTIONAL_FUTURES

- **Definition**: Account for corporate entities, financial institutions, or fund vehicles seeking access to exchange-traded futures and options on regulated exchanges (SGX, HKEX, CME, ICE, Eurex, TOCOM, OSE).
- **Qualifying Entity Types**: CORP, FI, FUND, SPV
- **Qualifying Products**: Listed Futures, Listed Options, Exchange-Traded Fund Derivatives
- **Typical Indicators**: Board resolution present, corporate registration documents, institutional mandate letter, LEI (Legal Entity Identifier) provided
- **Regulatory Regime**: MAS Securities and Futures Act (SFA), HKMA Code of Conduct for Futures Trading
- **Required Schedules**: GTA Schedule 7A (Exchange-Traded Derivatives), Schedule 8A (if margin financing required)
- **Classification Confidence Guidance**: Confidence >= 0.90 when entity type is CORP/FI/FUND AND products include FUTURES or OPTIONS AND no OTC product mentions

### 1.2 RETAIL_FUTURES

- **Definition**: Account for individual natural persons seeking access to exchange-traded futures and options for personal investment or speculative trading.
- **Qualifying Entity Types**: INDIVIDUAL
- **Qualifying Products**: Listed Futures, Listed Options (subject to suitability assessment)
- **Typical Indicators**: Individual ID proof (NRIC/Passport), personal bank account details, no corporate documentation, suitability questionnaire present
- **Regulatory Regime**: MAS SFA — Specified Investment Products (SIP) regime, Customer Knowledge Assessment (CKA) for SIP, HKMA retail investor obligations
- **Required Schedules**: GTA Schedule 7A, Risk Disclosure Statement (mandatory for retail), Customer Knowledge Assessment Form
- **Classification Confidence Guidance**: Confidence >= 0.90 when entity type is INDIVIDUAL AND products are exchange-traded only AND no institutional mandate present

### 1.3 OTC_DERIVATIVES

- **Definition**: Account for any entity type seeking access to over-the-counter (OTC) derivative products including interest rate swaps (IRS), cross-currency swaps (CCS), FX forwards, FX options, credit default swaps (CDS), and structured products.
- **Qualifying Entity Types**: CORP, FI, FUND, SPV, INDIVIDUAL (subject to accredited investor status)
- **Qualifying Products**: IRS, CCS, FX Forwards, FX Options, CDS, Total Return Swaps (TRS), Equity-Linked Notes (ELN), Structured Deposits
- **Typical Indicators**: ISDA Master Agreement reference, CSA (Credit Support Annex) documentation, OTC product-specific risk disclosures, bilateral netting agreements
- **Regulatory Regime**: MAS SFA — OTC Derivatives Reporting and Clearing, HKMA OTC Derivatives Regime
- **Required Schedules**: GTA Schedule 9 (OTC Derivatives), ISDA Schedule, CSA
- **Classification Confidence Guidance**: Confidence >= 0.90 when products explicitly mention IRS, CCS, swaps, forwards, OTC, or structured products. Confidence 0.70-0.89 if product descriptions are ambiguous but entity context suggests OTC intent.

### 1.4 COMMODITIES_PHYSICAL

- **Definition**: Account for entities engaged in physical commodity trading requiring physical delivery settlement, warehousing arrangements, and commodity-specific documentation.
- **Qualifying Entity Types**: CORP, SPV (trading houses, commodity dealers, agricultural exporters)
- **Qualifying Products**: Physical Gold, Physical Silver, Physical Crude Oil, Agricultural Commodities (palm oil, rubber), Base Metals (copper, aluminium)
- **Typical Indicators**: Warehouse receipts, commodity trader licence, physical delivery instructions, commodity broker registration, trade finance documentation
- **Regulatory Regime**: MAS SFA — Commodity Trading, HKMA Commodity Derivatives, Singapore Commodity Exchange (SICOM) rules
- **Required Schedules**: GTA Schedule 10 (Physical Commodities), Warehouse Agreement, Delivery Instructions Addendum
- **Classification Confidence Guidance**: Confidence >= 0.90 when products explicitly mention physical delivery, warehousing, or commodity-specific terms. Confidence 0.70-0.89 if commodity futures requested (could be INSTITUTIONAL_FUTURES with commodity overlay).

### 1.5 MULTI_PRODUCT

- **Definition**: Account for entities requesting access to two or more product categories that span different account types (e.g., futures + OTC + commodities). Requires composite documentation from multiple schedules.
- **Qualifying Entity Types**: CORP, FI, FUND, SPV
- **Qualifying Products**: Any combination of 2+ product categories from the above types
- **Typical Indicators**: Multiple product mentions in submission, diverse schedule requirements, complex entity structure
- **Regulatory Regime**: Composite — all applicable regimes from constituent product types
- **Required Schedules**: Multiple GTA schedules as applicable per product type
- **Classification Confidence Guidance**: Confidence >= 0.85 when 2+ distinct product categories are explicitly requested. Default to MULTI_PRODUCT when products span both exchange-traded AND OTC, or both derivatives AND physical.

---

## 2. Entity Type Classification Rules

| Entity Type Code | Full Name | Description | Typical Documents | Jurisdictional Notes |
|---|---|---|---|---|
| **CORP** | Corporation | Private or public limited company registered under Companies Act | Certificate of Incorporation, Memorandum & Articles of Association, Board Resolution, Register of Directors/Shareholders | SGP: ACRA BizFile extract. HKG: CR form. |
| **FUND** | Investment Fund | Regulated or unregulated fund vehicle (hedge fund, PE fund, UCITS, VCC) | Fund prospectus/PPM, Investment Management Agreement, Fund administrator confirmation, NAV statement | SGP: VCC Act 2018 for VCC structures. HKG: SFC-authorised fund documentation. |
| **FI** | Financial Institution | Bank, broker-dealer, insurance company, licensed financial intermediary | Banking licence, regulatory approval letter, audited financial statements, LEI certificate | Inter-FI relationships require enhanced due diligence under MAS Notice 626. |
| **SPV** | Special Purpose Vehicle | Single-purpose entity created for specific transaction or asset holding | Trust deed/SPV constitution, letter from sponsor/parent entity, structure chart, UBO declaration through to natural persons | SPVs require full look-through to UBO (Ultimate Beneficial Owner) per MAS/HKMA AML requirements. |
| **INDIVIDUAL** | Natural Person | Individual human client (retail or high-net-worth) | NRIC/Passport, Proof of Address (utility bill, bank statement), Employment letter or business registration, Accredited Investor declaration (if applicable) | SGP: SIP suitability assessment required. HKG: PI (Professional Investor) status check for certain products. |

---

## 3. Document Type Master Registry

### 3.1 Core Account Opening Documents

| Doc Type Code | Document Name | Description | Mandatory For | Format | Typical Size |
|---|---|---|---|---|---|
| `AO_FORM` | Account Opening Application Form | Master application form capturing client details, product elections, and authorised signatory declarations | All account types | PDF (signed) | 10-30 pages |
| `CORP_PROFILE` | Corporate Profile | Company overview including registered address, business nature, ownership structure, and key personnel | CORP, FUND, FI, SPV | PDF/DOCX | 5-15 pages |
| `BOARD_RES` | Board Resolution | Corporate board resolution authorising the opening of the DCE account and designating authorised signatories | CORP, FUND, FI | PDF (signed, sealed) | 1-3 pages |
| `CERT_INCORP` | Certificate of Incorporation | Government-issued certificate confirming entity registration | CORP, FUND, SPV | PDF (certified copy) | 1 page |
| `M_AND_A` | Memorandum & Articles of Association | Constitutional documents of the entity | CORP, SPV | PDF | 20-100 pages |
| `MANDATE_LETTER` | Mandate Letter / Authority Letter | Letter authorising specific individuals to operate the account and execute trades | All (except INDIVIDUAL) | PDF (signed) | 1-5 pages |
| `UBO_DECL` | UBO Declaration Form | Declaration of Ultimate Beneficial Owners (natural persons owning >= 25%) | CORP, FUND, SPV | PDF (signed) | 2-5 pages |

### 3.2 Identity & KYC Documents

| Doc Type Code | Document Name | Description | Mandatory For | Format | Typical Size |
|---|---|---|---|---|---|
| `ID_NRIC` | National Identity Card (NRIC) | Singapore NRIC for Singapore citizens/PRs | INDIVIDUAL (SGP), Signatories (SGP) | PDF/JPG (copy) | 1 page |
| `ID_PASSPORT` | Passport | International passport for non-SGP nationals | INDIVIDUAL (non-SGP), Signatories (non-SGP) | PDF/JPG (copy) | 2 pages |
| `ID_HKID` | Hong Kong Identity Card | HKID for HKG-jurisdiction clients | INDIVIDUAL (HKG), Signatories (HKG) | PDF/JPG (copy) | 1 page |
| `PROOF_ADDR` | Proof of Address | Utility bill, bank statement, or government correspondence (< 3 months old) | INDIVIDUAL, CORP (registered address verification) | PDF | 1-3 pages |
| `ACCREDITED_INV` | Accredited Investor Declaration | Declaration confirming accredited/professional investor status | INDIVIDUAL (for OTC/complex products) | PDF (signed) | 1-2 pages |

### 3.3 Legal & Regulatory Documents

| Doc Type Code | Document Name | Description | Mandatory For | Format | Typical Size |
|---|---|---|---|---|---|
| `GTA` | General Trading Agreement | Master legal agreement governing the DCE trading relationship | All account types | PDF (signed) | 40-80 pages |
| `GTA_SCH_7A` | GTA Schedule 7A | Exchange-Traded Derivatives schedule | INSTITUTIONAL_FUTURES, RETAIL_FUTURES, MULTI_PRODUCT (if ETD) | PDF (signed) | 5-10 pages |
| `GTA_SCH_8A` | GTA Schedule 8A | Margin Financing schedule | Where margin financing is elected | PDF (signed) | 5-8 pages |
| `GTA_SCH_9` | GTA Schedule 9 | OTC Derivatives schedule | OTC_DERIVATIVES, MULTI_PRODUCT (if OTC) | PDF (signed) | 8-15 pages |
| `GTA_SCH_10` | GTA Schedule 10 | Physical Commodities schedule | COMMODITIES_PHYSICAL, MULTI_PRODUCT (if physical) | PDF (signed) | 5-10 pages |
| `RISK_DISCLOSURE` | Risk Disclosure Statement | Mandatory risk disclosure for derivatives trading | All account types (RETAIL mandatory, others as applicable) | PDF (signed acknowledgement) | 10-20 pages |
| `CKA_FORM` | Customer Knowledge Assessment | Suitability assessment form for Specified Investment Products | RETAIL_FUTURES (SGP mandatory) | PDF (completed) | 3-5 pages |
| `ISDA_MASTER` | ISDA Master Agreement | International standard OTC derivatives master agreement | OTC_DERIVATIVES | PDF (signed) | 30-50 pages |
| `CSA` | Credit Support Annex | ISDA CSA for collateral arrangements | OTC_DERIVATIVES (where margined) | PDF (signed) | 10-20 pages |

### 3.4 Financial & Credit Documents

| Doc Type Code | Document Name | Description | Mandatory For | Format | Typical Size |
|---|---|---|---|---|---|
| `FIN_STMT` | Audited Financial Statements | Latest audited annual financial statements (< 18 months old) | CORP, FI, FUND | PDF | 30-100 pages |
| `MGMT_ACCTS` | Management Accounts | Interim management accounts (if audited financials > 12 months) | CORP (supplementary) | PDF/XLS | 5-20 pages |
| `BANK_REF` | Bank Reference Letter | Reference letter from the client's primary bank | CORP, FUND (if new banking relationship) | PDF | 1-2 pages |
| `LEI_CERT` | LEI Certificate | Legal Entity Identifier certificate from GLEIF-accredited issuer | FI (mandatory), CORP/FUND (for OTC reporting) | PDF | 1 page |

### 3.5 Fund-Specific Documents

| Doc Type Code | Document Name | Description | Mandatory For | Format | Typical Size |
|---|---|---|---|---|---|
| `FUND_PPM` | Private Placement Memorandum | Fund offering document | FUND | PDF | 50-200 pages |
| `FUND_IMA` | Investment Management Agreement | Agreement with the fund manager | FUND | PDF | 20-40 pages |
| `FUND_ADMIN_CONF` | Fund Administrator Confirmation | Letter from fund administrator confirming fund details | FUND | PDF | 1-2 pages |
| `FUND_NAV` | NAV Statement | Latest Net Asset Value statement | FUND | PDF | 1-3 pages |

### 3.6 Commodity-Specific Documents

| Doc Type Code | Document Name | Description | Mandatory For | Format | Typical Size |
|---|---|---|---|---|---|
| `WAREHOUSE_AGT` | Warehouse Agreement | Agreement with approved commodity warehouse | COMMODITIES_PHYSICAL | PDF (signed) | 10-20 pages |
| `DELIVERY_INST` | Delivery Instructions | Standing delivery instructions for physical settlement | COMMODITIES_PHYSICAL | PDF | 2-5 pages |
| `COMMODITY_LIC` | Commodity Trading Licence | Government-issued commodity trading licence | COMMODITIES_PHYSICAL (where required) | PDF (certified copy) | 1-2 pages |

---

## 4. Product-to-Account Type Mapping Matrix

| Product Category | Product Examples | Primary Account Type | Secondary Account Type |
|---|---|---|---|
| Listed Futures | SGX Nikkei 225, HKEX Hang Seng, CME E-mini S&P, ICE Brent Crude | INSTITUTIONAL_FUTURES (CORP/FI/FUND) or RETAIL_FUTURES (INDIVIDUAL) | MULTI_PRODUCT (if combined) |
| Listed Options | SGX Nifty Options, HKEX Stock Options, CME Corn Options | INSTITUTIONAL_FUTURES or RETAIL_FUTURES | MULTI_PRODUCT (if combined) |
| Interest Rate Swaps | IRS (fixed/float), Basis Swaps | OTC_DERIVATIVES | MULTI_PRODUCT |
| Cross-Currency Swaps | CCS (USD/SGD, USD/HKD) | OTC_DERIVATIVES | MULTI_PRODUCT |
| FX Forwards / Options | NDF, Vanilla FX Options, Barrier Options | OTC_DERIVATIVES | MULTI_PRODUCT |
| Credit Derivatives | CDS, TRS, CLN | OTC_DERIVATIVES | MULTI_PRODUCT |
| Structured Products | ELN, Accumulators, DCI | OTC_DERIVATIVES | MULTI_PRODUCT |
| Physical Gold / Silver | LBMA Gold, Silver bars | COMMODITIES_PHYSICAL | MULTI_PRODUCT |
| Physical Crude / Energy | Brent Crude, WTI (physical delivery) | COMMODITIES_PHYSICAL | MULTI_PRODUCT |
| Agricultural Commodities | Palm Oil (SICOM), Rubber, Sugar | COMMODITIES_PHYSICAL | MULTI_PRODUCT |

---

## 5. Classification Decision Tree

```
START: Received submission
  │
  ├─ Entity Type = INDIVIDUAL?
  │   ├─ YES → Products = Exchange-traded only?
  │   │         ├─ YES → RETAIL_FUTURES (confidence: 0.95)
  │   │         └─ NO  → Products include OTC?
  │   │                   ├─ YES → OTC_DERIVATIVES (verify accredited investor) (confidence: 0.85)
  │   │                   └─ NO  → RETAIL_FUTURES (confidence: 0.80)
  │   │
  │   └─ NO (CORP/FI/FUND/SPV) →
  │       ├─ Products mention physical delivery/warehousing?
  │       │   ├─ YES → Other products also requested?
  │       │   │         ├─ YES → MULTI_PRODUCT (confidence: 0.90)
  │       │   │         └─ NO  → COMMODITIES_PHYSICAL (confidence: 0.92)
  │       │   │
  │       │   └─ NO → Products include OTC (swaps/forwards/structured)?
  │       │           ├─ YES → Also includes exchange-traded?
  │       │           │         ├─ YES → MULTI_PRODUCT (confidence: 0.88)
  │       │           │         └─ NO  → OTC_DERIVATIVES (confidence: 0.92)
  │       │           │
  │       │           └─ NO → INSTITUTIONAL_FUTURES (confidence: 0.94)
  │
  └─ AMBIGUOUS → Flag for RM confirmation (confidence: 0.60-0.69)
```

---

## 6. Document Version Control

| Document | Current Version | Effective Date | Supersedes | Change Summary |
|---|---|---|---|---|
| GTA | v4.2 | 2025-11-01 | v4.1 | Updated margin call provisions per MAS SFA amendments |
| GTA Schedule 7A | v3.1 | 2025-11-01 | v3.0 | Added SGX new product codes |
| GTA Schedule 8A | v2.0 | 2025-06-01 | v1.3 | Margin financing rate structure overhaul |
| GTA Schedule 9 | v2.2 | 2025-11-01 | v2.1 | ISDA 2024 Benchmarks Protocol compliance |
| GTA Schedule 10 | v1.1 | 2025-03-01 | v1.0 | Physical delivery warehouse list update |
| Risk Disclosure | v5.0 | 2025-11-01 | v4.2 | Enhanced retail risk warnings per MAS consultation |
| AO Form | v8.3 | 2026-01-15 | v8.2 | Added digital signature field, LEI mandatory for FI |
| CKA Form | v3.0 | 2025-09-01 | v2.5 | Updated SIP product list per MAS circular |

---

## 7. Jurisdiction-Specific Requirements

### 7.1 Singapore (SGP) — MAS Regulated

| Requirement | Applies To | Document Required | Regulatory Reference |
|---|---|---|---|
| Customer Knowledge Assessment | INDIVIDUAL (SIP products) | CKA_FORM | MAS SFA, SIP Regulations |
| Accredited Investor Status | INDIVIDUAL (OTC/complex) | ACCREDITED_INV | MAS SFA s4A |
| ACRA BizFile Extract | CORP (SGP-incorporated) | CORP_PROFILE (includes BizFile) | Companies Act |
| Risk Disclosure Acknowledgement | All account types | RISK_DISCLOSURE | MAS SFA — Futures Trading Act |
| AML/CFT Declaration | All account types | Embedded in AO_FORM | MAS Notice 626 |

### 7.2 Hong Kong (HKG) — HKMA / SFC Regulated

| Requirement | Applies To | Document Required | Regulatory Reference |
|---|---|---|---|
| Professional Investor Status | INDIVIDUAL (complex products) | PI Declaration Form | SFO s1, Schedule 1 |
| Company Registry Extract | CORP (HKG-incorporated) | CR Form 1(a) extract | Companies Ordinance |
| SFC Licensing Confirmation | FI (if SFC-licensed) | SFC licence copy | Securities and Futures Ordinance |
| Risk Disclosure (Chinese translation) | INDIVIDUAL (HKG) | RISK_DISCLOSURE (bilingual) | SFC Code of Conduct |

### 7.3 China (CHN) — Cross-Border

| Requirement | Applies To | Document Required | Regulatory Reference |
|---|---|---|---|
| SAFE Registration | CORP (cross-border derivatives) | SAFE approval letter | State Administration of Foreign Exchange |
| Business Licence (Notarised) | CORP (PRC-incorporated) | Notarised business licence copy | PRC Companies Law |
| Authorised Representative (Apostilled) | All CHN entities | Apostilled authority document | Hague Convention |

---

## 8. Classification Keyword Indicators

These keywords in the submission body/subject help determine the account type with higher confidence:

### INSTITUTIONAL_FUTURES Keywords
`futures account`, `exchange-traded`, `SGX`, `HKEX`, `CME`, `ICE`, `Eurex`, `TOCOM`, `listed options`, `margin account`, `corporate trading account`, `institutional account`, `clearing member`, `give-up agreement`

### RETAIL_FUTURES Keywords
`personal account`, `individual`, `retail`, `self-directed`, `online trading`, `personal investment`, `NRIC`, `passport`, `suitability`

### OTC_DERIVATIVES Keywords
`ISDA`, `OTC`, `swap`, `forward`, `structured product`, `CDS`, `IRS`, `CCS`, `FX option`, `NDF`, `non-deliverable`, `bilateral`, `CSA`, `collateral`, `netting`

### COMMODITIES_PHYSICAL Keywords
`physical delivery`, `warehouse`, `physical gold`, `physical silver`, `crude oil delivery`, `SICOM`, `palm oil physical`, `base metals`, `LME warrant`, `warehouse receipt`

### MULTI_PRODUCT Keywords
`multiple products`, `futures and OTC`, `derivatives suite`, `full product range`, `exchange and OTC`, `comprehensive access`
