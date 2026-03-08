# Knowledge Base: NPA Template AutoFill Agent ("The Time Machine")

**Updated: 2026-02-20 | Cross-verified against NPA_Business_Process_Deep_Knowledge.md (v2.0)**
**Version: 3.0 -- Comprehensive DB Template Alignment (STD_NPA_V2 + FULL_NPA_V1)**
**Aligned with: WF_NPA_Autofill_Prompt.md v2.0, Architecture Gap Register (R01-R44)**

---

## 1. System Identity & Prime Directive

**Agent Name**: NPA Template AutoFill Agent ("The Time Machine")
**Role**: Auto-populate NPA template fields by intelligently copying and adapting content from similar approved NPAs, reducing manual drafting from 60-90 minutes to 15-20 minutes.
**Primary Goal**: Produce the MOST COMPREHENSIVE AND DETAILED NPA drafts possible across ALL fields from BOTH DB templates (STD_NPA_V2 and FULL_NPA_V1), maximizing auto-fill coverage while maintaining accuracy and traceability.

**Prime Directive**:
**Suggest, Don't Hallucinate** -- Maximize auto-fill coverage (>=78%) while maintaining accuracy (>=92% user acceptance rate). NEVER auto-fill fields with uncertain information; flag for manual input instead.

**Critical Design Philosophy**:
- **Comprehensiveness First**: Fill EVERY field that can be derived from historical NPAs, classification data, or business rules. Leave no field unnecessarily blank.
- **Three-Bucket Lineage**: Every field tagged as AUTO (direct copy), ADAPTED (intelligently modified), or MANUAL (requires human input). No ambiguity.
- **Color-Coded Transparency**: GREEN = auto-filled with high confidence; YELLOW = adapted or needing verification; RED = manual input required.
- **Regulatory Freshness**: Auto-detect and replace deprecated references (LIBOR->SOFR, Basel II->Basel III, EMIR->EMIR Refit).
- **Audit Trail**: Every field carries source_npa_id, confidence score, adaptation technique used, and timestamp.

**Success Metrics**:
- Auto-fill coverage: >=78% (Full NPA), >=85% (NPA Lite), >=70% (Bundling)
- User acceptance rate: >=92% (users accept without changes)
- Time savings: >=70% (60-90 min -> 15-20 min)
- First-time approval rate: >=70% (vs 52% baseline)
- Override rate: <15% (fields changed by user after auto-fill)

**Analogy**: This agent is like an experienced NPA Champion who has seen 1,784+ historical NPAs and can draft 78% of any new NPA from memory, adapting prior work intelligently while flagging the 22% that requires fresh human judgment.

---

## 1A. NPA Document Structure Reference (Official-to-DB Template Mapping)

The NPA document follows the **RMG OR Version Jun 2025** standardized template with **47 official base fields** across Part A/B/C structure. These map to TWO operational database templates with expanded granularity.

### Official 47-Field Structure (Part A/B/C)

```
PART A: Basic Product Information (6 fields)
  - Product/Service Name, Business Units Covered
  - Product Manager & Group Head details
  - Business Case Approval Status (PAC for NTG)
  - NPA or NPA Lite classification
  - Kick-off Meeting Date

PART B: Sign-Off Parties (dynamic)
  - All required SOPs listed per approval track
  - Each SOP's sign-off status tracked

PART C: Detailed Product Information (Sections I-VII + Appendices I-VII)
  Section I:   Product Specifications
  Section II:  Operational & Technology Information
  Section III: Pricing Model Details
  Section IV:  Risk Analysis (A: Operational, B: Market/Liquidity, C: Credit, D: Reputational)
  Section V:   Data Management
  Section VI:  Other Risk Identification
  Section VII: Trading Products Specific Information
  Appendix I:   Bundling Approval Form (8-condition checklist)
  Appendix II:  Entity/Location Information
  Appendix III: ROAE Sensitivity Analysis (mandatory if notional >$20M)
  Appendix IV:  Intellectual Property
  Appendix V:   Financial Crime Risk Areas
  Appendix VI:  Risk Data Aggregation and Reporting
  Appendix VII: Evergreen FAQ/Checklist
```

### DB Template Selection Logic

| Approval Track | DB Template | Total Fields | Sections | When Used |
|----------------|-------------|-------------|----------|-----------|
| FULL_NPA (NTG, high-risk Variation) | FULL_NPA_V1 | ~30 base + extended | 8 sections | New-to-Group, expired with variations |
| NPA_LITE / BUNDLING / EVERGREEN | STD_NPA_V2 | ~72 base + extended | 10 sections | Standard products, variations, reactivations |

**Key Insight**: Both templates are populated simultaneously when the product requires Full NPA treatment. STD_NPA_V2 is the "workhorse" template for most products; FULL_NPA_V1 adds NTG-specific sections (basic info, sign-off, customers, commercialization, BCP, financial crime, risk data aggregation, trading products).

### DB Template 1: STD_NPA_V2 (10 Sections, ~72 Fields)

**SEC_PROD -- Product & Business Case (19 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| product_name | Product/Service Name | text | ADAPTED | Y |
| product_type | Product Type (FX/IR/EQ/CR/Commodity) | select | AUTO | Y |
| desk | Proposing Desk | text | AUTO | Y |
| business_unit | Business Unit | text | AUTO | Y |
| notional_amount | Notional Amount (USD) | decimal | MANUAL | Y |
| underlying_asset | Underlying Asset/Reference | text | ADAPTED | Y |
| tenor | Tenor | text | ADAPTED | N |
| trade_date | Expected Trade Date | date | MANUAL | N |
| business_rationale | Business Rationale & Value Proposition | longtext | ADAPTED | Y |
| pac_reference | PAC Reference (NTG only) | text | AUTO/MANUAL | N |
| product_role | Role of PU (Manufacturer/Distributor/Agent) | select | AUTO | N |
| funding_type | Funding Type | select | AUTO | N |
| product_maturity | Product Maturity/Tenor | text | ADAPTED | N |
| product_lifecycle | Product Life Cycle | text | AUTO | N |
| revenue_year1 | Year 1 Revenue Estimate | decimal | ADAPTED | N |
| revenue_year2 | Year 2 Revenue Estimate | decimal | ADAPTED | N |
| revenue_year3 | Year 3 Revenue Estimate | decimal | ADAPTED | N |
| target_roi | Target ROI | text | ADAPTED | N |
| spv_details | Special Purpose Vehicle | text | MANUAL | N |

**SEC_OPS -- Operational & Technology (16 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| booking_system | Booking System (Murex/Calypso/Summit) | select | AUTO | Y |
| valuation_model | Valuation/Pricing Model | text | AUTO | Y |
| settlement_method | Settlement Method & Timeframe | text | AUTO | Y |
| confirmation_process | Confirmation Process | text | AUTO | Y |
| reconciliation | Reconciliation Process | longtext | AUTO | Y |
| tech_requirements | Technology Requirements & UAT | longtext | ADAPTED | N |
| front_office_model | Front Office Operating Model | text | AUTO | N |
| middle_office_model | Middle Office Model | text | AUTO | N |
| back_office_model | Back Office Model | text | AUTO | N |
| booking_legal_form | Booking Legal Form (ISDA/GMRA/etc) | select | AUTO | N |
| booking_family | Booking Family (IRD/FXD/CRY) | text | AUTO | N |
| booking_typology | Booking Typology/Contract | text | AUTO | N |
| portfolio_allocation | Portfolio Allocation | text | AUTO | N |
| hsm_required | HSM Key Management Required? | select | AUTO | N |
| pentest_status | Penetration Testing Status | select | AUTO | N |
| iss_deviations | ISS Policy Deviations | text | MANUAL | N |

**SEC_PRICE -- Pricing Model (7 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| pricing_methodology | Pricing Methodology & Formula | longtext | AUTO | Y |
| roae_analysis | ROAE Sensitivity Analysis | longtext | ADAPTED | Cond |
| pricing_assumptions | Pricing Assumptions (vol, rates, spreads) | longtext | ADAPTED | Y |
| bespoke_adjustments | Bespoke Pricing Adjustments | text | MANUAL | N |
| pricing_model_name | Model Name & Version | text | AUTO | N |
| model_validation_date | Model Validation Date | date | AUTO | N |
| simm_treatment | SIMM Treatment | text | AUTO | N |

**SEC_RISK -- Risk Assessments (11 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| market_risk | Market Risk Assessment (VaR, Greeks, stress) | longtext | ADAPTED | Y |
| credit_risk | Credit Risk Assessment (counterparty, exposure) | longtext | ADAPTED | Y |
| operational_risk | Operational Risk Assessment | longtext | ADAPTED | Y |
| liquidity_risk | Liquidity Risk (LCR/NSFR/HQLA) | longtext | ADAPTED | Y |
| reputational_risk | Reputational Risk (ESG, step-in) | longtext | ADAPTED | Y |
| var_capture | VaR Capture Method | text | AUTO | N |
| stress_scenarios | Stress Testing Scenarios | text | ADAPTED | N |
| regulatory_capital | Regulatory Capital Treatment | text | AUTO | N |
| counterparty_default | Counterparty Default Risk | text | ADAPTED | N |
| custody_risk | Custody Risk | text | AUTO | N |
| esg_assessment | ESG Risk Assessment | text | ADAPTED | N |

**SEC_DATA -- Data Management (6 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| data_privacy | Data Privacy Requirements | longtext | AUTO | Y |
| data_retention | Data Retention Policy | text | AUTO | Y |
| reporting_requirements | Reporting Requirements (MAS 610/637/645) | longtext | AUTO | Y |
| pure_assessment_id | PURE Assessment ID | text | AUTO | N |
| gdpr_compliance | GDPR Compliance Required? | select | AUTO | N |
| data_ownership | Data Ownership Defined? | select | AUTO | N |

**SEC_REG -- Regulatory Requirements (4 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| primary_regulation | Primary Regulation (MAS/HKMA/FCA/CFTC) | select | AUTO | Y |
| secondary_regulations | Secondary Regulations | text | AUTO | N |
| regulatory_reporting | Regulatory Reporting Obligations | longtext | AUTO | Y |
| sanctions_check | Sanctions Check Result | text | AUTO | Y |

**SEC_ENTITY -- Appendices Entity & IP (5 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| booking_entity | Booking Entity (MBS SG/HK/London/India) | select | AUTO | Y |
| counterparty | Counterparty Legal Name | text | MANUAL | Y |
| counterparty_rating | Counterparty Credit Rating | text | ADAPTED | N |
| strike_price | Strike/Exercise Price | decimal | MANUAL | N |
| ip_considerations | IP Considerations (proprietary models) | longtext | AUTO | N |

**SEC_SIGN -- Sign-Off Matrix (2 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| required_signoffs | Required Sign-Off Parties | json | AUTO | Y |
| signoff_order | Sign-Off Sequence | json | AUTO | Y |

**SEC_LEGAL -- Legal Considerations (3 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| legal_opinion | Legal Opinion (jurisdiction-specific) | longtext | AUTO | Y |
| isda_agreement | ISDA Agreement Status | select | AUTO | N |
| tax_impact | Tax Impact Assessment (WHT, TP, VAT) | longtext | ADAPTED | Y |

**SEC_DOCS -- Supporting Documents (2 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| term_sheet | Term Sheet Reference | text | MANUAL | N |
| supporting_documents | Supporting Documents List | json | AUTO | N |

### DB Template 2: FULL_NPA_V1 (8 Sections, ~30 Fields -- NTG Extensions)

**SEC_BASIC -- Part A: Basic Product Information (9 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| product_manager_name | Product Manager Name & Team | text | AUTO | Y |
| group_product_head | Group Product Head | text | AUTO | Y |
| proposal_preparer | Proposal Preparer/Lead | text | AUTO | Y |
| business_case_status | Business Case Approved? | select | AUTO | Y |
| npa_process_type | NPA/NPA Lite Process? | select | AUTO | Y |
| pac_approval_date | PAC Approval Date | date | MANUAL | Cond |
| kickoff_date | NPA Kick-off Meeting Date | date | MANUAL | Y |
| mtj_journey | MtJ Journey(s) Impacted | text | AUTO | N |
| approving_authority | Approving Authority | text | AUTO | Y |

**SEC_SIGNOFF -- Part B: Sign-off Parties (dynamic)**:
Populated from approval matrix rules. Content mirrors SEC_SIGN but includes NTG-specific head-office assignments.

**SEC_CUST -- Target Customers (4 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| customer_segments | Target Customer Segments | text | ADAPTED | Y |
| customer_restrictions | Regulatory Restrictions (retail/institutional) | text | AUTO | N |
| customer_profile | Target Customer Profile | text | ADAPTED | N |
| geographic_scope | Geographic Focus | text | AUTO | N |

**SEC_COMM -- Commercialization (3 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| distribution_channels | Channel Availability | text | AUTO | Y |
| sales_suitability | Sales Suitability Process | text | AUTO | N |
| marketing_plan | Marketing & Communication | text | MANUAL | N |

**SEC_BCP -- Business Continuity (4 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| rto_hours | Recovery Time Objective (hours) | decimal | AUTO | N |
| rpo_minutes | Recovery Point Objective (minutes) | decimal | AUTO | N |
| bia_completed | BIA Completed? | select | AUTO | N |
| dr_test_frequency | DR Testing Frequency | text | AUTO | N |

**SEC_FINCRIME -- Appendix 3: Financial Crime (5 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| aml_assessment | AML Assessment | text | AUTO | Y |
| terrorism_financing | Terrorism Financing Check | text | AUTO | Y |
| sanctions_assessment | Sanctions Assessment | text | AUTO | Y |
| fraud_risk | Fraud Risk Assessment | text | ADAPTED | Y |
| bribery_corruption | Bribery & Corruption Risk | text | AUTO | Y |

**SEC_RISKDATA -- Appendix 4: Risk Data Aggregation (dynamic)**:
Populated from standard risk aggregation templates. Content aligns with MAS 610/637/645 requirements.

**SEC_TRADING -- Appendix 5: Trading Products (5 fields)**:
| Field Key | Label | Type | Lineage | Req |
|-----------|-------|------|---------|-----|
| collateral_types | Collateral Types | text | AUTO | N |
| valuation_method | Valuation Methodology | text | AUTO | N |
| funding_source | Funding Source | text | AUTO | N |
| hedging_purpose | Hedging Purpose | text | ADAPTED | N |
| booking_schema | Booking Schema (Murex typology + generator) | text | AUTO | N |

### Cross-Template Mapping (Official -> DB)

| Official Section | STD_NPA_V2 Section | FULL_NPA_V1 Section |
|-----------------|-------------------|-------------------|
| Part A: Basic Info | SEC_PROD (partial) | SEC_BASIC (full) |
| Part B: Sign-Off | SEC_SIGN | SEC_SIGNOFF |
| Section I: Product Specs | SEC_PROD | SEC_CUST, SEC_COMM |
| Section II: Ops & Tech | SEC_OPS | SEC_BCP |
| Section III: Pricing | SEC_PRICE | -- |
| Section IV: Risk | SEC_RISK | -- |
| Section V: Data Mgmt | SEC_DATA | SEC_RISKDATA |
| Section VI: Other Risk | SEC_RISK (partial) | -- |
| Section VII: Trading | SEC_ENTITY (partial) | SEC_TRADING |
| Appendix I: Bundling | -- (see Bundling rules) | -- |
| Appendix II: Entity | SEC_ENTITY | -- |
| Appendix III: ROAE | SEC_PRICE (roae_analysis) | -- |
| Appendix V: Fin Crime | -- | SEC_FINCRIME |
| Appendix VII: Evergreen | -- (see Evergreen rules) | -- |
| Legal | SEC_LEGAL | -- |
| Documents | SEC_DOCS | -- |

---

## 2. The Four-Step Auto-Fill Process

### Step 1: Find the Best Historical Match

**Inputs Received**:
```json
{
  "from_ideation_agent": {
    "product_description": "FX Forward on GBP/USD, 3M tenor, $50M notional",
    "extracted_params": {
      "product_type": "FX Forward",
      "underlying": "GBP/USD",
      "tenor": "3M",
      "notional": 50000000,
      "counterparty_rating": "A-",
      "booking_location": "Singapore",
      "counterparty_location": "Hong Kong"
    }
  },
  "from_kb_search": {
    "top_5_matches": [
      {
        "npa_id": "TSG1917",
        "similarity_score": 0.94,
        "product_name": "FX Forward EUR/USD 3M",
        "approval_outcome": "Approved",
        "approval_timeline_days": 3.2,
        "loop_backs": 0,
        "approval_date": "2024-12-15"
      }
    ]
  },
  "from_classification": {
    "classification": "Existing",
    "approval_track": "NPA Lite",
    "confidence": 0.96
  },
  "from_risk_agent": {
    "cross_border_flag": true,
    "bundling_flag": false,
    "prohibited": false
  }
}
```

**Selection Logic (Multi-Criteria Decision)**:

```
# PRIMARY: Semantic Similarity
candidates = filter(top_5_matches, similarity_score >= 0.85)

# SECONDARY: Approval Outcome
approved = filter(candidates, approval_outcome == "Approved")
if len(approved) > 0:
  candidates = approved

# TERTIARY: Quality (Zero Loop-backs preferred)
zero_loopbacks = filter(candidates, loop_backs == 0)
if len(zero_loopbacks) > 0:
  candidates = zero_loopbacks

# QUATERNARY: Recency (within 2 years)
recent = filter(candidates, approval_date >= (today - 730 days))
if len(recent) > 0:
  candidates = recent

# TIE-BREAKER: Fastest Approval
best_match = min(candidates, key=lambda x: x.approval_timeline_days)
```

**Edge Case Handling**:

**Case 1: New-to-Group (No Match)**
```
if classification == "NTG" AND max(similarity_scores) < 0.50:
  best_match = load_generic_template(product_type)
  auto_fill_coverage = 45%
  message = "NTG product. Coverage 45% (structural fields only). More manual input required."
  # Still populate: booking system, valuation model, settlement, regulatory, sign-off baseline
```

**Case 2: Multiple Equal Matches (all 90%+)**
```
if count(similarity >= 0.90) > 1:
  best_match = min(candidates, key=lambda x: x.approval_timeline_days)
  reasoning = f"Selected {best_match.npa_id} (fastest approval: {best_match.approval_timeline_days} days)"
```

**Case 3: Best Match Has Red Flags**
```
if best_match.loop_backs > 0:
  next_best = candidates[1]
  if next_best.loop_backs == 0 AND (best_match.similarity - next_best.similarity) < 0.05:
    best_match = next_best
    reasoning = "Selected 2nd-best to avoid copying problematic content (source had loop-backs)"
```

**Case 4: Stale Source (>2 years old)**
```
if (today - best_match.approval_date).days > 730:
  warning = "Source NPA >2 years old. Regulatory references may be outdated."
  trigger_regulatory_freshness_check = True
```

---

### Step 2: Categorize Fields into Three Buckets

Every field from both DB templates is categorized into one of three lineage buckets. This categorization determines how the field is populated and what color it receives in the UI.

**Bucket Definitions**:
- **AUTO (Direct Copy)**: Field value identical across similar products. Copy verbatim from source NPA. Color: GREEN.
- **ADAPTED (Intelligent Modification)**: Field requires smart rewriting based on new parameters (different notional, counterparty, jurisdiction). Color: YELLOW.
- **MANUAL (Human Required)**: Field is deal-specific, judgment-based, or has no reliable source. Color: RED.

**Coverage Targets by Template**:

| Template | AUTO | ADAPTED | MANUAL | Total Coverage |
|----------|------|---------|--------|---------------|
| STD_NPA_V2 (NPA Lite) | 45 fields (63%) | 16 fields (22%) | 11 fields (15%) | 85% |
| FULL_NPA_V1 (Full NPA) | 18 fields (60%) | 6 fields (20%) | 6 fields (20%) | 80% |
| Combined (both templates active) | 63 fields (62%) | 22 fields (22%) | 17 fields (16%) | 84% |

---

### Step 3: Quality Assurance (5 Checks)

Run BEFORE presenting to user. See Section 10 for full QA details.

1. **Internal Consistency** -- Cross-field contradiction detection
2. **Regulatory Freshness** -- Deprecated reference replacement
3. **Completeness** -- All mandatory fields filled or flagged
4. **Cross-Border Override** -- 5 mandatory sign-offs enforced
5. **Notional Thresholds** -- ROAE / Finance VP / CFO escalation

---

### Step 4: Present to User with Guided Steps

```json
{
  "auto_filled_template": { "SEC_PROD": {...}, "SEC_OPS": {...}, ... },
  "field_colors": {
    "product_name": "yellow",
    "booking_system": "green",
    "counterparty": "red"
  },
  "section_completion": {
    "SEC_PROD": "84%",
    "SEC_OPS": "94%",
    "SEC_PRICE": "71%",
    "SEC_RISK": "82%",
    "SEC_DATA": "100%",
    "SEC_REG": "100%",
    "SEC_ENTITY": "60%",
    "SEC_SIGN": "100%",
    "SEC_LEGAL": "67%",
    "SEC_DOCS": "50%"
  },
  "overall_coverage": 78,
  "source_npa": "TSG1917",
  "notifications": [
    "Cross-border detected: 5 mandatory sign-offs added",
    "Notional $50M: Finance VP added to sign-off matrix",
    "ROAE analysis template inserted (notional >$20M)"
  ],
  "guided_steps": [
    {"step": 1, "title": "Review Auto-Filled", "time_min": 5, "field_count": 63},
    {"step": 2, "title": "Verify Adapted Fields", "time_min": 5, "field_count": 22},
    {"step": 3, "title": "Fill Manual Fields", "time_min": 10, "field_count": 17},
    {"step": 4, "title": "Submit for Checker Review", "time_min": 1, "action": "submit"}
  ],
  "time_saved_minutes": 70,
  "template_id": "STD_NPA_V2"
}
```

---

## 3. COMPREHENSIVE FIELD CATALOG (All Fields, Both Templates)

### 3.1 AUTO Fields -- Direct Copy (GREEN)

These fields are product-type-specific (not deal-specific) and can be copied verbatim from the best-match historical NPA.

**STD_NPA_V2 AUTO Fields (45 fields)**:

| Section | Field Key | Justification |
|---------|-----------|---------------|
| SEC_PROD | product_type | Product type is determined by classification |
| SEC_PROD | desk | Current user's desk from profile |
| SEC_PROD | business_unit | Current user's BU from profile |
| SEC_PROD | pac_reference | System-generated or from PAC records |
| SEC_PROD | product_role | Standard role by product type (manufacturer/distributor) |
| SEC_PROD | funding_type | Standard by product type (self-funded/external) |
| SEC_PROD | product_lifecycle | Standard lifecycle by product category |
| SEC_OPS | booking_system | System is product-specific (FX->Murex, FI->Summit) |
| SEC_OPS | valuation_model | Model is product-specific (Options->Black-Scholes) |
| SEC_OPS | settlement_method | Convention is product-specific (FX->T+2 CLS) |
| SEC_OPS | confirmation_process | Process is product-specific (FX->SWIFT MT300) |
| SEC_OPS | reconciliation | Standard reconciliation per product type |
| SEC_OPS | front_office_model | Standard FO model by desk/product |
| SEC_OPS | middle_office_model | Standard MO model by desk |
| SEC_OPS | back_office_model | Standard BO model by desk |
| SEC_OPS | booking_legal_form | Standard by product (Derivatives->ISDA, Repo->GMRA) |
| SEC_OPS | booking_family | Standard by product (FX->FXD, Rates->IRD) |
| SEC_OPS | booking_typology | Standard Murex typology by product |
| SEC_OPS | portfolio_allocation | Standard portfolio by desk/product |
| SEC_OPS | hsm_required | Standard by product risk profile |
| SEC_OPS | pentest_status | Copy from similar NPA |
| SEC_PRICE | pricing_methodology | Approach is product-specific (mid-market + bid-offer) |
| SEC_PRICE | pricing_model_name | Model name by product type |
| SEC_PRICE | model_validation_date | Copy most recent validation date |
| SEC_PRICE | simm_treatment | Standard SIMM treatment by product |
| SEC_DATA | data_privacy | Standard privacy template by jurisdiction |
| SEC_DATA | data_retention | Standard retention policy (7 years) |
| SEC_DATA | reporting_requirements | MAS 610/637/645 per product and location |
| SEC_DATA | pure_assessment_id | Auto-generated or copied |
| SEC_DATA | gdpr_compliance | Based on counterparty jurisdiction (EU->Yes) |
| SEC_DATA | data_ownership | Standard: Yes (GFM Data Steward) |
| SEC_REG | primary_regulation | Location->regulation mapping (SG->MAS, HK->HKMA) |
| SEC_REG | secondary_regulations | Additional regulations per product type |
| SEC_REG | regulatory_reporting | Standard reporting per product/location |
| SEC_REG | sanctions_check | From Risk Agent output (PASS/FAIL) |
| SEC_ENTITY | booking_entity | User location -> default entity (SG->MBS Bank Ltd) |
| SEC_ENTITY | ip_considerations | Standard IP template by product type |
| SEC_SIGN | required_signoffs | Computed from approval track + overrides |
| SEC_SIGN | signoff_order | Standard sequence by track |
| SEC_LEGAL | legal_opinion | Standard by jurisdiction (SG->Singapore law) |
| SEC_LEGAL | isda_agreement | Standard by product (Derivatives->ISDA Master) |
| SEC_RISK | var_capture | Standard VaR method by product type |
| SEC_RISK | regulatory_capital | Standard capital treatment (Basel III) |
| SEC_RISK | custody_risk | Standard custody framework by product |
| SEC_DOCS | supporting_documents | Standard document list by product type |

**FULL_NPA_V1 AUTO Fields (18 fields)**:

| Section | Field Key | Justification |
|---------|-----------|---------------|
| SEC_BASIC | product_manager_name | From user profile / org hierarchy |
| SEC_BASIC | group_product_head | From org hierarchy lookup |
| SEC_BASIC | proposal_preparer | Current logged-in user |
| SEC_BASIC | business_case_status | From PAC system or classification |
| SEC_BASIC | npa_process_type | From classification agent output |
| SEC_BASIC | mtj_journey | From product type mapping |
| SEC_BASIC | approving_authority | GFM COO (standard for GFM products) |
| SEC_CUST | customer_restrictions | Standard restrictions by product/jurisdiction |
| SEC_CUST | geographic_scope | From booking + counterparty locations |
| SEC_COMM | distribution_channels | Standard channels by product type |
| SEC_COMM | sales_suitability | Standard suitability process |
| SEC_BCP | rto_hours | Standard RTO by product criticality (typically 4hrs) |
| SEC_BCP | rpo_minutes | Standard RPO by product (typically 15min) |
| SEC_BCP | bia_completed | Yes (mandatory prerequisite for NPA) |
| SEC_BCP | dr_test_frequency | Standard (annually or semi-annually) |
| SEC_FINCRIME | aml_assessment | Standard AML template by customer type |
| SEC_FINCRIME | terrorism_financing | Standard terrorism financing check |
| SEC_FINCRIME | bribery_corruption | Standard bribery/corruption assessment |
| SEC_FINCRIME | sanctions_assessment | From Risk Agent (mirrors sanctions_check) |
| SEC_TRADING | collateral_types | Standard collateral per product (CSA terms) |
| SEC_TRADING | valuation_method | Standard valuation by product type |
| SEC_TRADING | funding_source | Standard funding (MBS Treasury/Client Collateral) |
| SEC_TRADING | booking_schema | Murex typology + generator from similar NPA |

---

### 3.2 ADAPTED Fields -- Intelligent Modification (YELLOW)

These fields require smart rewriting based on the new product's specific parameters. Each uses one of the 5 Adaptation Techniques (see Section 4).

**STD_NPA_V2 ADAPTED Fields (16 fields)**:

| Section | Field Key | Adaptation Technique | Logic |
|---------|-----------|---------------------|-------|
| SEC_PROD | product_name | Entity Replacement | Replace underlying, tenor, structure name |
| SEC_PROD | underlying_asset | Entity Replacement | Swap old underlying for new |
| SEC_PROD | tenor | Entity Replacement | Replace tenor reference |
| SEC_PROD | business_rationale | Entity Replacement | Replace counterparty, notional, tenor, use case |
| SEC_PROD | product_maturity | Entity Replacement | Match new tenor |
| SEC_PROD | revenue_year1 | Numerical Scaling | Scale proportionally to notional ratio |
| SEC_PROD | revenue_year2 | Numerical Scaling | Scale proportionally |
| SEC_PROD | revenue_year3 | Numerical Scaling | Scale proportionally |
| SEC_PROD | target_roi | Qualitative Adjustment | Adjust based on risk profile change |
| SEC_PRICE | roae_analysis | Threshold-Triggered Insertion | Insert if notional >$20M; stress +-50/100/200 bps |
| SEC_PRICE | pricing_assumptions | Entity Replacement | Update market data references |
| SEC_RISK | market_risk | Numerical Scaling + Rating Adjustment | VaR scales with notional; rating from book % thresholds |
| SEC_RISK | credit_risk | Entity Replacement + Lookup | Swap rating, recalculate expected loss, adjust collateral |
| SEC_RISK | operational_risk | Conditional Expansion | Cross-border -> add reconciliation/TP paragraphs |
| SEC_RISK | liquidity_risk | Qualitative Adjustment | Adjust based on tenor and market depth |
| SEC_RISK | reputational_risk | Conditional Expansion | Add ESG paragraphs if sustainability features |
| SEC_RISK | stress_scenarios | Numerical Scaling | Scale stress amounts proportionally |
| SEC_RISK | counterparty_default | Entity Replacement | Swap counterparty rating, recalculate PD/LGD |
| SEC_RISK | esg_assessment | Conditional Expansion | Expand if sustainability variation |
| SEC_ENTITY | counterparty_rating | Lookup | New rating from input parameters |
| SEC_LEGAL | tax_impact | Conditional Expansion | Cross-border -> add WHT/TP/VAT sections |
| SEC_OPS | tech_requirements | Conditional Expansion | Cross-border -> add inter-company reconciliation |

**FULL_NPA_V1 ADAPTED Fields (6 fields)**:

| Section | Field Key | Adaptation Technique | Logic |
|---------|-----------|---------------------|-------|
| SEC_CUST | customer_segments | Entity Replacement | Match target segment from ideation |
| SEC_CUST | customer_profile | Entity Replacement | Adapt profile description |
| SEC_FINCRIME | fraud_risk | Qualitative Adjustment | Adjust risk level based on product complexity |
| SEC_TRADING | hedging_purpose | Entity Replacement | Replace hedge rationale from ideation |

---

### 3.3 MANUAL Fields -- Human Input Required (RED)

These fields are deal-specific, judgment-based, or have no reliable automated source. Each includes a user-facing prompt to guide input.

**STD_NPA_V2 MANUAL Fields (11 fields)**:

| Section | Field Key | Why Manual | User Prompt |
|---------|-----------|------------|-------------|
| SEC_PROD | notional_amount | Deal-specific amount | "Enter notional amount in USD (e.g., 50000000)" |
| SEC_PROD | trade_date | Future event, not yet determined | "Enter expected trade date or 'TBD'" |
| SEC_PROD | spv_details | Bespoke structure | "Describe SPV if applicable (else leave blank)" |
| SEC_PRICE | bespoke_adjustments | Deal-specific pricing deviations | "Enter pricing deviations from standard (if any)" |
| SEC_ENTITY | counterparty | Deal-specific entity | "Enter counterparty legal name (must match CRM)" |
| SEC_ENTITY | strike_price | Deal-specific price level | "Enter strike/exercise price (if applicable)" |
| SEC_OPS | iss_deviations | Unit-specific policy exceptions | "List ISS policy deviations (if any)" |
| SEC_DOCS | term_sheet | Document not yet created | "Attach term sheet reference when available" |
| SEC_COMM | marketing_plan | Requires business judgment | "Describe marketing and communication plan" |

**FULL_NPA_V1 MANUAL Fields (6 fields)**:

| Section | Field Key | Why Manual | User Prompt |
|---------|-----------|------------|-------------|
| SEC_BASIC | pac_approval_date | Must come from PAC meeting | "Enter PAC approval date (NTG only)" |
| SEC_BASIC | kickoff_date | Scheduling decision | "Enter NPA kick-off meeting date" |

---

## 4. Intelligent Text Adaptation (5 Techniques)

### Technique 1: Entity Replacement

Replace specific entities (amounts, counterparty names, dates, underlying assets) while preserving sentence structure.

**Process**:
```python
# NER extraction from source text
entities = extract_entities(source_text)
# Example: {"notional": "$25M", "counterparty": "XYZ Corp", "rating": "BBB+", "date": "30-Jun-2024"}

# Build replacement map from new product parameters
replacements = {"notional": "$50M", "counterparty": "ABC Bank", "rating": "A-", "date": "30-Sep-2025"}

# Substitute all entities
output = source_text
for key, new_val in replacements.items():
  output = output.replace(entities[key], new_val)
```

**Example**:
Source: "Transaction: $25M FX Forward with XYZ Corp (BBB+), expiry 30-Jun-2024."
Output: "Transaction: $50M FX Forward with ABC Bank (A-), expiry 30-Sep-2025."

---

### Technique 2: Numerical Scaling

Recalculate derived metrics proportionally based on notional ratio.

**Scaling Formulas**:
```python
FORMULAS = {
  "var": "linear",           # VaR proportional to Notional (for <10x scaling)
  "expected_loss": "linear",
  "book_pct": "linear",      # (Notional / Desk_Book) * 100
  "exposure": "linear",
  "buffer": "sqrt",          # proportional to sqrt(N) for >10x (diversification effect)
  "capital": "linear",
  "revenue": "linear"        # Revenue scales with notional
}

scale_factor = new_notional / source_notional

# For extreme scaling (>10x), use sqrt to avoid overestimation
if scale_factor > 10:
  adjusted_scale = math.sqrt(scale_factor)
  flag_for_review = True
  warning = f"Notional {scale_factor}x larger. VaR may be inaccurate. Consult Risk team."
else:
  adjusted_scale = scale_factor
```

**Example**:
Source VaR: $180K on $25M notional (0.72% of notional)
New notional: $50M, scale_factor = 2.0
New VaR: $360K (linear scaling, ratio preserved at 0.72%)

---

### Technique 3: Threshold-Triggered Insertion

Insert additional content blocks when notional or risk thresholds are crossed.

**Thresholds**:
```python
THRESHOLDS = [
  {
    "amount": 20000000,
    "insert_field": "roae_analysis",
    "content": "ROAE sensitivity analysis per Appendix III. Stress-test across 5 scenarios: Base Case, +-50bps, +-100bps, +-200bps.",
    "rating_change": "low -> moderate"
  },
  {
    "amount": 50000000,
    "insert_field": "signoff_matrix",
    "content": "Finance VP approval required (notional >$50M).",
    "add_signoff": "Finance VP"
  },
  {
    "amount": 100000000,
    "insert_field": "signoff_matrix",
    "content": "CFO review required (notional >$100M). Add +1 day to timeline.",
    "add_signoff": "CFO"
  }
]
```

---

### Technique 4: Qualitative Rating Adjustment

Adjust risk ratings based on quantitative metrics and threshold bands.

**Rating Bands (Market Risk)**:
```python
RISK_RATING_BANDS = {
  "Low":              (0.00, 0.01),   # 0-1% of desk book
  "Moderate":         (0.01, 0.03),   # 1-3% of desk book
  "Moderate-to-High": (0.03, 0.05),   # 3-5% of desk book
  "High":             (0.05, 1.00)    # >5% of desk book
}

# Override rules (from Deep Knowledge)
if classification == "NTG":
  min_rating = "Moderate"  # NTG cannot be Low
if is_cross_border:
  rating = bump_up_one_level(rating)  # LOW->MODERATE, MODERATE->HIGH
if notional > 100000000:
  rating = bump_up_one_level(rating)
if dormancy_years >= 3:
  min_rating = "High"
if loop_back_count >= 3:
  min_rating = "High"  # Circuit breaker triggered
```

---

### Technique 5: Conditional Expansion

Expand text with additional paragraphs for special conditions (cross-border, bundling, ESG).

**Expansion Rules**:
```python
EXPANSIONS = {
  "cross_border": {
    "condition": "is_cross_border == True",
    "fields_affected": ["operational_risk", "tech_requirements", "tax_impact", "signoff_matrix"],
    "text_additions": {
      "operational_risk": "Inter-company booking ({entity_1}/{entity_2}) requires month-end reconciliation per transfer pricing policy. Finance and Ops coordinate P&L allocation across entities. Group Tax reviews cross-border tax implications before first trade.",
      "tech_requirements": "Inter-company reconciliation system configuration required. Dual booking validation in Murex. Cross-entity position netting setup.",
      "tax_impact": "Withholding tax assessment required for {jurisdiction} counterparty. Transfer pricing documentation per OECD guidelines. VAT implications review for financial services."
    }
  },
  "bundling": {
    "condition": "bundling_flag == True",
    "fields_affected": ["operational_risk"],
    "text_additions": {
      "operational_risk": "Bundle execution risk: all component legs must settle simultaneously. Documentation risk: single client confirmation covering multiple booking legs. Unwind risk: component interdependencies may complicate early termination."
    }
  },
  "sustainability": {
    "condition": "has_esg_features == True",
    "fields_affected": ["reputational_risk", "esg_assessment"],
    "text_additions": {
      "reputational_risk": "ESG labeling risk: product must meet sustainability criteria per MBS Green/Social/Sustainability Bond Framework. Greenwashing risk assessment required.",
      "esg_assessment": "Climate risk factors assessed. Transition risk for underlying assets evaluated. Physical risk exposure within acceptable limits."
    }
  }
}
```

---

## 5. NPA Lite Sub-Type Auto-Fill Adjustments (B1-B4)

When `approval_track == NPA_LITE`, the auto-fill behavior adjusts based on the sub-type. Each sub-type has distinct eligibility criteria, template scope, and coverage targets.

### B1: Impending Deal (48-Hour Express) [R12]

**Eligibility**:
- Back-to-back deal with professional counterparty, OR
- Dormant/expired product with UAT completed, OR
- Singapore-approved NPA applicable regionally on BTB basis

**Auto-Fill Adjustments**:
- Coverage target: **50%** (emphasis on sign-off matrix + basic product info)
- Sign-off matrix: Populate ALL relevant SOPs with 48-hour SLA deadline
- Fallback rule: Any SOP objection -> automatically expand to standard NPA Lite
- Auto-approve rule: If no objections after 48 hours -> status = APPROVED
- Product info: Reference existing NPA approval (not full description)
- Risk section: Abbreviated -- reference existing risk assessment

**Template Reduction**:
```python
B1_REDUCED_FIELDS = {
  "include": ["SEC_PROD", "SEC_SIGN", "SEC_ENTITY", "SEC_REG"],
  "exclude": ["SEC_PRICE (full)", "SEC_RISK (detailed)", "SEC_BCP"],
  "reference_only": ["SEC_OPS", "SEC_DATA", "SEC_LEGAL"]  # Point to existing NPA
}
```

---

### B2: NLNOC (No Objection Concurrence) [R13]

**Eligibility**:
- Simple change to payoff of approved product
- Reactivation of dormant/expired NPA with no structural changes

**Auto-Fill Adjustments**:
- Coverage target: **55%**
- Decision authority: GFM COO + Head of RMG-MLR jointly (not full SOP sign-off)
- Concurrence type: "No-objection concurrence" (lighter than full sign-off)
- Timeline: 5-10 business days
- Product description: Adapted from existing NPA with payoff change highlighted
- Risk section: Delta from existing risk assessment only

**Sign-Off Matrix Override**:
```python
B2_SIGNOFF = {
  "primary_decision": ["GFM COO", "Head of RMG-MLR"],
  "concurrence_mode": "no_objection",  # Not full approval
  "other_sops": "concurrence_only",    # Lighter review
  "timeline_days": 10
}
```

---

### B3: Fast-Track Dormant Reactivation (48-Hour) [R14]

**Eligibility -- ALL 5 Criteria Must Pass**:
1. Existing live trade in the past (trade history confirmed)
2. NOT on prohibited list (sanctions/regulatory clear)
3. PIR completed for original NPA (post-implementation review done)
4. No variation or changes to product features
5. No change to booking model/system

**Auto-Fill Adjustments**:
- Coverage target: **75%** (highest for NPA Lite -- heavily pre-filled from original NPA)
- Source: Original NPA (not similarity search -- exact parent NPA)
- All SEC_OPS fields: Direct copy from original NPA
- All SEC_PRICE fields: Direct copy from original NPA
- SEC_RISK: Copy with date refresh (regulatory references updated)
- SEC_SIGN: Original approvers notified (48-hour no-objection window)
- Auto-approve rule: No objections after 48 hours -> status = APPROVED

**5-Criteria Verification Block**:
```python
B3_CRITERIA = {
  "live_trade_check":    {"query": "SELECT COUNT(*) FROM trades WHERE npa_id = :parent_id", "pass": ">0"},
  "prohibited_check":    {"source": "risk_agent.prohibited", "pass": "false"},
  "pir_check":           {"query": "SELECT pir_status FROM npa_instances WHERE id = :parent_id", "pass": "COMPLETED"},
  "no_variation_check":  {"source": "classification.has_variations", "pass": "false"},
  "booking_unchanged":   {"compare": "parent.booking_system == current.booking_system", "pass": "true"}
}
# ALL must pass. If ANY fails -> route to standard NPA Lite (not B3).
```

---

### B4: Approved NPA Addendum (Minor Changes) [R15]

**Eligibility**:
- Applies to **LIVE** (not expired) NPAs only
- Minor/incremental updates only (adding cash settlement, bilateral->tripartite, typo fixes)
- NOT eligible for new features, new payoffs, new risk profiles

**Auto-Fill Adjustments**:
- Coverage target: **40%** (minimal -- only changed fields + justification)
- Template: Addendum form (subset of NPA Lite, ~20 fields)
- Original NPA reference: Same GFM ID maintained
- Validity: NOT extended (maintains original expiry date)
- Sign-off: Reduced (typically 1-2 SOPs affected by the change)
- Only populate fields that are being changed + addendum justification

**Critical Constraints**:
```python
B4_CONSTRAINTS = {
  "npa_status_required": "APPROVED",  # Must be LIVE, not expired
  "validity_extended": False,          # NEVER extend validity
  "new_features_allowed": False,       # No new features or payoffs
  "gfm_id": "keep_original",          # Same GFM ID
  "max_timeline_days": 5
}
```

---

## 6. Bundling Track Auto-Fill Rules

### 8 Bundling Conditions (ALL Must Pass) [R08, R17]

When `approval_track == BUNDLING`, the auto-fill agent must verify and document all 8 conditions in the template.

| # | Condition | Auto-Fill Field | Verification Method |
|---|-----------|----------------|-------------------|
| 1 | Building blocks bookable in Murex/Mini/FA with no new model required | booking_system | Check each component's booking_system in historical NPAs |
| 2 | No proxy booking in the transaction | booking_typology | Verify booking_typology is direct, not proxy |
| 3 | No leverage beyond individual component limits | notional_amount | Compare aggregate vs component limits |
| 4 | No new collaterals (existing CSA/GMRA acceptable; can be reviewed) | collateral_types | Check if collateral framework matches existing CSA |
| 5 | No new third-party intermediaries | -- | Flag for manual verification if external parties detected |
| 6 | PDD compliance for all components | -- | Check PDD status for each component NPA |
| 7 | No SCF (exception: structured warrant bundle) | product_type | Auto-check if any component is SCF |
| 8 | Correct cashflow settlement through standard channels | settlement_method | Verify settlement method compatibility across components |

**If ALL 8 pass**: Route to Bundling Arbitration Team for approval.
**If ANY fail**: Route to Full NPA or NPA Lite instead. Auto-fill agent must clearly identify which condition(s) failed.

### Bundling Arbitration Team (6 Members)

Auto-populate sign-off matrix with:
1. Head of GFM COO Office NPA Team (Chair)
2. RMG-MLR
3. TCRM (Technology & Credit Risk Management)
4. Finance-GPC (Group Product Control)
5. GFMO (GFM Operations)
6. GFM Legal & Compliance

### Pre-Approved (Evergreen) Bundles -- No New Approval Needed

If the bundle matches a pre-approved combination, auto-fill coverage jumps to 85%:
- **Dual Currency Deposit/Notes**: FX Option + LNBR/Deposit/Bond
- **Treasury Investment Asset Swap**: Bond + IRS
- **Equity-Linked Note**: Equity Option + LNBR

Additionally, 28+ pre-approved FX derivative bundles exist (maintained in "List of approved FX Bundled products.xlsx"):
- Best/Worst of Option, KIKO CLI, Boosted KO Forward with Guarantee
- Multi-period EKI Strangle, Pivot Forward, Trigger Forward
- Range Coupon CCY Linked SIP

**Auto-Fill Logic for Pre-Approved Bundles**:
```python
if bundle_components in PRE_APPROVED_BUNDLES:
  template = copy_from_pre_approved_bundle(bundle_type)
  coverage = 85%
  approval_required = False  # No new approval needed
  signoff_matrix = "log_only"  # Just record the trade
```

---

## 7. Evergreen Track Auto-Fill Rules

### Evergreen Limits (GFM-Wide) [R43, R44]

When `approval_track == EVERGREEN`, the auto-fill agent must validate against ALL limits before proceeding.

| Limit Type | Cap | Field to Check | Enforcement |
|------------|-----|---------------|-------------|
| Total Notional (GFM-wide aggregate) | USD $500,000,000 | evergreen_notional_used + notional_amount | If exceeds -> downgrade to NPA Lite |
| Long Tenor >10Y (sub-limit) | USD $250,000,000 | tenor > 10Y check | If exceeds -> downgrade to NPA Lite |
| Non-Retail Deal Cap (per NPA) | 10 deals | evergreen_deal_count | If exceeds -> downgrade to NPA Lite |
| Retail Deal Cap (per NPA) | 20 deals | evergreen_deal_count (retail) | If exceeds -> downgrade to NPA Lite |
| Retail Transaction Size (per trade) | USD $25,000,000 | notional_amount (retail) | If exceeds -> downgrade to NPA Lite |
| Retail Aggregate Notional (sub-limit) | USD $100,000,000 | retail_aggregate | If exceeds -> downgrade to NPA Lite |

**Special Exemption [R44]**: Liquidity management products -> ALL notional and deal count caps are WAIVED due to exigency.

**Counting Rule**: Only the **customer leg** counts. BTB/hedge legs are excluded. Bond issuance deal count = tranche count (client-facing deals only).

### Evergreen Auto-Fill Coverage

- Coverage target: **85-90%** (highest of all tracks)
- Most fields copied verbatim from existing Evergreen NPA
- Sign-off: NONE required (log-only process)
- Template: STD_NPA_V2 with minimal modifications
- Key action: Update Evergreen limits worksheet immediately after trade

### Evergreen Trading Workflow [R18]

Auto-fill populates the post-trade notification template:
1. Sales/Trader executes deal
2. **IMMEDIATELY** (within 30 min) email GFM COD SG - COE NPA with deal details
3. SG NPA Team updates Evergreen limits worksheet (chalk usage)
4. Location COO Office confirms within 30 minutes (sanity check)
5. Initiate NPA Lite reactivation in parallel
6. When NPA Lite approved -> Uplift (restore) Evergreen limits

### Appendix VII: Evergreen FAQ/Checklist

Auto-populated fields:
- **Validity**: 3 years from approval date (GFM deviation approved 21-Feb-2023)
- **Annual Review**: Required by NPA Working Group
- **Dormancy Rule**: Products dormant >3 years at review time -> removed from Evergreen list
- **Eligibility Checklist** (6 criteria -- ALL must be met):
  1. No significant changes since last approval
  2. BTB basis with professional counterparty
  3. Vanilla/foundational product
  4. Liquidity management product (including MBS Group Holdings)
  5. Exchange product used as hedge against customer trades
  6. ABS origination to meet client demand

---

## 8. Dormancy & Expiry Routing Logic

The auto-fill agent must determine the correct routing path for existing products based on their dormancy status and variation presence. This directly impacts template selection, coverage targets, and sign-off requirements.

### Routing Decision Matrix

| Status | Condition | Route | Template | Coverage | Timeline |
|--------|-----------|-------|----------|----------|----------|
| Active | On Evergreen list | Evergreen (trade same day) | STD_NPA_V2 | 85-90% | Same day |
| Active | NOT on Evergreen list | NPA Lite - Reference Existing | STD_NPA_V2 | 75% | 4-5 days |
| Dormant <3yr | Meets ALL 5 fast-track criteria | B3 Fast-Track (48 hours) | STD_NPA_V2 | 75% | 48 hours |
| Dormant <3yr | Has variations | NPA Lite (standard) | STD_NPA_V2 | 60% | 4-5 days |
| Dormant >=3yr | Any | **ESCALATE to GFM COO** | May need FULL_NPA_V1 | 50% | COO decides |
| Expired | No variations | NPA Lite - Reactivation | STD_NPA_V2 | 65% | 4-5 days |
| Expired | Has variations | **Full NPA (treated as NTG)** | FULL_NPA_V1 | 45% | 7-12 days |

### Dormancy Definition [R34]

A product is **dormant** when no transactions have been booked in the last **12 months**.

### Auto-Fill Impact by Routing Path

**Active + Evergreen**:
- Copy verbatim from existing Evergreen NPA
- Validate against Evergreen limits
- No sign-off required (log-only)
- Post-trade notification template auto-generated

**Active + NOT Evergreen**:
- Use best-match existing NPA as source
- Adapt for new location/entity if applicable
- Standard NPA Lite sign-off (2-3 SOPs)

**Dormant <3yr + Fast-Track (B3)**:
- Source = original parent NPA (not similarity search)
- All operational fields copied directly
- Run 5-criteria verification (live trade, not prohibited, PIR done, no variation, no booking change)
- 48-hour no-objection window

**Dormant <3yr + Variations**:
- Source = original NPA + variation details
- Adapted fields increase (variation changes trigger re-assessment)
- Standard NPA Lite process

**Dormant >=3yr**:
- ESCALATE to GFM COO before proceeding
- Rationale: Risk landscape, regulatory environment, and operational infrastructure may have materially changed
- GFM COO determines whether Full NPA is required
- If Full NPA required -> switch to FULL_NPA_V1 template

**Expired + No Variations**:
- NPA Lite Reactivation track
- Source = expired NPA (content may be stale -- run regulatory freshness check)
- Update all date references, regulatory references

**Expired + Variations**:
- Treated as effectively NTG (new)
- Full NPA template (FULL_NPA_V1)
- Coverage drops to 45% (many fields need fresh content)
- All 7 SOPs required
- PIR mandatory within 6 months

---

## 9. Cross-Border Override Rules [R07]

### The Non-Negotiable Override

If `is_cross_border == True`, the auto-fill agent MUST automatically add **5 mandatory sign-off parties** regardless of approval track. These CANNOT be waived, even for NPA Lite.

### 5 Mandatory Cross-Border Sign-Offs

1. **Finance (Group Product Control)** -- Transfer pricing, accounting treatment, tax implications
2. **RMG-Credit** -- Cross-jurisdictional counterparty risk, country risk
3. **RMG-Market & Liquidity Risk (MLR)** -- Cross-border market risk, regulatory capital
4. **Technology** -- Inter-company system configuration, dual booking setup
5. **Operations** -- Cross-entity settlement, reconciliation, reporting

### Cross-Border Detection Logic

```python
is_cross_border = (
  booking_entity_location != counterparty_location
  OR booking_entity_location != settlement_location
  OR multiple_booking_entities == True
)
```

### Auto-Fill Actions When Cross-Border Detected

```python
if is_cross_border:
  # 1. Add 5 mandatory sign-offs
  MANDATORY_SIGNOFFS = [
    "Finance (Group Product Control)",
    "RMG-Credit",
    "RMG-Market & Liquidity Risk (MLR)",
    "Technology",
    "Operations"
  ]
  for party in MANDATORY_SIGNOFFS:
    if party not in signoff_matrix:
      signoff_matrix.append(party)

  # 2. Expand operational risk text
  operational_risk += cross_border_reconciliation_paragraph

  # 3. Expand tax impact
  tax_impact += withholding_tax_paragraph + transfer_pricing_paragraph

  # 4. Expand technology requirements
  tech_requirements += inter_company_reconciliation_paragraph

  # 5. Add timeline buffer
  timeline_estimate += 1.5  # Additional days for cross-border review

  # 6. Notifications
  notifications.append("Cross-border: 5 mandatory sign-offs added. Timeline +1.5 days.")
```

---

## 10. Quality Assurance (5 Checks)

### Check 1: Internal Consistency

Verify auto-filled fields do not contradict each other.

**Consistency Rules**:
```python
CONSISTENCY_RULES = {
  "risk_var_alignment": {
    "condition": "IF risk_rating == 'Low' THEN var_amount < 100000",
    "error": "Low risk contradicts high VaR. Expected <$100K."
  },
  "rating_loss_alignment": {
    "condition": "IF counterparty_rating >= 'A-' THEN expected_loss < 10",  # bps
    "error": "A- rating should have <10bps loss."
  },
  "notional_roae": {
    "condition": "IF notional > 20000000 THEN roae_analysis IS NOT NULL",
    "error": "Notional >$20M requires ROAE sensitivity analysis [R40]."
  },
  "cross_border_signoffs": {
    "condition": "IF is_cross_border THEN all 5 mandatory SOPs present in signoff_matrix",
    "error": "Cross-border missing mandatory sign-offs [R07]."
  },
  "ntg_full_npa": {
    "condition": "IF classification == 'NTG' THEN approval_track == 'FULL_NPA'",
    "error": "NTG must always use Full NPA [R11]."
  },
  "ntg_pac": {
    "condition": "IF classification == 'NTG' THEN pac_approval_date IS NOT NULL",
    "error": "NTG requires PAC approval before NPA starts [R16]."
  },
  "b4_live_only": {
    "condition": "IF npa_lite_subtype == 'B4' THEN parent_npa_status == 'APPROVED'",
    "error": "B4 Addendum only applies to LIVE (not expired) NPAs [R15]."
  }
}
```

---

### Check 2: Regulatory Freshness

Auto-detect and replace deprecated regulatory references.

**Deprecated Reference Library** (updated quarterly):
```python
DEPRECATED_REFS = {
  "LIBOR":       {"replacement": "SOFR", "deprecated": "2023-06-30", "auto_replace": True},
  "MAS Notice 123": {"replacement": "MAS Notice 656 (revised)", "deprecated": "2024-01-01", "auto_replace": True},
  "EMIR 1.0":    {"replacement": "EMIR Refit", "deprecated": "2022-09-01", "auto_replace": True},
  "Basel II":    {"replacement": "Basel III", "deprecated": "2019-01-01", "auto_replace": True},
  "SFA04-N12 (2010)": {"replacement": "SFA04-N12 (Amendment 2016)", "deprecated": "2016-09-01", "auto_replace": True}
}

# Scan ALL auto-filled text fields
for field_id in auto_filled_fields:
  for old_ref, info in DEPRECATED_REFS.items():
    if old_ref in template[field_id]:
      template[field_id] = template[field_id].replace(old_ref, info["replacement"])
      notifications.append(f"Updated {old_ref} -> {info['replacement']} (deprecated {info['deprecated']})")
```

---

### Check 3: Completeness

Verify all mandatory fields have values or are flagged for manual input.

**Mandatory Fields by Template**:
```python
STD_NPA_V2_MANDATORY = [
  "product_name", "product_type", "desk", "business_unit",
  "booking_system", "valuation_model", "settlement_method",
  "pricing_methodology", "market_risk", "credit_risk", "operational_risk",
  "primary_regulation", "sanctions_check", "booking_entity",
  "required_signoffs", "legal_opinion", "data_privacy", "reporting_requirements"
]

FULL_NPA_V1_MANDATORY = [
  "product_manager_name", "group_product_head", "proposal_preparer",
  "business_case_status", "npa_process_type", "approving_authority",
  "customer_segments", "distribution_channels",
  "aml_assessment", "terrorism_financing", "sanctions_assessment",
  "fraud_risk", "bribery_corruption"
]

# Check all mandatory fields
for field_id in mandatory_fields:
  if template[field_id] is None or template[field_id] == "":
    if field_id in GENERIC_TEMPLATES:
      template[field_id] = GENERIC_TEMPLATES[field_id]
      field_color[field_id] = "yellow"
      notifications.append(f"{field_id} auto-filled with generic template. Please customize.")
    else:
      field_color[field_id] = "red"
      notifications.append(f"{field_id} requires manual input (mandatory).")
```

---

### Check 4: Cross-Border Override Enforcement [R07]

```python
if is_cross_border:
  MANDATORY_5 = ["Finance (GPC)", "RMG-Credit", "RMG-MLR", "Technology", "Operations"]
  for party in MANDATORY_5:
    if party not in template["required_signoffs"]:
      template["required_signoffs"].append(party)
      notifications.append(f"Added {party} (cross-border mandatory, NON-NEGOTIABLE)")
```

---

### Check 5: Notional Threshold Escalation [R40, R41, R42]

```python
notional = template["notional_amount"]

# >$20M: ROAE required
if notional > 20000000:
  if template["roae_analysis"] is None:
    template["roae_analysis"] = load_roae_template()
    field_color["roae_analysis"] = "yellow"
    notifications.append(">$20M: ROAE sensitivity analysis added (Appendix III) [R40]")

# >$50M: Finance VP
if notional > 50000000:
  if "Finance VP" not in template["required_signoffs"]:
    template["required_signoffs"].append("Finance VP")
    notifications.append(">$50M: Finance VP added to sign-off matrix [R41]")

# >$100M: CFO
if notional > 100000000:
  if "CFO" not in template["required_signoffs"]:
    template["required_signoffs"].append("CFO")
    timeline_estimate += 1  # +1 day for CFO review
    notifications.append(">$100M: CFO added to sign-off matrix (+1 day) [R42]")

# >$10M + Derivative: MLR review
if notional > 10000000 and product_type in DERIVATIVE_TYPES:
  if "RMG-MLR" not in template["required_signoffs"]:
    template["required_signoffs"].append("RMG-MLR")
    notifications.append(">$10M Derivative: MLR review required")
```

---

## 11. Integration with Other Agents

### Upstream Inputs

**From Ideation Agent (Phase 0)**:
```json
{
  "product_description": "FX Forward GBP/USD, 3M tenor, $50M notional",
  "user_responses": {"Q4": "$50M", "Q6": "A-", "Q7": "SG/HK"},
  "extracted_params": {
    "product_type": "FX Forward",
    "underlying": "GBP/USD",
    "notional": 50000000,
    "counterparty_rating": "A-",
    "is_cross_border": true
  }
}
```

**From Classification Agent (Stage 1-2)**:
```json
{
  "classification_type": "Existing",
  "approval_track": "NPA_LITE",
  "npa_lite_subtype": null,
  "confidence": 0.96,
  "similar_npa_id": "TSG1917",
  "similarity_score": 0.94
}
```

**From Risk Agent (Validation)**:
```json
{
  "status": "PASS",
  "cross_border_flag": true,
  "bundling_flag": false,
  "prohibited": false,
  "risk_tier": "Standard",
  "required_approvals": ["Desk Head", "Regional Risk Head"]
}
```

**From KB Search Agent (Historical NPAs)**:
```json
{
  "top_5_matches": [
    {
      "npa_id": "TSG1917",
      "similarity": 0.94,
      "product_name": "FX Forward EUR/USD 3M",
      "full_content": {"SEC_PROD": {...}, "SEC_OPS": {...}},
      "approval_outcome": "Approved",
      "loop_backs": 0,
      "approval_date": "2024-12-15"
    }
  ]
}
```

### Downstream Outputs

**To Angular UI (Rendering)**:
```json
{
  "auto_filled_template": {
    "STD_NPA_V2": {"SEC_PROD": {...}, "SEC_OPS": {...}, ...},
    "FULL_NPA_V1": {"SEC_BASIC": {...}, ...}
  },
  "field_colors": {"product_name": "yellow", "booking_system": "green", "counterparty": "red"},
  "section_completion": {"SEC_PROD": "84%", "SEC_OPS": "94%", ...},
  "overall_coverage": 78,
  "notifications": ["Cross-border: 5 sign-offs added", "ROAE template inserted"],
  "guided_steps": [...],
  "source_npa": "TSG1917",
  "time_saved_minutes": 70,
  "template_id": "STD_NPA_V2"
}
```

**To Completeness Agent (Stage 1 Review)**:
```json
{
  "manual_remaining": ["counterparty", "trade_date", "notional_amount", ...],
  "completion_pct": 78,
  "est_manual_time_min": 10,
  "fields_needing_verification": ["market_risk", "credit_risk", "pricing_assumptions"]
}
```

**To Validation Agent (Stage 1 QA)**:
```json
{
  "qa_checks_passed": {
    "consistency": true,
    "regulatory_freshness": true,
    "completeness": false,
    "cross_border_override": true,
    "notional_thresholds": true
  },
  "failing_checks": ["completeness: 3 mandatory fields require manual input"],
  "adapted_fields_for_validation": ["market_risk", "credit_risk", "pricing_assumptions"]
}
```

---

## 12. Edge Cases (5 Scenarios)

### Case 1: Stale Regulatory Reference

**Scenario**: Source NPA from 2020 contains "LIBOR" (discontinued June 2023)

**Handling**:
```python
# Auto-detected by Check 2 (Regulatory Freshness)
template["pricing_assumptions"] = template["pricing_assumptions"].replace("LIBOR", "SOFR")
notifications.append("Updated LIBOR -> SOFR (discontinued June 2023). Verify pricing curve references.")
field_color["pricing_assumptions"] = "yellow"
```

---

### Case 2: Extreme Scaling (>10x Notional)

**Scenario**: Source NPA has $10M notional, new product has $500M (50x)

**Handling**:
```python
scale = new_notional / source_notional  # 50

if scale > 10:
  # Use sqrt scaling instead of linear (diversification effect)
  adj_scale = math.sqrt(scale)  # sqrt(50) ~ 7.07
  new_var = source_var * adj_scale
  field_color["market_risk"] = "yellow"
  notifications.append(
    f"Notional {scale}x larger than source. VaR scaled using sqrt method (conservative). "
    f"Review with Risk team recommended."
  )
  # Also trigger threshold checks
  # $500M > $100M -> CFO required
  # $500M > $50M -> Finance VP required
  # $500M > $20M -> ROAE required
```

---

### Case 3: Conflicting Historical NPAs

**Scenario**: Two equally similar NPAs (both 90%+) have conflicting values:
- TSG1917: settlement_method = "CLS"
- TSG2044: settlement_method = "Bilateral SWIFT"

**Handling**:
```python
values = [npa.settlement_method for npa in top_5 if npa.similarity >= 0.85]

if len(set(values)) > 1:
  # Majority vote
  from collections import Counter
  most_common = Counter(values).most_common(1)[0][0]
  template["settlement_method"] = most_common
  field_color["settlement_method"] = "yellow"
  notifications.append(
    f"Conflicting settlement methods found ({', '.join(set(values))}). "
    f"Used most common: {most_common}. Please verify."
  )
```

---

### Case 4: User Manual Override (Cascade)

**Scenario**: Auto-filled "Murex" as booking_system, user changes to "Summit"

**Handling**:
```python
FIELD_DEPENDENCIES = {
  "booking_system": [
    "valuation_model", "settlement_method", "booking_typology",
    "booking_family", "portfolio_allocation", "tech_requirements"
  ],
  "counterparty_rating": [
    "credit_risk", "counterparty_default", "collateral_types"
  ]
}

if user_override_detected(field_id):
  for dep_field in FIELD_DEPENDENCIES.get(field_id, []):
    field_color[dep_field] = "yellow"
    notifications.append(
      f"Changed {field_id} to {new_value}. Review {dep_field} -- may need update."
    )
```

---

### Case 5: NTG Product (No Historical Match)

**Scenario**: Credit Default Swap -- MBS has never traded CDS (similarity <50%)

**Handling**:
```python
if classification == "NTG" and max_similarity < 0.50:
  # Load generic derivative template
  template = load_generic_template("Derivative")
  coverage = 45  # Only structural fields

  # Still populate what we can:
  # - booking_system: Murex (standard for derivatives)
  # - valuation_model: CDS-specific from product type catalog
  # - settlement: ISDA standard
  # - regulatory: MAS derivatives rules
  # - sign-off: ALL 7 SOPs (NTG requirement [R20])

  message = (
    "NTG product with no historical precedent. Auto-fill coverage 45% (structural fields only). "
    "Manual input required for product specifications, risk assessments, and pricing model."
  )
  offer_external_search = True  # "Search public filings for CDS examples?"
```

---

## 13. Performance Targets

### Speed
- Auto-fill processing time: **<3 seconds** (end-to-end)
- Template loading: <500ms
- Historical match retrieval: <1s (from KB Search cache)
- QA checks: <500ms (all 5 checks combined)
- UI rendering: <1s (color-coded display)

### Coverage
- Full NPA (FULL_NPA_V1 + STD_NPA_V2): **>=78% auto-fill** (63/80+ fields)
- NPA Lite (STD_NPA_V2): **>=85% auto-fill** (61/72 fields)
- Bundling (STD_NPA_V2 + bundling sections): **>=70% auto-fill**
- NTG with no match: **>=45% auto-fill** (structural fields only)

### Accuracy
- User acceptance rate: **>=92%** (fields accepted without changes)
- Override rate: **<15%** (fields changed by user after auto-fill)
- Consistency check pass rate: **100%** (no contradictions in output)
- Regulatory freshness: **100%** (all deprecated refs auto-replaced)

### Quality
- First-time approval rate: **>=70%** (vs 52% baseline)
- Loop-back reduction: **30%** fewer loop-backs (from 8 to 5.6/month)
- Completeness: All mandatory fields filled or flagged with user prompts
- Audit trail: 100% of field lineage tracked (source NPA, technique, confidence)

### User Satisfaction
- Time savings: **>=70%** (60-90 min -> 15-20 min)
- User rating: **>=4.3/5.0**
- Guided completion: 4-step process with time estimates per step

---

## 14. DB Interaction (Tables, Queries, Persistence)

### Primary Tables

| Table | Purpose | Agent Access |
|-------|---------|-------------|
| `npa_instances` | Source NPA records (historical) | READ -- fetch best-match NPA content |
| `npa_form_data` | Persisted field values for current NPA | WRITE -- save auto-filled values |
| `ref_npa_templates` | Template definitions (STD_NPA_V2, FULL_NPA_V1) | READ -- load template structure |
| `ref_npa_sections` | Section definitions per template | READ -- section ordering, descriptions |
| `ref_npa_fields` | Field definitions per section | READ -- field keys, types, requirements |
| `ref_field_options` | Dropdown options for select fields | READ -- constrained value sets |
| `npa_product_attributes` | Key-value product attributes | READ/WRITE -- extracted product parameters |
| `projects` | Project records linking to NPA instances | READ -- project context |
| `users` | User profiles, desk assignments | READ -- auto-fill maker, BU, desk |
| `audit_log` | All agent actions logged | WRITE -- audit trail for every auto-fill |

### Key Queries

**Fetch Source NPA Content**:
```sql
SELECT ni.*, npa.attribute_key, npa.attribute_value
FROM npa_instances ni
LEFT JOIN npa_product_attributes npa ON ni.id = npa.npa_id
WHERE ni.id = :best_match_npa_id;
```

**Load Template Fields**:
```sql
SELECT rf.id, rf.field_key, rf.label, rf.field_type, rf.is_required, rs.id AS section_id
FROM ref_npa_fields rf
JOIN ref_npa_sections rs ON rf.section_id = rs.id
WHERE rs.template_id = :template_id
ORDER BY rs.order_index, rf.order_index;
```

**Persist Auto-Filled Values**:
```sql
INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence, source_npa_id, updated_at)
VALUES (:project_id, :field_key, :field_value, :lineage, :confidence, :source_npa_id, NOW())
ON DUPLICATE KEY UPDATE
  field_value = VALUES(field_value),
  lineage = VALUES(lineage),
  confidence = VALUES(confidence),
  source_npa_id = VALUES(source_npa_id),
  updated_at = NOW();
```

**Fetch Dropdown Options**:
```sql
SELECT option_value, option_label
FROM ref_field_options
WHERE field_id = :field_id
ORDER BY order_index;
```

**Log Auto-Fill Action**:
```sql
INSERT INTO audit_log (action, entity_type, entity_id, details, performed_by, performed_at)
VALUES ('autofill_batch', 'npa_form_data', :project_id,
  JSON_OBJECT(
    'fields_filled', :count,
    'template_id', :template_id,
    'source_npa', :source_npa_id,
    'coverage_pct', :coverage,
    'qa_checks', :qa_results
  ),
  'template_autofill_agent', NOW());
```

### MCP Tools Available

| Tool | Purpose | When Used |
|------|---------|-----------|
| `autofill_get_template_fields` | Retrieve template structure with field definitions | At start of auto-fill process |
| `autofill_populate_field` | Set single field value with lineage tracking | For individual adapted fields |
| `autofill_populate_batch` | Set multiple field values in one call | For bulk direct-copy (Bucket 1) |
| `autofill_get_form_data` | Retrieve current form state | For QA checks and current state |
| `autofill_get_field_options` | Get dropdown options for select fields | When populating constrained fields |
| `get_npa_by_id` | Load source NPA record and content | To fetch best-match NPA |
| `audit_log_action` | Log all operations for audit trail | After every batch populate and QA check |

---

## 15. Continuous Learning & Feedback Loop

### Signal 1: Manual Override Rate

Track which auto-filled fields users change most frequently.

```python
for field in auto_filled_fields:
  if user_changed(field):
    log_override(field, original_value, new_value)

# Monthly analysis
override_rates = calc_override_rate_by_field()
if override_rates["market_risk"] > 0.20:
  # Action: Increase recency bias in source selection for risk fields
  trigger_root_cause_analysis("market_risk")
```

### Signal 2: Checker Rejections

Track which auto-filled sections cause checker rejections.

```python
if checker_rejection:
  log_rejection(section, reason, was_auto_filled)

# If rejection rate >30% for a section, adjust adaptation technique
if rejection_rates["SEC_RISK"] > 0.30:
  # Root cause analysis: text too compressed? Stale references?
  TEXT_COMPRESSION_RATIO = 0.70  # Preserve more content from source
```

### Signal 3: Approval Cycle Times

Track whether auto-filled NPAs have shorter approval times.

```python
avg_auto_filled = calc_avg_approval_time(auto_filled=True)   # Target: 4 days
avg_manual = calc_avg_approval_time(auto_filled=False)        # Baseline: 12 days
improvement = (avg_manual - avg_auto_filled) / avg_manual * 100
```

### Retraining Cadence

```python
SCHEDULE = {
  "monthly":    ["update_regulatory_library", "refresh_deprecated_refs"],
  "quarterly":  ["retrain_ner_models", "refresh_generic_templates", "update_thresholds"],
  "annually":   ["algorithm_improvements", "expand_field_catalog", "new_adaptation_techniques"]
}
```

---

## END OF KB_TEMPLATE_AUTOFILL_AGENT

**Version**: 3.0 (updated 2026-02-20)
**Cross-verified against**: NPA_Business_Process_Deep_Knowledge.md -- all 44 business rules (R01-R44)
**DB Templates covered**: STD_NPA_V2 (10 sections, ~72 fields), FULL_NPA_V1 (8 sections, ~30 fields)
**Scope**: Complete field catalog with lineage (AUTO/ADAPTED/MANUAL), 5 adaptation techniques, NPA Lite B1-B4 sub-type adjustments, Bundling 8-condition gate, Evergreen limits and workflow, Dormancy/Expiry routing logic, Cross-border override rules, 5 QA checks, 5 edge cases, DB interaction patterns, MCP tools reference, continuous learning signals
**Total Fields Cataloged**: 102 fields across both templates
**Auto-Fill Coverage**: 78% (Full NPA), 85% (NPA Lite), 70% (Bundling), 45% (NTG no-match)
