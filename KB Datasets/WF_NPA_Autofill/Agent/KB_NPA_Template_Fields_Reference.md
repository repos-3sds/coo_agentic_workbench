# NPA Template Fields Reference — Part C + Appendices
## Authoritative field_key → Template Section Mapping (Version 2.0 — Feb 2026)

This document maps every atomic `field_key` in the NPA workbench database to its position in the official NPA Template (RMG OR Version Jun 2025). All agents (AutoFill, Classification, Risk, Governance) MUST use these exact field_keys when reading or writing NPA form data.

---

## Template Structure Overview

The NPA template has 3 parts:
- **Part A** — Basic product info (handled outside template editor)
- **Part B** — Sign-off parties (handled outside template editor)
- **Part C** — Product detail completed by Proposing Unit (Sections I–VII)
- **Appendices 1–6** — Entity tables, IP, financial crime, risk data, trading products, 3rd-party

**Total field_keys in template**: 60+ (vs original 47)

---

## Part C — Section I: Product Specifications

### I.1 Description (Basic Information)
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `product_name` | Product Name | text | PC.I.1.a |
| `product_type` | Product Type / Asset Class | text | PC.I.1.b |
| `underlying_asset` | Underlying Reference Asset | textarea | PC.I.1.b |
| `tenor` | Tenor / Maturity | text | PC.I.1.c |
| `product_role` | Role (Principal/Distributor/Market Maker) | text | PC.I.1.d |
| `business_rationale` | Purpose / Rationale | textarea | PC.I.1.e |

### I.1 Revenue & Commercial Viability
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `funding_type` | Funding Model | text | PC.I.1.rev |
| `product_maturity` | Product Maturity Stage | text | PC.I.1.rev |
| `product_lifecycle` | Lifecycle Stage | text | PC.I.1.rev |
| `notional_amount` | Notional Amount | text | PC.I.1.rev |
| `revenue_year1` | Revenue Projection Year 1 | text | PC.I.1.rev |
| `revenue_year2` | Revenue Projection Year 2 | text | PC.I.1.rev |
| `revenue_year3` | Revenue Projection Year 3 | text | PC.I.1.rev |
| `target_roi` | Target ROI / ROAE | text | PC.I.1.rev |
| `spv_details` | SPV / Special Vehicle Details | textarea | PC.I.1.rev |

### I.2 Target Customer
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `customer_segments` | Target Customer Segments | textarea | PC.I.2 |

### I.3 Commercialization
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `distribution_channels` | Distribution Channels | textarea | PC.I.3.a |
| `sales_suitability` | Sales & Suitability Assessment | textarea | PC.I.3.b |
| `marketing_plan` | Marketing & Client Communication | textarea | PC.I.3.c |

### I.4 PAC Conditions
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `pac_reference` | PAC Reference / Conditions | text | PC.I.4 |

### I.5 External Parties / IP
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `ip_considerations` | Intellectual Property Considerations | textarea | PC.I.5 |

---

## Part C — Section II: Operational & Technology

### II.1 Operational Information
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `front_office_model` | Front Office Operating Model | textarea | PC.II.1.a |
| `middle_office_model` | Middle Office Operating Model | textarea | PC.II.1.a |
| `back_office_model` | Back Office Operating Model | textarea | PC.II.1.a |

### II.2 Technical Platform / Booking
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `booking_legal_form` | Booking Legal Form | text | PC.II.2.a |
| `booking_family` | Booking Family | text | PC.II.2.a |
| `booking_typology` | Booking Typology | text | PC.II.2.a |
| `booking_system` | Booking System | text | PC.II.2.a |
| `portfolio_allocation` | Portfolio / Book Allocation | text | PC.II.2.a |
| `confirmation_process` | Confirmation Process | textarea | PC.II.2.b |
| `reconciliation` | Reconciliation Requirements | textarea | PC.II.2.b |
| `tech_requirements` | Technology Requirements | textarea | PC.II.2.c |
| `valuation_model` | Valuation Model | textarea | PC.II.2.d |
| `settlement_method` | Settlement Method | text | PC.II.2.e |

### II.3 Information Security
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `iss_deviations` | ISS Deviations / Exceptions | textarea | PC.II.3 |
| `pentest_status` | Penetration Test Status | text | PC.II.3 |

### II.4 Technology Resiliency
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `hsm_required` | HSM / Resilience Requirements | text | PC.II.4 |

---

## Part C — Section III: Pricing Model Details

| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `pricing_methodology` | Pricing Methodology | textarea | PC.III.1 |
| `roae_analysis` | ROAE / P&L Analysis | textarea | PC.III.1 |
| `pricing_assumptions` | Pricing Assumptions | textarea | PC.III.2 |
| `bespoke_adjustments` | Bespoke Pricing Adjustments | textarea | PC.III.2 |
| `pricing_model_name` | Model Name / Version | text | PC.III.3 |
| `model_validation_date` | Model Validation Date | text | PC.III.3 |
| `simm_treatment` | SIMM / Initial Margin Treatment | textarea | PC.III.3 |

---

## Part C — Section IV: Risk Analysis

### IV.A Operational Risk (Legal & Finance)
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `legal_opinion` | Legal Opinion / Documentation | textarea | PC.IV.A.1 |
| `primary_regulation` | Primary Regulation | textarea | PC.IV.A.2 |
| `secondary_regulations` | Secondary Regulations | textarea | PC.IV.A.2 |
| `regulatory_reporting` | Regulatory Reporting Requirements | textarea | PC.IV.A.3 |
| `sanctions_check` | Sanctions & AML Screening | textarea | PC.IV.A.4 |
| `tax_impact` | Tax Impact Assessment | textarea | PC.IV.A.5 |

### IV.B Market & Liquidity Risk
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `market_risk` | Market Risk Assessment | textarea | PC.IV.B.1 |
| `risk_classification` | Risk Classification | textarea | PC.IV.B.1 |
| `liquidity_risk` | Liquidity Risk Assessment | textarea | PC.IV.B.2 |
| `regulatory_capital` | Regulatory Capital Requirements | textarea | PC.IV.B.3 |
| `var_capture` | VaR Capture & Methodology | textarea | PC.IV.B.4 |

#### Market Risk Factor Matrix (Table)
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `mrf_ir_delta` | IR Delta | text | PC.IV.B.1.table |
| `mrf_ir_vega` | IR Vega | text | PC.IV.B.1.table |
| `mrf_fx_delta` | FX Delta | text | PC.IV.B.1.table |
| `mrf_fx_vega` | FX Vega | text | PC.IV.B.1.table |
| `mrf_eq_delta` | Equity Delta | text | PC.IV.B.1.table |
| `mrf_commodity` | Commodity Risk | text | PC.IV.B.1.table |
| `mrf_credit` | Credit Spread | text | PC.IV.B.1.table |
| `mrf_correlation` | Correlation Risk | text | PC.IV.B.1.table |

### IV.C Credit Risk
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `credit_risk` | Credit Risk Assessment | textarea | PC.IV.C.1 |
| `counterparty_default` | Counterparty Default Risk | textarea | PC.IV.C.2 |
| `stress_scenarios` | Stress Testing Scenarios | textarea | PC.IV.C.3 |
| `custody_risk` | Custody & Collateral Risk | textarea | PC.IV.C.4 |
| `counterparty_rating` | Counterparty Credit Rating | text | PC.IV.C.5 |

### IV.D Reputational Risk
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `reputational_risk` | Reputational Risk Assessment | textarea | PC.IV.D.1 |
| `esg_assessment` | ESG Impact Assessment | textarea | PC.IV.D.2 |

---

## Part C — Section V: Data Management

| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `data_privacy` | Data Privacy & D4D Assessment | textarea | PC.V.1 |
| `data_retention` | Data Retention Requirements | textarea | PC.V.1 |
| `gdpr_compliance` | GDPR / PDPA Compliance | textarea | PC.V.1 |
| `data_ownership` | Data Ownership & Classification | textarea | PC.V.1 |
| `pure_assessment_id` | PURE Assessment ID | text | PC.V.2 |
| `reporting_requirements` | Risk Data Aggregation & Reporting | textarea | PC.V.3 |

---

## Part C — Section VI: Other Risk Identification

| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `operational_risk` | Operational Risk Assessment | textarea | PC.VI.1 |

---

## Part C — Section VII: Additional Information for Trading Products

*Section VII uses composite fields from Appendix 5 (see below).*

---

## Appendix 1: Entity & Location Table
*Uses Part A fields (booking_entity, counterparty) — outside template editor.*

## Appendix 2: Intellectual Property
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `ip_considerations` | IP Assessment (Part A + B) | textarea | APP.2 |

## Appendix 3: Financial Crime Risk Assessment
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `aml_assessment` | AML Assessment | textarea | APP.3.1 |
| `terrorism_financing` | Terrorism Financing Assessment | textarea | APP.3.2 |
| `sanctions_assessment` | Sanctions Compliance Assessment | textarea | APP.3.3 |
| `fraud_risk` | Fraud Risk Assessment | textarea | APP.3.4 |
| `bribery_corruption` | Bribery & Corruption Assessment | textarea | APP.3.5 |

## Appendix 4: Risk Data Aggregation
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `reporting_requirements` | Risk Data Aggregation | textarea | APP.4 |

## Appendix 5: Additional Information for Trading Products
| field_key | Label | Type | Template Position |
|-----------|-------|------|-------------------|
| `customer_segments` | Customer Segments (Trading) | textarea | APP.5.1 |
| `product_type` | Product Type (Trading) | text | APP.5.2 |
| `underlying_asset` | Underlying (Trading) | textarea | APP.5.2 |
| `custody_risk` | Custody & Collateral (Trading) | textarea | APP.5.3 |
| `collateral_types` | Collateral Types | textarea | APP.5.3 |
| `valuation_model` | Valuation Model (Trading) | textarea | APP.5.4 |
| `valuation_method` | Valuation Methodology | textarea | APP.5.4 |
| `funding_source` | Funding Source | textarea | APP.5.5 |
| `booking_schema` | Booking Schema / Architecture | textarea | APP.5.6 |
| `tech_requirements` | Technology Requirements (Trading) | textarea | APP.5.6 |
| `regulatory_reporting` | Regulatory Reporting (Trading) | textarea | APP.5.7 |

## Appendix 6: Third-Party Platforms
*No separate field_keys — uses `tech_requirements` and `ip_considerations`.*

---

## Field Section Mapping (Database)

Each `field_key` belongs to a database section (`ref_npa_sections`):

| Section ID | Section Name | Field Keys Count |
|-----------|-------------|------------------|
| `SEC_PROD` | Product Specifications | 18 |
| `SEC_OPS` | Operational & Technology | 16 |
| `SEC_RISK` | Risk Analysis | 22 |
| `SEC_PRICE` | Pricing Model | 7 |
| `SEC_DATA` | Data Management | 6 |
| `SEC_REG` | Regulatory & Compliance | 10 |
| `SEC_ENTITY` | Entity & Trading | 9 |
| `SEC_SIGN` | Sign-Off Matrix | 2 |
| `SEC_LEGAL` | Legal Documentation | 3 |
| `SEC_DOCS` | Supporting Documents | 2 |

---

## Agent Usage Guide

### AutoFill Agent
When auto-filling fields, use the **exact field_key** values listed above. The UI renders these in hierarchical Doc View (Part C → Section → Topic → Sub-question) and flat Form View (section → field grid). Both views read from the same `npa_form_data` table.

### Classification Agent
Classification does NOT write to form fields. It writes to `npa_classification_scorecards` and updates `npa_projects.npa_type` and `approval_track`.

### Risk Agent
Risk assessment writes to `npa_risk_checks` and `npa_risk_domain_assessments`. It also reads form field values (especially `notional_amount`, `product_type`, `underlying_asset`, `counterparty_rating`, `booking_entity`) to inform risk scoring.

### Governance Agent
Governance writes to `npa_signoffs`. It reads classification results and risk assessment to determine sign-off routing.

---

## END OF KB_NPA_TEMPLATE_FIELDS_REFERENCE
