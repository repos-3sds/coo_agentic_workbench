# PDPA (Singapore) — Compliance Guidance for NPA Data Flows (POC)
**Agent:** CF_NPA_LCS  
**Suggested Dify dataset:** `COO Command Center — LCS (PDPA)`  
**Last updated:** 2026-02-23

## Purpose
Help the agent assess personal data implications for:
- new product onboarding flows
- new communications channels
- vendor integrations (cloud, analytics, screening, storage)

---

## 1) PDPA concepts the agent should apply
### Data mapping
Capture:
- what personal data is collected
- where it is stored and processed
- who has access (internal roles + vendors)
- cross-border transfers (locations)

### Purpose limitation and notification
Ensure the NPA describes:
- the purpose(s) for collection/use/disclosure
- how customers are informed (notices, terms)

### Accuracy, protection, retention
Require:
- access control + audit logging
- encryption in transit and at rest
- retention schedule + secure disposal procedure

### Cross-border transfers
Require:
- contractual and technical safeguards
- vendor due diligence and ongoing monitoring

---

## 2) Agent checklist for “PDPA-ready” NPA
- [ ] Identify whether any **personal data** is processed (including corporate contact details).
- [ ] Map all systems and vendors that touch the data.
- [ ] Identify whether data leaves Singapore and why.
- [ ] Specify safeguards (encryption, RBAC, logging, DLP where relevant).
- [ ] Specify retention + deletion policy.
- [ ] Specify incident response owner + notification path.

---

## 3) Draft-ready text (template)
**PDPA / Privacy**
- Data categories: {…}
- Processing locations: {…}
- Vendors/processors: {…}
- Safeguards: {encryption, RBAC, logging, retention}
- Cross-border: {contractual + technical controls}
- Owner: {role/team}

---

## References (authoritative)
- PDPC — Advisory Guidelines on Key Concepts in the PDPA: https://www.pdpc.gov.sg/Help-and-Resources/2020/02/Advisory-Guidelines-on-Key-Concepts-in-the-PDPA
- PDPC — Guide to Data Protection Practices: https://www.pdpc.gov.sg/Help-and-Resources/2020/01/Guide-to-Data-Protection-Practices

