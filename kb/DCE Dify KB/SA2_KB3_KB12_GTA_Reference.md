# SA2 KB3 KB12 GTA Reference

Source: `SA2_KB3_KB12_GTA_Reference.json`
Record count: 8

## Record 1

### jurisdiction
SGP

### version
GTA v4.2

### effective_date
2021-11-16

### status
CURRENT

### rule_text
Current GTA baseline for Singapore onboarding is GTA v4.2 (effective 16 Nov 2021). All new account openings must be validated against v4.2 package integrity: master terms, applicable schedules, jurisdictional addenda, and signature pages. Older versions are treated as OUTDATED unless a documented legal exception is approved.

### validation_controls
- Version string must match approved template
- Required schedule signatures must be present
- Signatory names must align with AO signatory authority records

### outcome_if_mismatch
Set gta_validation_status=OUTDATED and next_node=HITL_RM

## Record 2

### jurisdiction
SGP

### products
- FUTURES
- OPTIONS

### required_schedules
- Schedule 7A

### required_addenda
- SGP Addendum

### rule_text
For exchange-traded futures/options under Singapore jurisdiction, Schedule 7A is mandatory. SGP Addendum must be attached where prescribed by legal package template. Missing schedule signature or missing addendum produces MISSING status.

### decision_logic
If Schedule 7A missing -> gta_validation_status=MISSING; retry_recommended=true

## Record 3

### jurisdiction
SGP

### products
- OTC_DERIVATIVES

### required_schedules
- Schedule 9

### required_addenda
- SGP Addendum

### rule_text
For OTC derivatives, Schedule 9 is mandatory and must be consistent with master terms. If collateralization is requested, CSA references must be coherent with legal package. Non-coherent references are treated as OUTDATED/defective package.

### decision_logic
If Schedule 9 absent or inconsistent with elected products -> MISSING

## Record 4

### jurisdiction
SGP

### products
- PHYSICAL_COMMODITIES

### required_schedules
- Schedule 10

### required_addenda
- Delivery/Warehouse Addendum where applicable

### rule_text
Physical commodity onboarding requires Schedule 10 and relevant operational addenda. If delivery obligations exist but no operational addendum is attached, package is incomplete.

### decision_logic
If physical products selected and Schedule 10 absent -> MISSING

## Record 5

### jurisdiction
HKG

### products
- FUTURES
- OPTIONS

### required_schedules
- Schedule 7A

### required_addenda
- HKG Addendum

### rule_text
Hong Kong clients trading listed derivatives require Schedule 7A and jurisdictional HKG addendum. Cross-border servicing into Singapore requires explicit cross-border terms in addendum package.

### decision_logic
If HKG addendum missing for HKG jurisdiction -> MISSING

## Record 6

### jurisdiction
HKG

### products
- OTC_DERIVATIVES

### required_schedules
- Schedule 9

### required_addenda
- HKG Addendum

### rule_text
HK OTC onboarding requires Schedule 9 + HKG addendum and must satisfy local regulatory suitability and disclosure references. Version mismatch with current approved GTA package is OUTDATED.

### decision_logic
Version mismatch -> OUTDATED; missing schedule/addendum -> MISSING

## Record 7

### jurisdiction
CROSS_BORDER

### products
- MULTI_PRODUCT

### required_schedules
- 7A and/or 9 and/or 10 according to elected products

### required_addenda
- Client domicile addendum
- Booking center addendum when required

### rule_text
Cross-border clients need both product schedules and jurisdiction bridging addenda. Validation must check schedule completeness against elected product matrix and addenda completeness against domicile/booking split.

### decision_logic
Any missing cross-border addendum -> MISSING with escalation recommendation

## Record 8

### validation_codes
- **CURRENT**: Submitted package aligns to approved version and required schedules/addenda are complete
- **OUTDATED**: Submitted package references obsolete GTA version or superseded schedule template
- **MISSING**: Required schedule/addendum absent or unsigned

### rule_text
Standardized SA-2 GTA validation outcomes to ensure deterministic routing and auditability across retries.
