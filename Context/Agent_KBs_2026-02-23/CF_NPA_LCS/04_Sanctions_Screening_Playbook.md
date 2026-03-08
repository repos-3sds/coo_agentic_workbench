# Sanctions Screening Playbook for NPA (POC)
**Agent:** CF_NPA_LCS  
**Suggested Dify dataset:** `COO Command Center — LCS (Sanctions)`  
**Last updated:** 2026-02-23

## Purpose
Make sanctions screening decisions consistent and auditable for NPAs:
- what lists to screen
- when to screen (pre-deal, periodic, event-driven)
- how to handle potential matches

## Important note
MBS-specific screening policy may be internal. This doc is a **policy-aligned template**; replace “MBS internal policy” sections with your official documents if available.

---

## 1) Sanctions list coverage (minimum)
Maintain capability to screen against:
- UN Security Council Consolidated List
- OFAC SDN (and relevant OFAC programs, as applicable)
- EU Consolidated Sanctions
- Local targeted financial sanctions list(s) relevant to booking entity

## 2) Screening moments (“when”)
- **Onboarding / relationship start**: initial screening
- **Pre-deal / pre-trade**: counterparty and ultimate beneficial owners
- **Periodic refresh**: daily/weekly batch depending on risk
- **Event-driven**: sanctions updates, adverse media triggers

## 3) Controls the agent should require for FULL_NPA
- system integration point (where screening happens)
- match handling workflow (who reviews, SLA, evidence captured)
- audit logs retained (queries + results + disposition)
- escalation to Compliance/Legal for true match or ambiguity

---

## 4) “Potential match” handling (agent decision tree)
1. **Stop** automated progression until disposition
2. Collect:
   - matched name / identifiers
   - counterparty details (DOB, registration, address, LEI)
   - transaction context (purpose, amount, jurisdictions)
3. Disposition outcomes:
   - **False positive** → record rationale, proceed
   - **True match** → reject/stop; escalate; record incident
   - **Inconclusive** → treat as high risk; escalate; require enhanced due diligence

---

## 5) Draft-ready text (template)
**Sanctions Screening Framework**
- Lists: {UN/OFAC/EU/local}
- Process: {pre-deal + periodic + event-driven}
- Tooling: {vendor/system}
- Disposition: {workflow + SLA + audit logs}
- Escalation: {roles}

---

## References (authoritative)
- OFAC — Sanctions Lists: https://ofac.treasury.gov/sanctions-lists
- EU — Sanctions Map / Consolidated list: https://www.sanctionsmap.eu/
- UN — Consolidated Sanctions List (entry point): https://www.un.org/securitycouncil/content/un-sc-consolidated-list
- MAS — Anti-Money Laundering / sanctions-related guidance entry point: https://www.mas.gov.sg/regulation/anti-money-laundering

