# Pricing Model Documentation — Template for NPA (POC)
**Agent:** CF_NPA_FINANCE  
**Suggested Dify dataset:** `COO Command Center — Finance (Models)`  
**Last updated:** 2026-02-23

## Purpose
Standardise the minimum model evidence that Finance/Risk expects for a new product:
- how the product is priced and valued
- model assumptions and limitations
- model validation evidence and expiry controls

---

## 1) Minimum model pack (fill these)
- Product payoff definition (plain English + formula)
- Inputs required (curves, vol surfaces, spreads, correlations)
- Methodology (closed form / lattice / Monte Carlo / approximation)
- Calibration approach and data sources
- Validation status (who approved, date, expiry, conditions)
- Sensitivities (Delta/Vega/Greeks) and stress behavior
- Known limitations and fallback valuation method

---

## 2) Draft-ready output (NPA section template)
**Pricing & Valuation**
- Primary model: {name/version}
- Inputs: {…}
- Validation: {approved/pending} + {expiry date}
- Controls: {independent price verification, model governance}

