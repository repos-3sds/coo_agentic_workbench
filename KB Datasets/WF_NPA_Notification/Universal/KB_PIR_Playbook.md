# Post‑Implementation Review (PIR) Playbook (POC)
# Suggested Dify Dataset: "COO Command Center — Monitoring"

## Disclaimer (POC)
Mock PIR policy for agent guidance. Replace with official PIR standard.

---

## 1) PIR purpose
PIR validates that:
- the product operated as approved
- risk metrics stayed within declared tolerances
- required controls (ops/tech/legal) are in place
- conditions imposed at approval are satisfied or closed

---

## 2) PIR timing rules
- **Standard**: PIR due **6 months after launch**
- **High-risk** (risk_level = HIGH OR cross-border OR new vendor): PIR due **3 months after launch**
- **Conditional approvals**: PIR due at the earliest of:
  - 3 months after launch
  - when a condition deadline expires

---

## 3) PIR inputs (minimum evidence pack)
- product P&L summary and key drivers
- limit usage (VaR / Delta / Vega / credit exposure as applicable)
- incidents log (ops, settlement, compliance breaches)
- complaints and exception approvals
- reconciliation outcomes and breaks
- monitoring alerts triggered (threshold breaches)

---

## 4) PIR outputs
PIR must result in one of:
- **PASS**: no material issues, keep product active
- **PASS_WITH_ACTIONS**: actions required with owners + due dates
- **FAIL**: stop new business / suspend product; escalate

---

## 5) Repeat PIR rules
- If **FAIL** → repeat PIR in **30 days** after remediation.
- If **PASS_WITH_ACTIONS** with overdue actions → escalate and schedule follow-up in **30–60 days**.

