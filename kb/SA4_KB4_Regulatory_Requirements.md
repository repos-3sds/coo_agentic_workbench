# KB-4: Regulatory Requirements — KYC/CDD for DCE Account Opening

**Knowledge Base ID:** KB-4
**Used By:** SA-4 KYC/CDD Preparation Agent (N-3)
**Version:** 1.0.0 | 2026-03-07
**Regulatory Basis:** MAS Notice SFA 02-N13, MAS Notice 626 (AML/CFT), HKMA AML/CFT Guidelines, ABS KYC Policy v4.2

---

## 1. Regulatory Framework Overview

### Singapore (SGP) — MAS Jurisdiction
- **Primary:** MAS Notice SFA 02-N13 — Know Your Customer and Client Due Diligence Requirements
- **AML/CFT:** MAS Notice 626 — Prevention of Money Laundering and Countering the Financing of Terrorism
- **TAFA:** Terrorism (Suppression of Financing) Act
- **Persons Act:** Significant Persons Act (SPA) — Politically Exposed Persons obligations

### Hong Kong (HKG) — HKMA Jurisdiction
- **Primary:** HKMA Guideline on Anti-Money Laundering and Counter-Terrorist Financing
- **AMLO:** Anti-Money Laundering and Counter-Terrorist Financing Ordinance (Cap 615)
- **SFC:** SFC Code of Conduct — client due diligence requirements for licensed firms

### Cross-Jurisdictional
- **FATF:** Financial Action Task Force 40 Recommendations (baseline CDD standard)
- **Wolfsberg:** Wolfsberg Group Correspondent Banking and Private Banking Principles
- **UN Sanctions:** All UN Security Council resolutions on sanctions and asset freezing

---

## 2. CDD Requirements by Entity Type

### 2.1 Corporate Entities (CORP)

**Mandatory CDD Documents:**
1. Certificate of Incorporation / Business Registration Certificate
2. Memorandum and Articles of Association (or equivalent constitutional document)
3. Certificate of Incumbency (if recently incorporated or offshore entity)
4. ACRA BizProfile extract (SGP) / Companies Registry Certificate (HKG) — not older than 3 months
5. Audited financial statements or management accounts (last 2 years)
6. Board resolution authorising account opening and designating authorised signatories
7. Identification documents for minimum 2 directors and all UBOs above 25% threshold

**UBO Identification Threshold:**
- Standard: 25% direct or indirect beneficial ownership
- Enhanced (EDD triggers): 10% threshold applies when any director/UBO is a PEP, or entity is in FATF high-risk jurisdiction
- All UBOs must be identified recursively through ownership chain

**Director Identification (minimum 2 key directors required):**
- Full legal name, nationality, date of birth
- Government-issued photo ID (NRIC for SGP; HKID for HKG; Passport for others)
- Residential address proof (not older than 3 months)

### 2.2 Fund Entities (FUND / LP / TRUST)

**Additional requirements beyond CORP:**
- Fund prospectus or offering memorandum
- Fund manager CDD (if separate from the fund entity)
- List of fund investors / limited partners above 25% economic interest threshold
- Custodian and prime broker identification
- Regulatory registration of fund manager (SGP: MAS-licensed fund manager; HKG: SFC-authorised fund manager)
- For hedge funds: complete list of managing partners and investment committee members

### 2.3 Financial Institutions (FI)

**Simplified CDD Eligibility Conditions** (MAS Notice 626, Para 6.14):
- FI must be regulated in a FATF-member jurisdiction
- FI must not be from a FATF-identified high-risk jurisdiction
- ABS must have no concerns about the FI's AML/CFT controls

**If Simplified CDD applies:**
- Abbreviated entity documentation (registration certificate + regulatory status confirmation)
- No individual UBO identification required if FI is publicly listed on recognised exchange

**Standard CDD applies if:**
- FI is from non-FATF jurisdiction
- ABS has concerns about FI's AML/CFT framework
- FI is a money services business or payment institution

### 2.4 Individual Accounts (INDIVIDUAL / RETAIL)

**MAS Retail Investor Obligations:**
- Mandatory: Customer Account Review (CAR) questionnaire
- Mandatory: Risk Disclosure Statement — customer must acknowledge reading and understanding
- Mandatory: Customer Knowledge Assessment (CKA) for specified investment products (futures, options)
- BCAP (Bonus/Contractual/Asset Protection) requires explicit declaration if applicable
- Minimum age: 21 years (SGP) / 18 years (HKG)

---

## 3. Enhanced Due Diligence (EDD) Triggers

EDD must be applied (additional scrutiny, more frequent reviews) when:

| Trigger | EDD Action Required |
|---------|-------------------|
| Entity or UBO is a Politically Exposed Person (PEP) | Senior management approval; source of wealth/funds documentation; annual review |
| Entity from FATF high-risk jurisdiction (Iran, North Korea, Myanmar, etc.) | Enhanced checks; specific approval from Chief Compliance Officer |
| Entity from FATF grey list jurisdiction | Increased monitoring; additional source of wealth documentation |
| Adverse media hits on entity or key individuals | RM investigation; documented resolution in KYC brief |
| Transactions inconsistent with stated business (post-onboarding) | SARs filing if suspicious; enhanced monitoring |
| Complex ownership structure (≥3 layers, offshore SPVs, nominee shareholders) | Map full ownership chain; document each UBO at every level |
| Business involves cash-intensive industry | Source of funds documentation |
| No face-to-face meeting with customer | Additional ID verification steps |

---

## 4. Sanctions Screening Requirements

### Mandatory Screening — All Cases

All names identified in the entity structure must be screened:
- **Entity itself** (full legal name + trading name if applicable)
- **All directors** (by name on ID documents)
- **All UBOs above 25%** (individual and entity UBOs)
- **All guarantors** (if applicable)
- **All authorised signatories** (from mandate)

### Screening Sources
- **Sanctions:** Refinitiv World-Check (API-3) — covers UN, EU, US OFAC, UK, SGP MAS, HKG HKMA sanctions lists
- **PEP Database:** Dow Jones Risk (API-4) — tier 1, 2, 3 PEPs and their immediate family members
- **Adverse Media:** Factiva (API-5) — financial crime, fraud, corruption keywords

### Hit Resolution Rules

| Screening Result | Required Action |
|----------------|----------------|
| CLEAR | Proceed with KYC brief compilation |
| POTENTIAL_MATCH | Flag in KYC brief; RM must investigate and document resolution |
| HIT_CONFIRMED | IMMEDIATE case suspension; escalate to Compliance (CRITICAL priority) |

**CONFIRMED HIT is defined as:** A match where name, date of birth, and country of residence align with a sanctions list entry. Partial name matches without corroborating data are POTENTIAL_MATCH.

---

## 5. KYC Risk Rating Methodology

### Risk Factors

| Factor | Weight | LOW | MEDIUM | HIGH |
|--------|--------|-----|--------|------|
| Jurisdiction | 30% | FATF low-risk | FATF standard | FATF high-risk / grey-list |
| Entity complexity | 20% | Simple CORP/INDIVIDUAL | CORP with UBOs | Multi-layer structure / offshore |
| PEP exposure | 20% | None | PEP connection (indirect) | Direct PEP |
| Product risk | 15% | Standard futures | OTC derivatives | Complex exotic / structured |
| Adverse media | 10% | None | Minor historical | Significant / recent |
| Client tier | 5% | Institutional / FI | Corporate | Retail / Individual |

### Rating Thresholds
- **LOW:** Weighted score ≤ 35%
- **MEDIUM:** Weighted score 36–65%
- **HIGH:** Weighted score 66–89%
- **UNACCEPTABLE:** Any confirmed sanctions hit; FATF high-risk jurisdiction without CCO approval; cumulative score > 89%

**Important:** Risk rating is the RM's determination, not the agent's. The KYC brief provides a suggested risk range based on the above factors. The RM may assign a higher or lower rating based on their knowledge of the client relationship.

---

## 6. Source of Wealth / Source of Funds

### SGP Requirements (MAS Notice SFA 02-N13, Para 18)

For all clients, RM must obtain and document:
1. **Primary business activity** — what does the entity do to generate revenue?
2. **Revenue profile** — approximate annual turnover range
3. **Source of initial capital** — how was the entity's capital funded?
4. **Trading purpose** — what is the stated purpose of DCE account usage?

For HIGH-risk clients, additionally:
- Audited financial statements for last 2 years
- Bank reference letters
- Independent verification of source of funds

### HKG Requirements (HKMA AML/CFT Guidelines, Para 4.24)

- Statement of source of funds in the account opening form
- For complex offshore structures: trace funds to their ultimate source
- For FUND entities: prospectus must disclose investor subscription mechanism

---

## 7. CDD Clearance Levels

| Clearance Level | Meaning | When Assigned |
|----------------|---------|---------------|
| `CLEARED` | Standard CDD complete; no concerns | KYC risk LOW or MEDIUM with no unresolved flags |
| `ENHANCED_DUE_DILIGENCE` | EDD applied; additional conditions noted | PEP involvement; adverse media; MEDIUM-HIGH risk; complex ownership |
| `DECLINED` | CDD insufficient or client declined to provide required information | UNACCEPTABLE risk rating; confirmed sanctions; client refused documentation |

---

## 8. BCAP Requirements

**BCAP (Bonus Contractual Asset Protection)**

BCAP clearance is required for all DCE client accounts to confirm the client is eligible to receive:
- Trading bonuses or promotional credits
- Contractual asset protection arrangements under SGX/HKEX rules

**BCAP = TRUE:** Client is eligible; no restriction on promotional arrangements.
**BCAP = FALSE:** Client has been assessed as ineligible (e.g. due to risk profile, regulatory restriction, or own-account trading status).

---

## 9. Document Certification Requirements

### Singapore
- Foreign documents must be apostilled or notarised by Singapore Embassy/High Commission
- Translations must be certified by a registered translator
- ACRA documents: must be issued within 3 months of AO submission

### Hong Kong
- Offshore documents: certified by a practicing solicitor or notary public
- Chinese-language documents: certified translation required for non-Chinese-speaking reviewers
- HK Companies Registry documents: must be dated within 3 months

---

## 10. Retention Policy

- KYC/CDD records must be retained for **5 years** after account closure (SGP: MAS Notice 626, Para 9; HKG: AMLO Section 24)
- Screening records: retained for same period
- RM decision records: immutable; must not be altered post-submission
- Brief compilation date, model version, and KB chunk IDs must be recorded (audit trail)
