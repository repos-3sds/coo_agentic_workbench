# AUTOFILL Agent — Super Plan (Revised)
**Date**: 2026-02-22
**Status**: Deep Analysis Complete — Ready for Execution

---

## THE CORE PROBLEMS (Why AUTOFILL is a "flop show")

### Problem 1: Field keys don't match (THE KILLER BUG)

The LLM invents its own field_keys. The prompt says "Score ALL fields from the template" but never lists the EXACT 72 keys. So:
- LLM outputs `market_risk_assessment` → Angular expects `market_risk`
- LLM outputs `product_structure` → Angular expects `product_name`
- **53 fields streamed, only 8 matched** → 11% effective coverage

**Fix**: Embed the EXACT 72 field_keys into each LLM branch's prompt. Each branch gets its own subset of keys.

### Problem 2: LLM output is too verbose (CAUSES LATENCY)

Looking at the Golden Filled Template (TSG2026), most field values are **1-3 sentences**:
- `booking_legal_form` → "ISDA Master Agreement with Digital Assets Annex" (8 words)
- `booking_family` → "CRY (Cryptocurrency)" (2 words)
- `settlement_method` → "Automatic settlement via Fireblocks" (5 words)
- `primary_regulation` → "MAS Digital Payment Token Service License (applied)" (7 words)

But our current prompt asks the LLM to write PARAGRAPHS of analysis for every field. The `market_risk` field alone generates 200+ words. That's why each branch takes 2-8 minutes — the LLM is writing an essay per field.

**Fix**: Tell the LLM to be CONCISE. Short values for structured fields (booking, system, regulation). Longer text only for narrative fields (business_rationale, market_risk, credit_risk). Target: average 20-40 words per field instead of 100-200.

### Problem 3: Live view doesn't look like an NPA being filled

Users see a flat list of random field cards with invented names. No section grouping. No connection to the NPA document they'll actually review.

**Fix**: Group Live view cards by NPA section. Show section headers. Show progress per section.

### Problem 4: Latency (1 LLM = ~9min, 3 parallel = ~8min bottleneck)

The bottleneck LLM-B took 478 seconds (8 min) in our test. Even with parallelism, total wall-clock is limited by the slowest branch.

**Why so slow**:
- Prompt is HUGE (the system prompt alone is 400+ lines of NPA business rules)
- LLM generates verbose JSON with paragraphs per field
- Knowledge Retrieval adds context that the LLM processes

**Fix (multi-pronged)**:
1. **Slash output verbosity** — concise values = fewer tokens = faster generation
2. **Rebalance branches** — current split is uneven (LLM-B has pricing + data which generates most text)
3. **Trim prompt fat** — remove the adaptation technique descriptions and QA check descriptions from the system prompt. The LLM knows how to adapt text — we don't need to teach it in 200 lines. Instead, give it examples.
4. **Target: < 3 minutes per branch = < 3 min total wall-clock**

### Problem 5: No persistence / no replay

Stream results vanish when editor closes. Can't revisit.

**Fix**: Cache in localStorage + persist to DB.

---

## THE REAL INSIGHT

Looking at the Golden Filled Template (TSG2026 — 549 lines), the actual content per field is SHORT:

| Field | Actual Value Length |
|-------|-------------------|
| product_name | 5 words |
| product_role | 5 words |
| funding_type | 6 words |
| tenor | 5 words |
| booking_legal_form | 7 words |
| booking_family | 2 words |
| booking_typology | 1 word (code) |
| portfolio_allocation | 1 word (code) |
| pricing_model_name | 1 line |
| primary_regulation | 1 line |
| iss_deviations | 1 line |

Even the "longest" fields (business_rationale, market_risk, credit_risk) are 4-8 bullet points, not essays.

**If we tell the LLM "fill each field with the SAME density as a real NPA document", output shrinks by 70%.**

Current LLM output per field: ~150 tokens avg → Total: 72 fields × 150 = 10,800 tokens output
Target LLM output per field: ~40 tokens avg → Total: 72 fields × 40 = 2,880 tokens output

**2,880 tokens at ~50 tok/sec = ~58 seconds.** Even with overhead, each parallel branch should complete in **1-2 minutes**.

---

## EXECUTION PLAN

### Step 1: Create Field Registry (the master key list)

A markdown table with ALL 72 field_keys, their labels, their expected value format, and which LLM branch handles them.

**Branch split (rebalanced for even load):**

| Branch | Section Coverage | Field Count | Expected Density |
|--------|-----------------|-------------|-----------------|
| **LLM-A** | Section I (Product Specs) + Section V (Data) + Section VI (Other Risk) | ~28 fields | Mix of short + narrative |
| **LLM-B** | Section II (Ops & Tech) + Section III (Pricing) | ~23 fields | Mostly short/structured |
| **LLM-C** | Section IV (Risk Analysis) + Appendices (3,5) | ~21 fields | Mix of structured + narrative |

This is more balanced than the current split where B had all the heavy content.

### Step 2: Rewrite the 3 LLM Branch Prompts

Each branch gets:
1. **Its specific field_keys** — exact keys with labels and expected format
2. **Conciseness rules** — "Fill each field as it appears in an actual NPA document. Use 1-3 sentences for narrative fields, single values for structured fields. Do NOT write essays."
3. **Example values** — from the TSG2026 Golden Template, showing the EXACT density expected
4. **Business intelligence** — classification awareness, cross-border rules, notional thresholds (KEEP this — it's what makes the agent smart)
5. **Simpler output JSON** — just `{"fields": [{"field_key": "...", "value": "...", "lineage": "AUTO", "confidence": 95, "source": "..."}]}`

**What we REMOVE from each branch prompt:**
- The 200-line adaptation technique descriptions (techniques 1-5)
- The QA check descriptions (the LLM does QA naturally)
- The edge case handling (not needed in the prompt, handle in code)
- The "autofill_result" metadata envelope (compute this client-side)
- The `notional_flags`, `evergreen_flags`, `bundling_flags`, `pir_requirements` sections (compute client-side from input data)

**Estimated prompt reduction**: 400 lines → ~120 lines per branch

### Step 3: Update Merge Node

The Python merge code stays (it works after the trailing comma fix), but gets simpler because:
- Each branch outputs just `{"fields": [...]}` instead of complex nested structure
- Merge = concatenate 3 arrays into one
- No metadata to reconcile

### Step 4: Update Angular — Fix Field Mapping

**In `npa-template-editor.component.ts`:**

1. `tryParseLiveFields()` — Works as-is IF field_keys match (they will now)
2. `applyAutofillFields()` — Works as-is IF field_keys match
3. **Add section grouping to Live view** — Group `liveFields` by section using a lookup table

**In `npa-detail.component.ts`:**

1. `handleAgentResult('AUTOFILL', ...)` — Simplify JSON parsing (no more markdown fence detection needed if merge outputs clean JSON)
2. Add `localStorage.setItem()` for stream replay

### Step 5: Test & Validate

- Run the updated workflow in Dify
- Verify all 72 field_keys match
- Check latency: target < 3 min total
- Check field population: target 50+ of 72 fields filled in Doc/Form view
- Verify persistence across page reload

---

## WHAT STAYS vs WHAT CHANGES

### STAYS (proven working):
- 3 parallel LLM architecture in Dify
- SSE streaming via Express proxy
- `subscribeLiveStream()` event handling
- `tryParseLiveFields()` incremental parser
- `applyAutofillFields()` → `fieldMap.get(key)` pattern
- Live view card UI (lineage badge, confidence %, source)
- `npa_form_data` DB table schema
- Business intelligence in prompts (classification, cross-border, thresholds)
- Knowledge Retrieval node
- Python merge node (with trailing comma fix)

### CHANGES:
| What | Before | After |
|------|--------|-------|
| LLM branch prompts | 400 lines, no field_keys listed | ~120 lines each, exact field_keys embedded |
| Field_key source | LLM guesses | LLM uses exact keys from registry |
| Output verbosity | ~150 tokens/field (essays) | ~40 tokens/field (NPA-realistic density) |
| Branch balance | Uneven (B = bottleneck) | Even (~23 fields each) |
| Output JSON | Complex nested with metadata | Simple `{"fields": [...]}` |
| Merge complexity | Complex (metadata + arrays + flags) | Simple (concatenate 3 field arrays) |
| Live view | Flat list, random field names | Grouped by NPA section |
| Latency | ~8 min | Target < 3 min |
| Field match rate | 8/72 (11%) | 50+/72 (70%+) |
| Persistence | None | localStorage + DB |

---

## FIELD REGISTRY (Complete — 72 keys)

### LLM-A: Product Specs + Data + Other Risk (28 fields)

**Section I: Product Specifications**
| field_key | Label | Format |
|-----------|-------|--------|
| business_rationale | Purpose or Rationale for Proposal | 3-5 bullet points |
| product_name | Product/Service Name | Short name, 5-10 words |
| product_type | Product Type | Category label (e.g., "FX Forward", "IRS") |
| underlying_asset | Underlying Asset | Code or pair (e.g., "GBP/USD") |
| tenor | Tenor | Duration (e.g., "3 months", "5 years") |
| product_role | Role of PU | Short phrase (e.g., "Principal trader") |
| funding_type | Funding Type | "Funded" / "Unfunded" / "Hybrid" |
| product_maturity | Product Maturity | "Spot" / "1D-30Y" / "Perpetual" |
| product_lifecycle | Product Life Cycle | 3-4 phases, 1 line each |
| notional_amount | Expected Notional Amount | Number with currency |
| revenue_year1 | Revenue Year 1 | Dollar amount |
| revenue_year2 | Revenue Year 2 | Dollar amount |
| revenue_year3 | Revenue Year 3 | Dollar amount |
| target_roi | Target ROI | Percentage |
| spv_details | SPV Details | Entity name + jurisdiction, 1 line |
| customer_segments | Target Customer Segments | 3-5 segment names |
| distribution_channels | Channel Availability | 2-4 channels listed |
| sales_suitability | Sales Suitability | 2-4 bullet points |
| marketing_plan | Marketing & Communication Plan | 3-4 bullet points |
| pac_reference | PAC Conditions Reference | 1 line status |
| ip_considerations | External Parties / IP | Entity names + roles, 1-3 items |

**Section V: Data Management**
| field_key | Label | Format |
|-----------|-------|--------|
| data_privacy | Data Privacy | 1-2 sentences |
| data_retention | Data Retention | 1 sentence |
| gdpr_compliance | GDPR Compliance | 1 sentence |
| data_ownership | Data Ownership | 1 sentence |
| pure_assessment_id | PURE Assessment ID | Code (e.g., "PURE-FX-2026-001") |
| reporting_requirements | Risk Data Aggregation | 2-3 bullet points |

**Section VI: Other Risk**
| field_key | Label | Format |
|-----------|-------|--------|
| operational_risk | Other Operational Risk | 3-4 risk types, 1 line each |

### LLM-B: Ops & Tech + Pricing (23 fields)

**Section II: Operational & Technology**
| field_key | Label | Format |
|-----------|-------|--------|
| front_office_model | Front Office Operating Model | 1-2 sentences |
| middle_office_model | Middle Office Operating Model | 1-2 sentences |
| back_office_model | Back Office Operating Model | 1-2 sentences |
| booking_legal_form | Booking - Legal Form | Short (e.g., "ISDA Master Agreement") |
| booking_family | Booking - Family | Code (e.g., "IRD", "FXD", "CRY") |
| booking_typology | Booking - Typology | Code (e.g., "IRD_IRS_VANILLA") |
| portfolio_allocation | Portfolio Allocation | Code (e.g., "MBSSG_GFM_FX") |
| confirmation_process | Confirmation Process | 3-5 numbered steps |
| reconciliation | Reconciliation | 1-2 sentences |
| tech_requirements | System Requirements | 3-4 bullet points |
| booking_system | Booking System | System name (e.g., "Murex") |
| valuation_model | Valuation Model / Front Office System | 1-2 sentences |
| settlement_method | Settlement / Back End Systems | 1-2 sentences |
| iss_deviations | ISS Deviations | 1 sentence (often "No deviations") |
| pentest_status | Penetration Test Status | 1 sentence |
| hsm_required | HSM / Technology Resiliency | 1-2 sentences |

**Section III: Pricing Model**
| field_key | Label | Format |
|-----------|-------|--------|
| pricing_methodology | Pricing Methodology | 1-2 sentences |
| roae_analysis | ROAE Analysis | 1-2 sentences or "Not required" |
| pricing_assumptions | Pricing Assumptions | 2-3 bullet points |
| bespoke_adjustments | Bespoke Adjustments | 1 sentence or "None" |
| pricing_model_name | Model Name | Code/name |
| model_validation_date | Model Validation Date | Date string |
| simm_treatment | SIMM Treatment | 1-2 sentences |

### LLM-C: Risk Analysis + Appendices (21 fields)

**Section IV-A: Operational Risk (Legal)**
| field_key | Label | Format |
|-----------|-------|--------|
| legal_opinion | Legal Opinion | 1-2 sentences |
| primary_regulation | Primary Regulation | Regulation name + status |
| secondary_regulations | Secondary Regulations | 2-3 items |
| regulatory_reporting | Regulatory Reporting | 1-2 sentences |
| sanctions_check | Sanctions Check | 1 sentence |
| tax_impact | Tax Impact | 2-3 bullet points |

**Section IV-B: Market & Liquidity Risk**
| field_key | Label | Format |
|-----------|-------|--------|
| market_risk | Market Risk Assessment | 3-5 bullet points |
| risk_classification | Risk Classification | "Low" / "Moderate" / "High" |
| mrf_ir_delta | MRF - IR Delta | "Yes/No" for Applicable/VaR/Stress |
| mrf_ir_vega | MRF - IR Vega | "Yes/No" |
| mrf_fx_delta | MRF - FX Delta | "Yes/No" |
| mrf_fx_vega | MRF - FX Vega | "Yes/No" |
| mrf_eq_delta | MRF - Equity Delta | "Yes/No" |
| mrf_commodity | MRF - Commodity | "Yes/No" |
| mrf_credit | MRF - Credit | "Yes/No" |
| mrf_correlation | MRF - Correlation | "Yes/No" |
| liquidity_risk | Liquidity Risk | 2-3 bullet points |
| regulatory_capital | Regulatory Capital | 1-2 sentences |
| var_capture | VaR Capture | 1 sentence |

**Section IV-C: Credit Risk**
| field_key | Label | Format |
|-----------|-------|--------|
| credit_risk | Credit Risk Assessment | 3-4 bullet points |
| counterparty_default | Counterparty Default Mitigation | 2-3 bullet points |
| stress_scenarios | Stress Scenarios | 2-3 scenarios listed |
| custody_risk | Custody Risk | 1-2 sentences |
| counterparty_rating | Counterparty Rating | Rating code or "TBD" |

**Section IV-D: Reputational Risk**
| field_key | Label | Format |
|-----------|-------|--------|
| reputational_risk | Reputational Risk | 2-3 sentences |
| esg_assessment | ESG Assessment | 1-2 sentences |

**Appendix 3: Financial Crime**
| field_key | Label | Format |
|-----------|-------|--------|
| aml_assessment | AML Assessment | 1-2 sentences |
| terrorism_financing | Terrorism Financing | 1 sentence |
| sanctions_assessment | Sanctions Assessment | 1-2 sentences |
| fraud_risk | Fraud Risk | 1-2 sentences |
| bribery_corruption | Bribery & Corruption | 1 sentence |

**Appendix 5: Trading Products**
| field_key | Label | Format |
|-----------|-------|--------|
| collateral_types | Collateral Types | 1-2 items |
| valuation_method | Valuation Method | 1 sentence |
| funding_source | Funding Source | 1 sentence |
| booking_schema | Booking Schema | 1-2 sentences |

**TOTAL: 28 + 23 + 21+5+4 = ~72 fields** (some keys like `customer_segments`, `tech_requirements`, `settlement_method` appear in appendices too — these reuse the same key)

---

## LATENCY ESTIMATE (Revised)

With concise output (~40 tokens/field avg):

| Branch | Fields | Output Tokens | At 50 tok/sec | Estimated Time |
|--------|--------|---------------|---------------|---------------|
| LLM-A | 28 | ~1,120 | 22 sec | ~60-90 sec (with prompt processing) |
| LLM-B | 23 | ~920 | 18 sec | ~50-80 sec |
| LLM-C | 30 | ~1,200 | 24 sec | ~60-90 sec |
| **Total (parallel)** | — | — | — | **~90 sec wall-clock** |

Even with 2x safety margin: **~3 minutes total** vs current 8 minutes. The key insight is that **shorter output = faster generation**.

---

## IMPLEMENTATION ORDER

| # | Step | Effort | Changes Where |
|---|------|--------|--------------|
| 1 | Create field registry markdown | 30 min | New file: `Context/2026-02-22/AUTOFILL_Field_Registry.md` |
| 2 | Rewrite LLM-A prompt | 30 min | Dify Cloud > LLM-A node |
| 3 | Rewrite LLM-B prompt | 30 min | Dify Cloud > LLM-B node |
| 4 | Rewrite LLM-C prompt | 30 min | Dify Cloud > LLM-C node |
| 5 | Simplify merge node | 15 min | Dify Cloud > code_merge node |
| 6 | Test in Dify — verify output | 30 min | Dify Cloud > Run |
| 7 | Update Angular Live view grouping | 45 min | `npa-template-editor.component.ts` |
| 8 | Add persistence + replay | 30 min | `npa-detail.component.ts` + template editor |
| **TOTAL** | | **~4 hours** | |

---

## SUCCESS CRITERIA

- [ ] ALL output field_keys match Angular's 72-key registry exactly
- [ ] 50+ of 72 fields populate in Doc/Form view (70%+ coverage)
- [ ] Total wall-clock latency < 3 minutes
- [ ] Live view shows fields grouped by NPA section (I-VII + Appendices)
- [ ] Each field value has realistic NPA density (not essays)
- [ ] Fields persist to DB and survive page reload
- [ ] Stream replay works on editor reopen
- [ ] User sees "my NPA being filled" not "random LLM output"

---

*This plan keeps the 3-parallel-LLM architecture (proven necessary for latency), fixes the field_key mismatch (root cause of 11% match rate), and slashes output verbosity (root cause of 8-min latency).*
