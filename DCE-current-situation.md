# DCE Account Opening & Operations — Current Situation Document

**Organisation:** ABS Bank — Treasury & Markets, Derivatives & Commodities Execution (DCE) Desk
**Document Purpose:** Discovery foundation for agentic AI solution design
**Status:** Discovery in progress — Pain Points, Compliance, Success Criteria, and Tech Landscape themes pending
**Last Updated:** 2026-02-28

---

## 1. ENGAGEMENT CONTEXT

| Item | Detail |
|---|---|
| Organisation | ABS Bank — Treasury & Markets |
| Desk | Derivatives & Commodities Execution (DCE) |
| Primary Focus | DCE Account Opening + Account Maintenance |
| Secondary Areas | Pipeline Management, Product Registry, Trade Management, Back Office Operations |
| Ground Rule | No solution design until "Now design the solution" is explicitly stated |
| UX Screens Provided | Reference only — used to understand process steps, data fields, document logic, and team touchpoints. NOT a design target or specification to replicate. |

---

## 2. SCOPE — 6 BUSINESS AREAS

| # | Area | Sub-Processes |
|---|---|---|
| 1 | **Pipeline Management** | Identify prospect customer; Customer Engagement (requirements, commission, GTA addendums) |
| 2 | **Account Opening** | End-to-end corporate account opening workflow |
| 3 | **Account Maintenance** | Authorised Traders List; Funds Deposit; Funds Withdrawal; Customer Limit Management |
| 4 | **Product Registry** | Enable new exchange-traded products for customers |
| 5 | **Trade Management** | Split & Allocation; Manual Trade Key-in; Trade Amendments |
| 6 | **Back Office Operations** | Trade Reconciliation; Statement Distribution; Margin Call Notifications; Contract Setup in back office system |

> **Primary focus for solution build:** Account Opening + Account Maintenance
> **Future scope:** All 6 areas above

---

## 3. SCALE & VOLUME

| Metric | Value |
|---|---|
| Active customers | 650+ |
| Daily trade volume | 20,000 – 25,000 trades |
| New account openings per month | 15 – 20 |
| End-to-end account opening time | 3 – 15 days (highly variable) |

---

## 4. TEAMS & PERSONAS

*(Source: T&M DCE Bank Personas Matrix)*

| Team | Account Opening Role | Other Key Responsibilities |
|---|---|---|
| **FO – Sales Dealer** | Initiates process: collects docs from customer, submits application, determines applicable document schedules | Product Registry approval |
| **FO – Execution Dealer** | No account opening role | Order execution (trade domain) |
| **RM (IBG/CBO)** | KYC, document verification, CDD/BCAP clearance, Credit Assessment initiation | — |
| **COO – Desk Support** | Primary human orchestrator: doc verification, signature verification, coordinates all teams, tracks physical copy compliance | Product Registry: engages PDD team, seeks LCS/Credit/Risk approval |
| **COO – Client Services** | Account opening support, Authorised Traders management, Limit Management (off-hours US exchange) | Trade: amendments, enable trade, trade simulation in SIC |
| **TMO – Static Team** | Creates account in UBIX, maintains static data, maps to SIC/CV | Contracts setup in SIC |
| **TMO – DCE Ops** | Funds Withdrawal/Deposit | EOD processing, reconciliation, workflow monitoring |
| **Credit** | Assigns DCE Limit + DCE-PCE Limit, creates CQG login, enables IDB platforms, updates CLS | Product Registry: reviews/approves/keys in products in UBIX |
| **Finance** | Role not yet detailed | — |
| **Tech Support** | Role not yet detailed | — |

---

## 5. CURRENT STATE INFRASTRUCTURE

> **No workflow system exists today. The entire process is email-driven. Data is stored in Excel and SharePoint.**

### Internal Systems Referenced (All Downstream — None Orchestrating)

| System | Purpose | Owner |
|---|---|---|
| **UBIX** | Static data management — account creation | TMO Static |
| **CQG** | Trading platform — login creation | Credit |
| **CLS** | Central Limit System — limit updates | Credit |
| **SIC** | Trade simulation + contract data | TMO Static / COO Client Services |
| **CV** | Contract/static data mapping | TMO Static |
| **IDB Platforms** | Inter-Dealer Broker platforms — enabled for customer | Credit |
| **SharePoint** | Document storage — soft copies of all account documents and signatures | COO Desk Support |
| **Excel** | Manual case tracking, ageing, SLA monitoring | COO Desk Support |

---

## 6. END-TO-END ACCOUNT OPENING WORKFLOW — CURRENT STATE

```
Step 1 — Sales Dealer
  ├─ Engages customer, understands requirements
  ├─ Determines applicable document schedules (based on product needs)
  ├─ Guides customer through filling documents
  └─ Collects all documents → forwards to COO Desk Support

Step 2 — COO Desk Support
  ├─ Reviews documents against checklist
  ├─ Verifies completeness
  ├─ Verifies signatures against signatory's ID document
  ├─ Confirms signing authority against company mandate
  └─ Sends to RM

Step 3 — RM (IBG/CBO)
  ├─ Conducts KYC
  ├─ CDD clearance
  ├─ BCAP clearance
  └─ Recommends Credit Assessment Approach (IRB or SA) + DCE Limit / DCE-PCE Limit

Step 4A — Credit Team (runs in parallel with Step 4B)
  ├─ Assigns DCE Limit + DCE-PCE Limit
  ├─ Updates CLS
  ├─ Creates CQG login
  └─ Enables IDB platforms

Step 4B — TMO Static (runs in parallel with Step 4A)
  ├─ Creates account in UBIX
  ├─ Updates static data in CV
  └─ Maps to SIC

Step 5 — COO Desk Support
  └─ Sends Welcome Kit to customer (once Steps 4A + 4B are both complete)
```

**Key Coordination Issue:** Steps 4A and 4B run concurrently but are coordinated only via email. No parallel task visibility. COO Desk Support is the single human orchestrator tracking all streams.

---

## 7. PROCESS BOUNDARY — PIPELINE MANAGEMENT → ACCOUNT OPENING

Pipeline Management is a preceding process. Its **final step** is Document Checklist creation.
Account Opening begins immediately after.

```
Pipeline Management
  └─ Customer engagement (requirements, commission, GTA addendums)
  └─ LAST STEP: Document Checklist generated based on customer requirements
        ↓
Account Opening begins (checklist already defined)
```

**Future state implication:** Once Pipeline Management is built, the system will already hold customer product requirements data. This enables **automatic checklist generation** at the start of Account Opening — no manual schedule determination needed.

---

## 8. DOCUMENT CHECKLIST LOGIC

### Mandatory Documents (All Customers)

| Document | Notes |
|---|---|
| Corporate/Institution Application Form | ALL customers |
| Schedule 1 — Risk Disclosure (SFA / SFR Rg 10) | ALL customers |
| Schedule 2 — Risk Disclosure (Commodity Trading Act) | ALL customers |
| Schedule 3 — Execution Only Form | ALL customers |
| Schedule 4 — Formal Consent to Take Other Side of Order | ALL customers |
| Schedule 5 — Authorisation for Auto-Conversion of Currency | ALL customers |
| Schedule 10 — Consent to Receive Statements Electronically | ALL customers |
| Schedule 11A — Authorisation for Electronic Instructions | ALL customers |
| Schedule 12 — Registration of Bank Accounts for Fund Transfers | ALL customers |

### Conditional Documents (Based on Product Requirements)

| Document | Condition |
|---|---|
| Schedule 7A — Registration & Clearing for Exchange-Listed Contracts | Exchange-listed clearing customers only. Customer must be ECP (Eligible Contract Participant) for US exchanges. |
| Schedule 8A — LME Futures & Options Information | LME contract customers only. Requires LEI code, account category, email for LME position notifications. Customer must be Accredited Investor (MAS definition). |
| Schedule 9 — Terms for Deliverable Contracts | Deliverable contract customers only. Customer principally liable for physical delivery obligations. |

### Additional Non-Schedule Documents

| Category | Documents |
|---|---|
| ID Proofs | Identification Documents, Residential Proofs |
| General Trading Agreement | GTA (full document), GTA-Addendum (if applicable) |
| Account Opening Form | Account Opening Form, Terms & Conditions |
| RM Review – Additional | CDD Clearance Doc, BCAP Clearance, ACRA/Certificate of Incumbency, Min 2 Key Directors ID, UBO/Guarantor ID |

### Schedule Determination — Current vs Future

| State | How Schedules Are Determined |
|---|---|
| **Current** | Sales Dealer decides manually based on customer product requirements discussed during engagement. Errors are rare — Sales Dealer works closely with customer. |
| **Future (post-Pipeline Management)** | Auto-generated from customer requirements data already captured in Pipeline Management module. |

---

## 9. PHYSICAL vs DIGITAL COPY HANDLING

### Policy

- **Processing begins on soft/digital copies** — account opening does NOT wait for physical originals
- **Physical originals are still a compliance obligation** — must be submitted and tracked
- Physical copies are tracked and managed by **COO Desk Support**
- Physical copies are **not a hard gate** to account go-live

### Document Statuses Tracked Per Document

| Status Type | Values |
|---|---|
| Digital Status | Pending / Updated |
| Physical Copy | Pending / Received |

### Verification Requirements for Physical Copies

Signatures must be witnessed/verified by:
- ABS/POSB staff
- Advocate & Solicitor
- Notary Public
- Commissioner for Oaths
- Member of Judiciary
- Embassy/Consulate

Supporting documents must be certified as true copy on first page by:
- Company Secretary/Director
- Advocate & Solicitor
- Notary Public (etc.)

---

## 10. SIGNATURE MANAGEMENT — CURRENT STATE & FUTURE REQUIREMENT

### Signature Verification at Account Opening

| Verification Type | Detail |
|---|---|
| **Against ID document** | Signature on application form/docs verified against signatory's ID document |
| **Signing authority** | Confirmed that signatory is an authorised director per company mandate |

**Current process:** COO Desk Support performs visual manual comparison.

### Signature Storage Today

- Soft copies of all documents stored in **SharePoint**
- No dedicated signature repository — signatures are embedded in stored documents

### Signature Reuse — Future Touchpoints

| Future Touchpoint | How Signature Is Used |
|---|---|
| **Funds Withdrawal** | Withdrawal instruction arrives with authorized person's signature → support unit manually compares against stored soft copy in SharePoint |
| **Authorised Traders** | Mandate letter verified to confirm it was signed by the right authorised signatories of the company |

### Agentic Solution Design Requirement

- Agent must **scan and review documents** including signature extraction
- Agent must **verify signature accuracy** against stored ID document/signatory records
- Agent must **persist verified signatures** linked to customer profile for reuse
- **Human-in-the-loop is mandatory:** Agent presents match accuracy/confidence score → Human reviewer makes final approval decision
- AI assists, human decides — this is a non-negotiable design principle for signature verification

---

## 11. AUTHORISED TRADERS MANAGEMENT

- Customer submits a **mandate letter** listing authorised traders
- COO Desk Support manually extracts trader details from mandate letter today
- **UX design envisions AI/OCR extraction** — auto-populate trader table (Full Name, ID No./Passport No., Designation, Onboarding Status)
- Signature on mandate letter verified against authorised company signatories

---

## 12. AGEING & SLA TRACKING — CURRENT STATE

| Item | Current State |
|---|---|
| Ageing visibility | Exists — tracked manually in Excel |
| SLA alerts | None — no automated alerts or escalations |
| Case status visibility | No system — status known only to whoever sent the last email |
| Target (future) | Real-time ageing counter per case, SLA breach alerts |

---

## 13. KEY DOCUMENTS — SUMMARY

| Document | Key Details |
|---|---|
| **GTA** (General Trading Agreement) | Updated 16 Nov 2021, 30 pages. 4 sections: A (General Terms), B (Futures/OTC), C (Electronic Services), D (Definitions) + Risk Disclosure Schedule. Governs all clearing & execution services. |
| **Schedule 7A** | Exchange-listed contract clearing via ABS or IDB. Customer must be ECP for US exchanges. IDB is customer's appointed agent. |
| **Schedule 8A** | LME-specific. Requires LEI code, account category classification, email for LME position notifications. Customer must be Accredited Investor (MAS definition). |
| **Schedule 9** | Deliverable contracts. Customer principally liable for physical delivery obligations. |
| **Schedule 11A** | Authorises ABS to act on electronic instructions (fax, email, etc.) from customer. |
| **DCE Corporate Account Opening Form** | Version 02.20/09.19, Updated Nov 2021. Inline notes per schedule indicate applicability conditions. |

---

## 14. INFERRED PAIN POINTS — PENDING VALIDATION

*(To be validated in Theme 5 discovery — Pain Points & Failure Modes)*

| # | Pain Point | Area |
|---|---|---|
| 1 | No workflow system — all coordination via email. No audit trail, no SLA tracking. | All |
| 2 | COO Desk Support is the single human orchestrator — creates bottleneck and bandwidth dependency | Account Opening |
| 3 | 3–15 day range on account opening — no visibility into where delay is occurring, no case management | Account Opening |
| 4 | Dual physical + digital tracking — two separate processes to manage, risk of misalignment | Document Management |
| 5 | Manual schedule determination — no rule engine (partially mitigated by Sales Dealer's customer knowledge) | Document Management |
| 6 | Manual Authorised Trader extraction from mandate letter — time-consuming, error-prone | Account Maintenance |
| 7 | Manual reminder emails — no automated follow-up or escalation | All |
| 8 | No ageing/SLA tracking system — only informal Excel, no alerts | All |
| 9 | Parallel Credit + TMO Static coordination via email only — no parallel task visibility | Account Opening |
| 10 | Signature verification is fully manual — no AI assistance, no persistent signature store, SharePoint-based retrieval is ad hoc | Document Management |

---

## 15. DISCOVERY THEMES — STATUS

| Theme | Status |
|---|---|
| 1. Business Process & Current State | Complete |
| 2. People, Teams & Systems | Complete |
| 3. Data, Documents & Flows | Complete |
| 4. Decisions & Decision-Makers | Partially covered — needs dedicated exploration |
| 5. Pain Points & Failure Modes | Inferred — pending validation with user |
| 6. Regulatory & Compliance Constraints | Not yet explored |
| 7. Success Criteria & What Good Looks Like | Not yet explored |
| 8. Technology Landscape | Not yet explored |

---

*End of document — updated as discovery progresses*
