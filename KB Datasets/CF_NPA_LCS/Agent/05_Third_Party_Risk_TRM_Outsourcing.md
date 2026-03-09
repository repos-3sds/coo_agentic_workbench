# Third‑Party Risk, Outsourcing & TRM Controls (POC)
**Agent:** CF_NPA_LCS  
**Suggested Dify dataset:** `COO Command Center — LCS (Third Party Risk)`  
**Last updated:** 2026-02-23

## Purpose
Guide decisions when an NPA introduces:
- new external vendors (screening, data, comms, cloud, analytics)
- material changes in vendor access scope
- outsourcing arrangements (operations performed by a third party)

---

## 1) What the agent must detect
Flag for Tech/Ops + LCS review if:
- vendor will process customer data
- vendor is in the critical path for booking/settlement/compliance checks
- vendor introduces concentration risk (single provider)
- vendor operates outside the booking jurisdiction

---

## 2) Minimum due diligence artifacts (agent checklist)
- [ ] vendor classification: critical / material / non-material
- [ ] service description + data flow diagram
- [ ] access model (RBAC, MFA, logging)
- [ ] security posture: encryption, key management, vulnerability management
- [ ] incident response + notification timelines
- [ ] exit plan + portability + escrow (if applicable)
- [ ] subcontractors list and controls

---

## 3) TRM control themes (high level)
- secure architecture and configuration baselines
- identity and access management
- logging/monitoring and incident management
- resilience and recovery (RTO/RPO; DR testing)

---

## References (authoritative)
- MAS — Technology Risk Management Guidelines (PDF): https://www.mas.gov.sg/-/media/MAS/Regulations-and-Financial-Stability/Regulatory-and-Supervisory-Framework/Risk-Management/TRM_Guidelines_18_Jan_2021.pdf

