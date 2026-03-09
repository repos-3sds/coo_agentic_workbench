# NPA Policy Manual — Quick Reference for Business (POC)
**Agent:** CF_NPA_BIZ  
**Suggested Dify dataset:** `COO Command Center — Business`  
**Last updated:** 2026-02-23

## Purpose
Give business agents a crisp but comprehensive reference to:
- classify products (NTG / Variation / Existing)
- choose track (FULL_NPA / NPA_LITE / EVERGREEN / DEAL_SPECIFIC)
- understand governance gates (PAC, sign-offs, circuit breaker, PIR)

---

## Canonical internal references (already in this repo)
- Business deep knowledge (process): `Archive/2026-02-18_Architecture_Gap_Analysis/NPA_Business_Process_Deep_Knowledge.md`
- Classification criteria: `Context/Dify_KB_Docs/KB_Classification_Criteria.md`
- Product taxonomy: `Context/Dify_KB_Docs/KB_Product_Taxonomy.md`
- Prohibited items: `Context/Dify_KB_Docs/KB_Prohibited_Items.md`

---

## 1) Business classification (summary)
- **NTG**: new capability for the group → typically FULL_NPA + PAC gate
- **Variation**: risk profile change of existing capability → NPA_LITE or FULL_NPA depending on materiality
- **Existing**: already approved capability → EVERGREEN or reactivation path depending on dormancy/expiry

---

## 2) Minimum “maker input” expected
- product title + 2–3 sentence description
- target clients + jurisdictions
- indicative notional/volume
- booking location(s) and systems
- key dependencies (vendors, data sources)

