# MAS Notice 637 — Capital Adequacy (Banking Book / Trading Book) Overview (POC)
**Agent:** CF_NPA_RMG  
**Suggested Dify dataset:** `COO Command Center — RMG (Capital)`  
**Last updated:** 2026-02-23

## Purpose
Help the RMG agent:
- determine whether a proposed product changes capital requirements materially
- request the right Finance/Risk artifacts (RWA impact, model approvals, limits)
- populate `primary_regulation` / capital-related fields in the NPA draft

## Limitation
Official notice text may require MASNET access. This is an operational summary and should be paired with your official Notice PDF.

---

## 1) Capital impact signals (when to escalate)
- new asset class or new risk factor (capital model not configured)
- new booking treatment (trading book vs banking book)
- new counterparty types / collateral arrangements
- cross-border booking that changes consolidation or local requirements

---

## 2) Minimum capital artifacts to request
- RWA impact estimate (base + stressed)
- capital treatment rationale (standardised vs internal model)
- key assumptions (netting, collateral, hedges)
- limit monitoring plan (thresholds + owners)

---

## 3) Agent output checklist (draft-ready)
**Capital Adequacy**
- Applicable regime: MAS Notice 637 (and any additional, product-specific)
- Treatment summary: {standardised / internal model} + {trading/banking book}
- Estimated impact: {directional RWA / capital buffer implication}
- Preconditions before launch: {model approval, limits, monitoring}

---

## References (authoritative)
- MAS — Capital Adequacy (overview): https://www.mas.gov.sg/regulation/capital-adequacy-requirements
- MAS — Notices and Guidelines (entry point): https://www.mas.gov.sg/regulation/notices

