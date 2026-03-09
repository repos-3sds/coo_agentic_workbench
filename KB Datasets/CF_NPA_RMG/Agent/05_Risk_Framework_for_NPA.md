# Risk Framework for NPA — RMG Perspective (POC)
**Agent:** CF_NPA_RMG  
**Suggested Dify dataset:** `COO Command Center — RMG (Framework)`  
**Last updated:** 2026-02-23

## Purpose
Translate the business NPA process into a risk-control view the agent can apply consistently.

## Source context (internal)
This KB aligns with: `Archive/2026-02-18_Architecture_Gap_Analysis/NPA_Business_Process_Deep_Knowledge.md`.

---

## 1) Risk domains to cover
- Market risk
- Credit/counterparty risk
- Liquidity/funding risk
- Operational risk
- Legal/compliance risk
- Model risk (pricing, valuation, stress)
- Technology risk (availability, integrity)

---

## 2) Stage gates (what must be true)
### INITIATION
- classification confirmed (NTG/VAR/Existing)
- prohibited list screen completed

### REVIEW
- booking schema confirmed
- model and limit impacts assessed (directional at minimum)
- key documents identified (ISDA/CSA, term sheet)

### SIGN_OFF
- sign-offs routed based on risk triggers:
  - cross-border → include Legal/Compliance and local entity checks
  - new model → include model validation
  - new vendor → include TRM/outsourcing assessment

### LAUNCH
- controls are implemented (monitoring, screening, limit checks)
- fallback/rollback plan exists

### MONITORING
- PIR scheduled + conditions tracked

---

## 3) RMG deliverables the agent should request
- risk assessment summary (key drivers + mitigants)
- stress test summary
- capital / liquidity directional impact
- go/no-go constraints

