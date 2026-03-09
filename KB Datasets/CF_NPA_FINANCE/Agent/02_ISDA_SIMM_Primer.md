# ISDA SIMM — Practical Primer for Agents (POC)
**Agent:** CF_NPA_FINANCE  
**Suggested Dify dataset:** `COO Command Center — Finance (Margins)`  
**Last updated:** 2026-02-23

## Purpose
Give agents enough context to:
- recognise when SIMM / initial margin may be relevant
- ask for the right margin artifacts
- document operational impacts (collateral, margin calls)

---

## 1) When SIMM matters in an NPA
Flag margin impacts if:
- OTC derivatives are traded with counterparties subject to margin rules
- product introduces new risk classes (rates, FX, credit, equity, commodity)
- collateral eligibility or CSA terms differ from existing products

---

## 2) Agent checklist (what to request)
- CSA/credit support terms (collateral types, thresholds, MTA, frequency)
- margin calculation approach (SIMM, schedule, internal)
- operational readiness for margin calls (process, systems, cutoffs)
- dispute management process

---

## References (authoritative)
- ISDA — Standard Initial Margin Model (SIMM) (entry point): https://www.isda.org/2013/10/16/standard-initial-margin-model-simm/

