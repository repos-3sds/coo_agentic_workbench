# Banking Act (Cap. 19, Singapore) — Key Obligations for NPA (POC)
**Agent:** CF_NPA_LCS  
**Suggested Dify dataset:** `COO Command Center — LCS (SG)`  
**Last updated:** 2026-02-23

## Purpose (what the agent uses this for)
Use this document to:
- flag **banking secrecy / disclosure** risks when an NPA involves client data sharing, third parties, cross-border transfers, or new tooling
- identify **record retention / audit readiness** implications
- guide the “**legal/compliance constraints**” section in the NPA draft (what must be true before launch)

## Non‑legal disclaimer
This is a **paraphrased** operational summary for an internal workflow assistant. Always confirm with Legal for final interpretation.

---

## 1) Common Banking Act triggers in NPA scenarios
An NPA should be flagged for Legal review if it introduces any of the below:
- new **data-sharing** with vendors (cloud, analytics, customer comms tools)
- cross-border booking or processing that moves **customer information** outside Singapore
- new **outsourcing arrangements** or material changes to a vendor’s access scope
- new distribution channels that change **customer communications** or recordkeeping obligations

---

## 2) Banking secrecy / customer information handling (operational summary)
Typical control expectations:
- minimize disclosure: only share what is required for the stated purpose
- implement access controls: role-based access, logging, and approval gates
- maintain an auditable trail: who accessed, what was shared, when, and why
- document lawful basis / contractual basis for any disclosure to third parties

### Agent output requirements (persist back to DB)
Populate (or update) these NPA fields when applicable:
- `data_privacy` (constraints, cross-border transfer controls)
- `third_party_ip_details` (vendor access scope + DPA clauses)
- `data_retention` (records categories + retention periods + owners)

---

## 3) Recordkeeping expectations (agent-ready checklist)
For any NPA involving trading/booking/communications:
1. Identify record categories:
   - trade lifecycle records
   - client instructions / communications
   - approvals and sign-off artifacts
   - surveillance / sanctions screening logs
2. Assign owners:
   - system of record owner (Tech/Ops)
   - compliance owner (LCS)
   - business owner (Desk)
3. Confirm controls:
   - immutability where needed
   - time sync, retention, and retrieval SLAs

---

## 4) “What to ask the maker” (minimal questions)
- What customer information is collected/processed?
- Which systems/vendors touch the data?
- Is data stored/transferred outside SG?
- Is any customer communication performed via non-standard channels?
- What is the retention and retrieval requirement?

---

## References (authoritative)
- Singapore Statutes Online — Banking Act 1970 (Singapore): https://sso.agc.gov.sg/Act/BA1970

