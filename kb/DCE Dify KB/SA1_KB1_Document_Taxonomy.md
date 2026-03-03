# SA1 KB1 Document Taxonomy

Source: `SA1_KB1_Document_Taxonomy.json`
Record count: 15

## Record 1

### account_type
INSTITUTIONAL_FUTURES

### jurisdiction
SGP

### entity_type
CORP

### product_signals
- FUTURES
- OPTIONS
- SGX
- CME
- HKEX

### required_evidence_signals
- BOARD_RES
- CERT_INCORP
- CORPORATE_PROFILE

### exclusion_signals
- IRS
- CCS
- PHYSICAL_DELIVERY_ONLY

### decision_logic
Classify as INSTITUTIONAL_FUTURES when corporate or institutional entity requests exchange-traded derivatives and evidence pack supports institutional mandate.

### confidence_guidance
0.90-0.98 when entity and products are consistent; 0.75-0.89 if product mentions are generic without explicit exchange references.

### reasoning_template
Institutional/corporate profile with exchange-traded derivatives request and supporting governance documents indicates INSTITUTIONAL_FUTURES.

## Record 2

### account_type
INSTITUTIONAL_FUTURES

### jurisdiction
HKG

### entity_type
FI

### product_signals
- FUTURES
- OPTIONS
- HKEX
- CME

### required_evidence_signals
- REGULATORY_LICENSE
- LEI_CERT
- BOARD_RES

### exclusion_signals
- RETAIL_ONLY_WORDING
- PERSONAL_INCOME_PROOF

### decision_logic
FI entity with listed derivatives intent and regulatory credentials maps to INSTITUTIONAL_FUTURES.

### confidence_guidance
0.88-0.97

### reasoning_template
Licensed FI with listed derivatives product scope aligns with institutional futures onboarding.

## Record 3

### account_type
RETAIL_FUTURES

### jurisdiction
SGP

### entity_type
INDIVIDUAL

### product_signals
- FUTURES
- OPTIONS
- RETAIL
- PERSONAL_INVESTMENT

### required_evidence_signals
- AO_FORM_INDIV
- ID_NRIC_OR_PASSPORT
- RISK_DISCLOSURE

### exclusion_signals
- BOARD_RES
- CORPORATE_REGISTRATION

### decision_logic
Classify as RETAIL_FUTURES when an individual requests exchange-traded derivatives for personal trading and retail identity/suitability artifacts are present.

### confidence_guidance
0.90-0.99 with clear individual profile; 0.70-0.85 when submission source is terse.

### reasoning_template
Individual customer profile and exchange-traded derivatives request indicate RETAIL_FUTURES.

## Record 4

### account_type
RETAIL_FUTURES

### jurisdiction
HKG

### entity_type
INDIVIDUAL

### product_signals
- FUTURES
- HKEX
- INDIVIDUAL_CLIENT

### required_evidence_signals
- HKID_COPY
- PROOF_ADDR
- RISK_DISCLOSURE

### exclusion_signals
- ISDA
- OTC_SWAP

### decision_logic
Individual HK client with listed derivatives intent and personal KYC pack maps to RETAIL_FUTURES.

### confidence_guidance
0.88-0.98

### reasoning_template
Personal onboarding artifacts and listed derivatives intent support RETAIL_FUTURES classification.

## Record 5

### account_type
OTC_DERIVATIVES

### jurisdiction
SGP

### entity_type
CORP

### product_signals
- OTC
- IRS
- CCS
- FX_FORWARD
- FX_OPTION
- SWAP

### required_evidence_signals
- GTA_SCH_9
- ISDA_MASTER
- LEI_CERT

### exclusion_signals
- EXCHANGE_ONLY_NO_OTC_SIGNAL

### decision_logic
Any explicit OTC derivatives product signal should map to OTC_DERIVATIVES unless multi-product pattern is stronger.

### confidence_guidance
0.90-0.99 with explicit OTC terms; 0.72-0.86 if OTC implied but not explicit.

### reasoning_template
Submission includes OTC derivatives intent (e.g., swaps/forwards/options) and OTC legal pack indicators.

## Record 6

### account_type
OTC_DERIVATIVES

### jurisdiction
OTHER

### entity_type
SPV

### product_signals
- OTC
- DERIVATIVE_HEDGE
- STRUCTURED

### required_evidence_signals
- SPV_CONSTITUTION
- UBO_DECL
- GTA_SCH_9

### exclusion_signals
- RETAIL_ONLY

### decision_logic
SPV with OTC hedging mandate and legal structure docs maps to OTC_DERIVATIVES; apply enhanced due diligence flags.

### confidence_guidance
0.78-0.92

### reasoning_template
SPV structure with OTC hedging use-case indicates OTC_DERIVATIVES, subject to enhanced controls.

## Record 7

### account_type
COMMODITIES_PHYSICAL

### jurisdiction
CHN

### entity_type
CORP

### product_signals
- PHYSICAL
- WAREHOUSE
- DELIVERY
- METALS
- ENERGY

### required_evidence_signals
- GTA_SCH_10
- WAREHOUSE_AGREEMENT
- DELIVERY_INSTRUCTIONS

### exclusion_signals
- PURE_FINANCIAL_DERIVATIVES_ONLY

### decision_logic
Physical settlement and logistics/warehouse language are primary indicators for COMMODITIES_PHYSICAL.

### confidence_guidance
0.90-0.98 with explicit physical terms; 0.74-0.88 for ambiguous commodity mentions.

### reasoning_template
Physical commodity delivery and warehouse-control terms indicate COMMODITIES_PHYSICAL.

## Record 8

### account_type
COMMODITIES_PHYSICAL

### jurisdiction
SGP

### entity_type
CORP

### product_signals
- PHYSICAL_COMMODITIES
- DELIVERABLE
- WAREHOUSE

### required_evidence_signals
- COMMODITY_LICENSE
- DELIVERY_INSTRUCTIONS
- GTA_SCH_10

### exclusion_signals
- NO_DELIVERY_SCOPE

### decision_logic
If requested products include physical deliverables and operational commodity controls, classify COMMODITIES_PHYSICAL.

### confidence_guidance
0.86-0.96

### reasoning_template
Client requests physical commodity exposure requiring delivery and warehouse controls.

## Record 9

### account_type
MULTI_PRODUCT

### jurisdiction
SGP

### entity_type
FUND

### product_signals
- FUTURES
- OTC
- PHYSICAL
- MULTI_ASSET

### required_evidence_signals
- FUND_PPM
- FUND_IMA
- MULTIPLE_GTA_SCHEDULES

### exclusion_signals
- SINGLE_PRODUCT_SCOPE_ONLY

### decision_logic
Classify MULTI_PRODUCT when submission explicitly spans 2 or more distinct product families (listed derivatives, OTC, physical commodities).

### confidence_guidance
0.88-0.97

### reasoning_template
Product election spans multiple regulatory/legal schedules, indicating MULTI_PRODUCT onboarding.

## Record 10

### account_type
MULTI_PRODUCT

### jurisdiction
HKG

### entity_type
CORP

### product_signals
- HKEX
- OTC_DERIVATIVES
- STRUCTURED
- FUTURES

### required_evidence_signals
- BOARD_RES
- GTA_SCH_7A
- GTA_SCH_9

### exclusion_signals
- RETAIL_ONLY

### decision_logic
Corporate request combining listed and OTC exposures should be MULTI_PRODUCT.

### confidence_guidance
0.84-0.95

### reasoning_template
Combined listed and OTC product scope requires multi-schedule legal coverage; classify MULTI_PRODUCT.

## Record 11

### decision_rule
entity_type_first_pass

### rule_text
INDIVIDUAL defaults to RETAIL_FUTURES unless OTC terms are explicit and eligibility evidence exists. CORP/FUND/FI/SPV default toward INSTITUTIONAL_FUTURES or OTC_DERIVATIVES based on product language.

### purpose
Stabilize SA-1 classification under sparse intake inputs.

## Record 12

### decision_rule
product_signal_priority

### rule_text
OTC terms (IRS/CCS/swaps/forwards) override generic futures language unless clear multi-product context exists. Physical delivery terms override generic commodity futures terms for COMMODITIES_PHYSICAL.

### purpose
Reduce misclassification and downstream checklist drift.

## Record 13

### decision_rule
confidence_thresholds

### rule_text
confidence < 0.70 => block auto-proceed. 0.70-0.79 => allow with flagged_for_review=true. >=0.80 => normal flow.

### purpose
Align with SA-1 confidence gate and retry safety controls.

## Record 14

### decision_rule
jurisdiction_resolution

### rule_text
Use explicit jurisdiction from portal/API first; if absent in email, infer from legal identifiers and document issuers; if still unclear, set jurisdiction=OTHER and reduce confidence.

### purpose
Deterministic jurisdiction assignment for downstream SA-2 policy selection.

## Record 15

### decision_rule
reasoning_format_standard

### rule_text
Classification reasoning must include: (1) entity evidence, (2) product evidence, (3) jurisdiction evidence, (4) conflict checks performed, (5) why alternatives were rejected.

### purpose
Enterprise-grade auditability for classification outcomes.
