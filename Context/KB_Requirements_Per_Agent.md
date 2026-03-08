# Knowledge Base Requirements for 5 Sign-Off Chat Agents

> **Date:** 2026-02-23
> **Purpose:** Identify ALL knowledge base documents each agent needs to operate effectively in real-time
> **Reference:** `Context/2026-02-18/NPA_Business_Process_Deep_Knowledge.md` (Golden Truth)

---

## Current KB Coverage Assessment

### What Exists Today
| KB Source | Coverage | Used By |
|-----------|----------|---------|
| `NPA_Business_Process_Deep_Knowledge.md` | Full NPA lifecycle, 5 approval tracks, 7 SOPs, case studies, 140+ term glossary | ALL agents (foundation) |
| `KB_Classification_Criteria.md` | Product classification rules | CLASSIFIER agent |
| `KB_Product_Taxonomy.md` | Product categorization hierarchy | CLASSIFIER, BIZ |
| `KB_Prohibited_Items.md` | Compliance prohibitions | RISK, LCS |
| `NPA_Golden_Template.md` | 339 field definitions | ALL agents |
| `NPA_Filled_Template.md` | Example filled NPA | ALL agents |
| Agent-specific system prompts (5x) | Field ownership, response format, domain guidelines | Per agent |

### What's Missing
The existing KBs provide **process knowledge** (how the NPA works) and **template structure** (what fields exist), but they lack **domain-depth content** — the actual regulatory text, policy documents, calculation methodologies, and real-world examples each agent needs to generate substantive, accurate field values.

---

## Agent 1: AG_NPA_BIZ — Business / Proposing Unit

**Owns:** Section I (Product Specifications), Section VII (Trading Info)
**~66 fields** including business rationale, product classification, revenue projections, customer segments, distribution channels, PAC conditions, SPV details, external parties, trading products

### Required KBs

#### KB-BIZ-01: Product Type Taxonomy & Definitions
- Complete GFM product catalogue (FX, Rates, Credit, Equity, Commodities, Structured)
- Product type definitions with examples (Spot, Forward, Swap, Option — vanilla/exotic, NDF, NDS, IRS, CCS, CDS, CLN, TRS, ELN, Accumulator, TARF, DCI, etc.)
- Product variant classification rules (when is it NTG vs. Variation vs. Existing?)
- Underlying asset classes and their characteristics
- **Source:** GFM Product Catalogue / Treasury Markets reference docs

#### KB-BIZ-02: Revenue Projection Methodology
- Revenue projection templates (Year 1/2/3 gross and net)
- Transfer pricing charge calculation framework
- Break-even analysis methodology
- ROAE sensitivity analysis requirements
- Notional value thresholds: $20M (ROAE required), $50M (VP review), $100M (CFO review)
- Historical revenue performance by product type (benchmarks)
- **Source:** GFM Finance / Business Planning guidelines

#### KB-BIZ-03: Customer Segment & Suitability Rules
- MAS Notice on Fair Dealing — suitability assessment requirements
- Accredited Investor (AI) thresholds: net assets > $2M, income > $300K, financial assets > $1M
- Customer Knowledge Assessment (CKA) requirements for complex/retail products
- Customer segment definitions: Retail, HNW, Accredited, Institutional, Corporate
- Geographic scope restrictions (onshore/offshore, cross-border limitations)
- KYC/AML onboarding requirements per customer type
- **Source:** MAS Notice FAA-N16, MAS Notice SFA 04-N12, MBS Customer Classification Policy

#### KB-BIZ-04: Distribution Channel Framework
- Channel definitions: Direct Sales (RM), Electronic Trading Platform, Private Banking, Treasury Advisory, Institutional Sales, Third-Party Distribution
- Channel eligibility by product type
- Sales suitability requirements per channel
- Marketing plan templates and regulatory constraints
- Staff training requirements for new product distribution
- Sales surveillance obligations
- **Source:** MBS Distribution Policy, MAS Notice on Fair Dealing

#### KB-BIZ-05: PAC (Product Approval Committee) Requirements
- PAC mandate and authority
- Pre-requisites for PAC submission
- PAC conditions tracking procedures
- Standard PAC conditions by product type
- PAC escalation criteria
- **Source:** GFM PAC Charter, PAC Minutes templates

#### KB-BIZ-06: SPV / SPE Considerations
- When SPV involvement is required
- SPV structuring considerations (arranger role, country of incorporation)
- Regulatory implications of SPV usage
- Tax implications of SPV structures
- **Source:** MBS Structured Finance Policy, Legal advisory guidelines

#### KB-BIZ-07: Historical NPA Examples — Business Sections
- 5-10 completed NPAs with well-written Section I and Section VII content
- Covering different product types (FX, Rates, Credit, Equity, Structured)
- Showing business rationale, value proposition, revenue projection patterns
- **Source:** NPA Archive (anonymized if needed)

---

## Agent 2: AG_NPA_TECH_OPS — Technology & Operations + ISS

**Owns:** Section II (Operational & Technology Assessment)
**~64 fields** including operating model, booking process, service platforms, info security, technology resiliency, BCM

### Required KBs

#### KB-TECH-01: System Architecture & Platform Matrix
- GFM system landscape: Murex, Mini, FA, Calypso, Summit, MarkitWire, Bloomberg TOMS
- System capabilities by product type (what each platform supports)
- Trade lifecycle flow: Capture → Booking → Confirmation → Settlement → Reporting
- System integration points and data flows between platforms
- STP (Straight-Through Processing) architecture and rate benchmarks
- **Source:** GFM Technology Architecture docs, System Capability Matrix

#### KB-TECH-02: Booking Model & Operating Model Templates
- Front Office operating model patterns (electronic, voice, hybrid)
- Middle Office processing models
- Back Office settlement models
- Booking entity selection criteria
- Nostro account requirements by currency/product
- Collateral management operating procedures
- Custody account requirements
- **Source:** GFM Operations Standards, Booking Model Reference

#### KB-TECH-03: UAT Framework & Testing Standards
- UAT scope definition templates
- Test case design patterns for new products
- UAT success criteria and sign-off requirements
- Defect severity classification
- Go/No-Go decision framework
- Regression testing requirements
- **Source:** GFM QA Standards, UAT Playbook

#### KB-TECH-04: Information Security Requirements
- Data classification framework (Restricted, Confidential, Internal, Public)
- Security assessment requirements for new products
- Third-party risk assessment for platform integrations
- Encryption and data-at-rest/in-transit requirements
- Access control requirements
- **Source:** MBS ISS Policy, ISO 27001 controls mapping

#### KB-TECH-05: Business Continuity & Disaster Recovery
- Business Impact Analysis (BIA) template
- BCP documentation requirements
- RTO (Recovery Time Objective) targets by system tier
- RPO (Recovery Point Objective) targets
- DR testing requirements and frequency
- Manual fallback procedures documentation standards
- Crisis communication procedures
- **Source:** MBS BCP Policy, GFM DR Runbooks

#### KB-TECH-06: Trade Repository & Regulatory Reporting
- Trade reporting obligations (MAS, CFTC, EMIR, ASIC)
- Unique Product Identifier (UPI) / LEI requirements
- SFEMC (Singapore Foreign Exchange Market Committee) compliance
- Regulatory reporting system flows
- **Source:** MAS Notice on Reporting of Derivatives, SFEMC Guidelines

#### KB-TECH-07: Operational Adequacy Checklists
- Standard operational adequacy checklist (7-point framework)
- Operating account controls requirements
- Limit monitoring system requirements
- Manual fallback documentation requirements
- **Source:** GFM Ops Standards, Operational Risk Framework

---

## Agent 3: AG_NPA_FINANCE — Group Finance / GPC

**Owns:** Section III (Pricing & Valuation), Section V (Data Management)
**~32 fields** including pricing methodology, model validation, SIMM, data management, RDAR

### Required KBs

#### KB-FIN-01: Pricing Model Validation Framework
- Model validation governance framework
- Model risk classification (Tier 1/2/3)
- Validation methodology by model type (Black-Scholes, Monte Carlo, Binomial, Local Vol, Stochastic Vol)
- Validation frequency requirements
- Model change management procedures
- Independent Price Verification (IPV) requirements
- **Source:** MBS Model Risk Management Policy, MAS Notice 637 (Capital Adequacy)

#### KB-FIN-02: Valuation Adjustment Framework
- FVA (Funding Valuation Adjustment) methodology
- XVA treatment: CVA, DVA, KVA, MVA
- Day count conventions by product type
- Mark-to-market vs. mark-to-model policies
- Fair value hierarchy (Level 1/2/3)
- Valuation uncertainty and reserving policy
- **Source:** IFRS 13 Fair Value Measurement, MBS Valuation Policy

#### KB-FIN-03: Capital & ROAE Methodology
- Capital consumption calculation (Standardized Approach vs. IMA)
- ROAE calculation methodology with worked examples
- Capital allocation by product type
- Economic capital vs. regulatory capital
- Notional-to-capital conversion factors
- **Source:** MBS Capital Management Policy, Basel III framework

#### KB-FIN-04: SIMM & Margin Requirements
- ISDA SIMM methodology overview
- SIMM sensitivity calculation (IR, FX, EQ, Commodity, Credit)
- Backtesting requirements
- Initial Margin thresholds and exchange
- Variation Margin procedures
- **Source:** ISDA SIMM Methodology document, Margin Reform Policy

#### KB-FIN-05: Data Management — D4D & PURE Principles
- Design for Data (D4D) requirements for new products
- PURE principles: Purpose, Useful, Reliable, Efficient
- Data lineage documentation requirements
- Data classification for financial data
- Data quality metrics and monitoring
- Risk Data Aggregation (RDAR) requirements per BCBS 239
- **Source:** MBS Data Governance Policy, BCBS 239 Principles

#### KB-FIN-06: Tax & Transfer Pricing
- Withholding tax obligations by jurisdiction
- GST/VAT implications for financial products
- Transfer pricing documentation requirements
- IFRS/MAS/regulatory accounting matching rules
- Tax clearance procedures for new products
- **Source:** MBS Tax Policy, Transfer Pricing Guidelines

#### KB-FIN-07: Historical NPA Examples — Finance Sections
- 5-10 completed NPAs with well-written Section III and Section V content
- Showing pricing methodology descriptions, SIMM assessments, data management plans
- **Source:** NPA Archive (anonymized)

---

## Agent 4: AG_NPA_RMG — Risk Management Group

**Owns:** Section IV (Risk Analysis), Section VI (Other Risks)
**~85 fields** including legal/compliance risk, finance/tax risk, financial crimes, funding/liquidity, market risk, credit risk, reputational risk

### Required KBs

#### KB-RMG-01: Market Risk Assessment Framework
- Risk factor identification (IR Delta/Vega, FX Delta/Vega, EQ Delta/Vega, Commodity)
- VaR methodology: Historical Simulation, Monte Carlo, Parametric
- Confidence level and holding period standards
- Stress testing scenario library (historical + hypothetical)
- Sensitivity analysis requirements
- P&L attribution methodology
- Market risk limit framework
- **Source:** MBS Market Risk Policy, MAS Notice 637 (Market Risk)

#### KB-RMG-02: Credit Risk Assessment Framework
- Counterparty credit risk assessment methodology
- PCE (Pre-settlement Credit Exposure) calculation
- SACCR (Standardized Approach Counterparty Credit Risk) implementation
- Wrong-way risk identification and assessment
- Netting agreement assessment (ISDA, GMRA)
- CSA (Credit Support Annex) terms and assessment
- CVA/DVA computation methodology
- Country risk assessment and limits
- Concentration risk assessment
- Credit risk mitigation techniques
- **Source:** MBS Credit Risk Policy, MAS Notice 637 (Credit Risk), Basel III SACCR framework

#### KB-RMG-03: Liquidity & Funding Risk Framework
- LCR (Liquidity Coverage Ratio) impact assessment methodology
- NSFR (Net Stable Funding Ratio) impact assessment
- HQLA (High-Quality Liquid Assets) classification criteria
- Cashflow modeling requirements
- Liquidity stress testing framework
- EAFL (Earnings at Risk from Liquidity) methodology
- Funding cost assessment
- Liquidity facility requirements
- **Source:** MBS Liquidity Risk Policy, MAS Notice 649 (Liquidity Coverage Ratio)

#### KB-RMG-04: Operational & Reputational Risk Framework
- Operational risk identification taxonomy
- Key Risk Indicators (KRIs) for new products
- Reputational risk assessment methodology
- ESG risk classification (Green/Amber/Red)
- Step-in risk assessment
- Country risk and regulatory exposure assessment
- Emerging risk identification
- **Source:** MBS Operational Risk Policy, ESG Risk Framework

#### KB-RMG-05: Financial Crimes & Financial Security
- AML/CFT risk assessment framework
- Market Abuse Regulation (MAR) assessment methodology
- MRA (Market Manipulation Risk Assessment) boundary test
- Sanctions screening procedures
- Financial crime red flag indicators by product type
- Conduct risk considerations
- **Source:** MBS AML/CFT Policy, MAS Notice 626 (AML/CFT)

#### KB-RMG-06: Regulatory Capital Framework
- Standardized Approach capital calculation
- Internal Models Approach overview
- Capital requirement by risk type (market, credit, operational)
- Capital add-ons and Pillar 2 requirements
- RWA (Risk-Weighted Assets) calculation
- **Source:** MAS Notice 637 (Capital Adequacy), Basel III framework

#### KB-RMG-07: Legal & Compliance Risk (Section IV.A.1)
- Regulatory licensing requirements by product type and jurisdiction
- MAS Act references (Securities and Futures Act, Financial Advisers Act)
- Banking Act implications
- Conduct-of-business rules
- Customer protection obligations
- **Source:** MAS Act, SFA, FAA, Banking Act

#### KB-RMG-08: Risk Scenario Library
- 20-30 pre-defined stress scenarios (historical + hypothetical)
- Product-specific risk factors and sensitivities
- Hedging strategy templates
- Risk appetite articulation per product class
- **Source:** MBS Stress Testing Framework, Historical Market Events Database

#### KB-RMG-09: Historical NPA Examples — Risk Sections
- 5-10 completed NPAs with well-written Section IV and Section VI content
- Showing market risk assessment, credit risk analysis, stress testing narratives
- **Source:** NPA Archive (anonymized)

---

## Agent 5: AG_NPA_LCS — Legal, Compliance & Secretariat

**Owns:** Appendix 1-6 (Entity/Booking, IP, Financial Crime, RDAR, Trading Products, Third-Party Platforms)
**~94 fields** across 6 appendices covering legal entities, IP rights, financial crime, data management, trading product details, and third-party platform assessments

### Required KBs

#### KB-LCS-01: Legal Documentation Framework
- ISDA Master Agreement overview and key provisions
- CSA (Credit Support Annex) terms and conditions
- GMRA (Global Master Repurchase Agreement) framework
- NAFMII (China interbank market) documentation
- Legal opinion requirements by jurisdiction
- Netting enforceability by jurisdiction
- **Source:** ISDA documentation library, MBS Legal Advisory

#### KB-LCS-02: Regulatory Compliance Matrix
- MAS regulatory requirements by product type
- Licensing requirements: CMS License, RMO, ATS
- Securities and Futures Act (SFA) implications
- Financial Advisers Act (FAA) implications
- Banking Act Section 47 confidentiality requirements
- Cross-border regulatory requirements (CFTC, FCA, HKMA)
- Regulatory change management procedures
- **Source:** MAS Regulatory Framework, MBS Compliance Manual

#### KB-LCS-03: AML/CFT & Financial Crime Framework
- AML risk assessment methodology for new products
- CFT (Counter-Financing of Terrorism) screening requirements
- Sanctions screening procedures (OFAC, UN, EU)
- STR (Suspicious Transaction Reporting) obligations
- Customer Due Diligence (CDD) enhanced requirements
- Bribery and corruption risk assessment
- Fraud risk indicators
- Conduct risk assessment framework
- **Source:** MAS Notice 626, MBS AML/CFT Policy, FATF Recommendations

#### KB-LCS-04: Entity & Booking Structure Guidelines
- MBS entity structure and legal hierarchy
- Booking entity selection criteria
- Cross-border booking rules and restrictions
- Branch vs. subsidiary considerations
- Legal entity risk assessment
- **Source:** MBS Entity Structure Manual, Legal Entity Governance Framework

#### KB-LCS-05: IP & Data Privacy Framework
- Intellectual property considerations for financial products
- PDPA (Personal Data Protection Act) compliance
- Cross-border data transfer restrictions
- Data residency requirements by jurisdiction
- Third-party IP license management
- **Source:** PDPA, MBS Data Protection Policy

#### KB-LCS-06: Third-Party Platform Assessment
- Third-party risk assessment methodology
- Information security assessment for platforms
- SOC 2, ISO 27001 certification requirements
- Cybersecurity assessment checklist
- Data privacy impact assessment for third-party platforms
- Vendor due diligence requirements
- Service Level Agreement (SLA) standards
- **Source:** MBS Third-Party Risk Management Policy, NIST Cybersecurity Framework

#### KB-LCS-07: Compliance Checklist Templates
- Pre-trade compliance checks
- Post-trade monitoring requirements
- Regulatory reporting obligations per product
- Record-keeping requirements (retention periods by regulation)
- Training and competency requirements
- Annual review and attestation obligations
- **Source:** MBS Compliance Standards, MAS Guidelines

#### KB-LCS-08: Historical NPA Examples — Appendix Sections
- 5-10 completed NPAs with well-written Appendix 1-6 content
- Showing entity selection rationale, financial crime assessments, platform evaluations
- **Source:** NPA Archive (anonymized)

---

## Shared KB (All 5 Agents)

#### KB-SHARED-01: NPA Business Process Deep Knowledge
- **Already exists:** `Context/2026-02-18/NPA_Business_Process_Deep_Knowledge.md`
- Full NPA lifecycle, approval tracks, sign-off party roles
- Should be uploaded to ALL 5 Dify apps as shared KB

#### KB-SHARED-02: NPA Golden Template (339 Fields)
- **Already exists:** `Context/NPA_Golden_Sources/NPA_Golden_Template.md`
- Complete field registry with types, strategies, dependencies
- Should be uploaded to ALL 5 Dify apps as shared KB

#### KB-SHARED-03: NPA Filled Example
- **Already exists:** `Context/NPA_Golden_Sources/NPA_Filled_Template.md`
- Example filled NPA showing expected content quality
- Should be uploaded to ALL 5 Dify apps as shared KB

#### KB-SHARED-04: MBS GFM Glossary
- **Partially exists** in Deep Knowledge doc (140+ terms)
- Expand with additional terms from each domain
- Should be uploaded to ALL 5 Dify apps as shared KB

---

## Summary: KB Count per Agent

| Agent | Existing KBs | New KBs Needed | Priority |
|-------|-------------|---------------|----------|
| **AG_NPA_BIZ** | 3 shared | 7 new | P1 — Most user-facing |
| **AG_NPA_TECH_OPS** | 3 shared | 7 new | P2 — Technical depth needed |
| **AG_NPA_FINANCE** | 3 shared | 7 new | P1 — Capital/pricing critical |
| **AG_NPA_RMG** | 3 shared | 9 new | P0 — Most complex, most fields |
| **AG_NPA_LCS** | 3 shared | 8 new | P1 — Regulatory compliance critical |
| **Total** | 3-4 shared | **38 unique KBs** | |

## Implementation Priority

### Phase 1 (Immediate — enables auto-fill quality)
1. Upload existing shared KBs to all 5 Dify apps
2. KB-BIZ-07, KB-FIN-07, KB-RMG-09, KB-LCS-08 (Historical NPA examples — biggest impact on auto-fill quality)
3. KB-RMG-01, KB-RMG-02 (Market & Credit Risk — largest section by field count)

### Phase 2 (Short-term — domain accuracy)
4. KB-BIZ-01, KB-BIZ-02, KB-BIZ-03 (Product types, revenue, customer rules)
5. KB-FIN-01, KB-FIN-02 (Pricing model validation, valuation adjustments)
6. KB-LCS-02, KB-LCS-03 (Regulatory compliance, AML/CFT)
7. KB-TECH-01, KB-TECH-02 (System architecture, booking models)

### Phase 3 (Medium-term — completeness)
8. All remaining KBs

---

## Dify Upload Instructions

For each KB document:
1. Go to Dify Cloud → Knowledge → Create New Dataset
2. Upload the markdown file
3. Set chunking strategy: **Paragraph-based** (not fixed-size)
4. Enable embedding (uses Dify's built-in embeddings)
5. In the Chatflow app configuration → Context → Add the KB dataset
6. Publish the updated app

**Note:** Each Dify Chatflow app can reference multiple KB datasets. Add shared KBs to all 5 apps, and domain-specific KBs to their respective agent apps.

---

*This document is a living reference. Update as KBs are created and uploaded.*
