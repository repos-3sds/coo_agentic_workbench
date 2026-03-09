# MAS Notice 626 — AML/CFT Playbook for NPA (POC)
**Agent:** CF_NPA_LCS  
**Suggested Dify dataset:** `COO Command Center — LCS (AML/CFT)`  
**Last updated:** 2026-02-23

## What this is for
This KB helps the agent generate a consistent AML/CFT analysis in an NPA:
- identify AML/CFT risk drivers from the product description
- propose controls (KYC/EDD, transaction monitoring, screening)
- define escalation points and “hard stops”

## Important limitation
MAS Notice 626 is often accessed via MASNET. This doc is a practical summary + checklist; upload your official Notice PDF later and treat that as source-of-truth.

---

## 1) AML/CFT risk drivers to detect (from maker inputs)
### Customer / counterparty
- high-risk jurisdictions, sanctioned locations, secrecy havens
- PEP exposure, complex ownership structures, intermediaries
- new-to-bank counterparties or weak KYC history

### Product / transaction structure
- unusual cashflows, circular flows, layering patterns
- high velocity / high notional / short holding periods
- use of third parties (agents, introducers, platforms)

### Channel / delivery
- non-standard communications
- onboarding via digital-only channels
- reliance on external platforms for instructions

---

## 2) Controls checklist (agent outputs)
### Screening
- sanctions list screening (OFAC/EU/UN + local lists)
- name screening cadence: pre-deal + periodic refresh
- false positive resolution SLA + audit log

### KYC / EDD
- define required KYC level by segment (retail/HNW/corp/FI/institutional)
- specify triggers for EDD: PEP, high-risk country, complex structures

### Transaction monitoring
- define what scenarios to monitor (velocity, structuring, unusual counterparties)
- define thresholds (notional and frequency)

### Governance
- MLRO/Compliance approval required for exceptions and high-risk approvals

---

## 3) Draft-ready text blocks (use/adapt)
### AML assessment (template)
**AML/CFT Assessment Summary**
- Risk rating: {LOW|MEDIUM|HIGH}
- Key drivers: {jurisdiction, customer type, product structure, channel}
- Controls:
  - KYC/EDD: {…}
  - Screening: {…}
  - Monitoring: {…}
- Escalation: {MLRO/LCS sign-off required when …}

---

## 4) Acceptance criteria before launch (LCS gate)
- customer/counterparty screening controls implemented and tested
- ownership/beneficial owner process defined for target segments
- transaction monitoring scenarios defined and owned
- exception workflow defined (who can approve, what evidence required)

---

## References (authoritative)
- MAS — Notices and Guidelines (entry point; Notice 626 often via MASNET): https://www.mas.gov.sg/regulation/notices
- MAS — AML/CFT overview page: https://www.mas.gov.sg/regulation/anti-money-laundering

