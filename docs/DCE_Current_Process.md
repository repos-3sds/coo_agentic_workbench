# DCE Account Opening — Current Process & Discovery Document

**Organisation:** ABS Bank — Treasury & Markets, Derivatives & Commodities Execution (DCE) Desk
**Document Purpose:** Discovery foundation for agentic AI solution design
**Status:** Discovery COMPLETE — all 8 themes explored
**Last Updated:** 2026-02-28

---

## 1. ENGAGEMENT CONTEXT

| Item | Detail |
|---|---|
| Organisation | ABS Bank — Treasury & Markets |
| Desk | Derivatives & Commodities Execution (DCE) |
| Primary Focus | DCE Account Opening (initial build scope) |
| Design Awareness | Full 6-area scope — architecture must be extensible from day one |
| Ground Rule | No solution design until "Now design the solution" is explicitly stated |
| UX Screens Provided | Reference only — used to understand process steps, data fields, document logic, and team touchpoints. NOT a design target or specification to replicate. |

---

## 2. SCOPE — 6 BUSINESS AREAS

| # | Area | Sub-Processes | Scope Status |
|---|---|---|---|
| 1 | **Pipeline Management** | Identify prospect customer; Customer Engagement (requirements, commission, GTA addendums) | Future — feeds into Account Opening |
| 2 | **Account Opening** | End-to-end corporate + retail account opening workflow | **Primary build scope** |
| 3 | **Account Maintenance** | Authorised Traders List; Funds Deposit; Funds Withdrawal; Customer Limit Management | Future — architecture must support |
| 4 | **Product Registry** | Enable new exchange-traded products for customers | Future |
| 5 | **Trade Management** | Split & Allocation; Manual Trade Key-in; Trade Amendments | Future |
| 6 | **Back Office Operations** | Trade Reconciliation; Statement Distribution; Margin Call Notifications; Contract Setup in back office system | Future |

### Process Boundary — Pipeline Management → Account Opening

Pipeline Management is the preceding process. Its **final step** is Document Checklist creation. Account Opening begins immediately after.

```
Pipeline Management
  └─ Customer engagement (requirements, commission, GTA addendums)
  └─ LAST STEP: Document Checklist generated based on customer requirements
        ↓
Account Opening begins (checklist already defined)
```

**Future state implication:** Once Pipeline Management is built, the system will already hold customer product requirements data. This enables **automatic checklist generation** at the start of Account Opening — no manual schedule determination needed.

---

## 3. CUSTOMER TYPES SERVED BY DCE DESK

| Customer Type | Account Opening Notes |
|---|---|
| **Corporate / Institutional** | Primary volume — GTA, schedules, company mandate, authorised traders |
| **Retail Investors** | Also falls under DCE desk scope. Additional risk disclosure agreements required before any trading activity (MAS requirement) |

---

## 4. SCALE & VOLUME

| Metric | Value |
|---|---|
| Active customers | 650+ |
| Daily trade volume | 20,000 – 25,000 trades |
| New account openings per month | 15 – 20 |
| End-to-end account opening time | 3 – 15 days (highly variable) |

---

## 5. TEAMS & PERSONAS

*(Source: T&M DCE Bank Personas Matrix)*

| Team | Account Opening Role | Other Key Responsibilities |
|---|---|---|
| **FO – Sales Dealer** | Initiates process: collects docs from customer, submits application, determines applicable document schedules, guides customer through filling documents | Product Registry approval |
| **FO – Execution Dealer** | No account opening role | Order execution (trade domain) |
| **RM (IBG/CBO)** | KYC, document verification, CDD/BCAP clearance, Credit Assessment initiation | — |
| **COO – Desk Support** | Primary human orchestrator: doc verification, signature verification, coordinates all teams, tracks physical copy compliance, manages functional email inbox | Product Registry: engages PDD team, seeks LCS/Credit/Risk approval |
| **COO – Client Services** | Account opening support, Authorised Traders management, Limit Management (off-hours US exchange) | Trade: amendments, enable trade, trade simulation in SIC |
| **TMO – Static Team** | Creates account in UBIX, maintains static data, maps to SIC/CV | Contracts setup in SIC |
| **TMO – DCE Ops** | Funds Withdrawal/Deposit | EOD processing, reconciliation, workflow monitoring |
| **Credit** | Assigns DCE Limit + DCE-PCE Limit, creates CQG login, enables IDB platforms, updates CLS | Product Registry: reviews/approves/keys in products in UBIX |
| **Finance** | Role not yet detailed | — |
| **Tech Support** | Role not yet detailed | — |

---

## 6. CURRENT STATE INFRASTRUCTURE

> **No workflow system exists today. The entire process is email-driven. Data is stored in Excel and SharePoint.**

### Internal Systems Referenced (All Downstream — None Orchestrating)

| System | Purpose | Owner | Integration Type |
|---|---|---|---|
| **UBIX** | Static data management — account creation | TMO Static | Kafka (streaming) |
| **CQG** | Trading platform — login creation | Credit | Kafka (streaming) |
| **CLS** | Central Limit System — limit updates | Credit | Kafka (streaming) |
| **SIC** | Trade simulation + contract data | TMO Static / COO Client Services | Kafka (streaming) |
| **CV** | Contract/static data mapping | TMO Static | API |
| **IDB Platforms** | Inter-Dealer Broker platforms — enabled for customer | Credit | Kafka (streaming) |
| **SharePoint** | Document storage — soft copies of all account documents and signatures | COO Desk Support | — |
| **Excel** | Manual case tracking, ageing, SLA monitoring | COO Desk Support | — |
| **Functional Email (Outlook/Exchange)** | Single entry point for ALL inbound documents (both customer-emailed soft copies and Desk Support scanned physical copies). No programmatic access today. | COO Desk Support | To be built (Microsoft Graph API / EWS) |

---

## 7. END-TO-END ACCOUNT OPENING WORKFLOW — CURRENT STATE

```
Step 1 — Sales Dealer
  ├─ Engages customer, understands requirements
  ├─ Determines applicable document schedules (based on product needs)
  ├─ Guides customer through filling documents
  └─ Collects all documents → forwards to COO Desk Support via functional email

Step 2 — COO Desk Support
  ├─ Reviews documents against checklist
  ├─ Verifies completeness
  ├─ Verifies signatures against signatory's ID document (eyeball check)
  ├─ Confirms signing authority against company mandate
  ├─ If uncertain about signature → calls customer to clarify
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
  └─ Sends Welcome Kit to customer ONLY when Steps 4A + 4B are BOTH confirmed complete
```

### Key Process Characteristics

- **Steps 4A and 4B run concurrently** but coordination is entirely via email — no parallel task visibility
- **Welcome Kit is a hard gate** — only sent after all parallel streams confirmed complete; no exceptions
- **COO Desk Support is the single human orchestrator** tracking all streams
- **Physical documents:** Some customers send physical docs only → Desk Support scans → emails to functional email ID → processes from there

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

### Retail Investor — Additional Requirement

| Document | Condition |
|---|---|
| Additional Risk Disclosure Agreements | Required for retail investors before any trading activity — MAS mandated |

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

### Inbound Document Flow

```
Channel 1: Customer emails soft copies → Functional Email ID (Outlook/Exchange)
Channel 2: Customer sends physical docs → Desk Support scans → Same Functional Email ID

Both channels converge at the SAME functional email inbox.
```

### Document Statuses Tracked Per Document

| Status Type | Values |
|---|---|
| Digital Status | Pending / Updated |
| Physical Copy | Pending / Received |

### Verification Requirements for Physical Copies

**Signatures must be witnessed/verified by:**
- ABS/POSB staff
- Advocate & Solicitor
- Notary Public
- Commissioner for Oaths
- Member of Judiciary
- Embassy/Consulate

**Supporting documents must be certified as true copy on first page by:**
- Company Secretary/Director
- Advocate & Solicitor
- Notary Public (etc.)

---

## 10. SIGNATURE MANAGEMENT

### Signature Verification at Account Opening

| Verification Type | Detail |
|---|---|
| **Against ID document** | Signature on application form/docs verified against signatory's ID document |
| **Signing authority** | Confirmed that signatory is an authorised director per company mandate |
| **Current method** | Manual eyeball check by COO Desk Support |
| **When uncertain** | Desk Support calls customer to clarify; approves only if satisfied with response |

### Signature Storage Today

- Soft copies of all documents stored in **SharePoint**
- No dedicated signature repository — signatures are embedded in stored documents
- Retrieval is ad-hoc — Desk Support searches SharePoint manually when needed

### Signature Reuse — Future Touchpoints (Architecture Must Support)

| Future Touchpoint | How Signature Is Used |
|---|---|
| **Funds Withdrawal** | Withdrawal instruction arrives with authorized person's signature → support unit manually compares against stored soft copy in SharePoint |
| **Authorised Traders** | Mandate letter verified to confirm it was signed by the right authorised signatories of the company |

### Agentic Solution Design Requirement — Signature

| Requirement | Detail |
|---|---|
| Document scanning & review | Agent must scan, OCR, and review all submitted documents |
| Signature extraction | Agent must extract signatures from submitted documents |
| Signature verification | Agent must verify extracted signature against stored ID document/signatory records and present **match accuracy/confidence score** |
| Signature persistence | Verified signatures must be stored, linked to customer profile, and accessible for future reuse (funds withdrawal, authorised traders, etc.) |
| **Human-in-the-loop** | **MANDATORY** — Agent presents accuracy score → Human reviewer makes final approval decision. AI assists, human decides. This is a non-negotiable design principle. |

---

## 11. AUTHORISED TRADERS MANAGEMENT

| Aspect | Detail |
|---|---|
| Source document | Customer submits a mandate letter listing authorised traders |
| Current extraction | COO Desk Support manually extracts trader details from mandate letter |
| Processing time | 5–15 minutes per customer |
| Typical trader count | 2–5 authorised traders per customer |
| Signature check | Mandate letter must be signed by authorised company signatories |
| Future state (from UX reference) | AI/OCR extraction — auto-populate trader table (Full Name, ID No./Passport No., Designation, Onboarding Status) |

---

## 12. AGEING, SLA & PRIORITY MANAGEMENT — CURRENT STATE

| Item | Current State |
|---|---|
| Ageing visibility | Tracked manually in Excel by Desk Support |
| SLA targets | **None** — no formally agreed SLA for account opening |
| Priority mechanism | Informal — Sales Dealer communicates urgency through **email tone** only. No structured flag or queue management. |
| Escalation path | Desk Support → DCE Sales Desk Head (manual, only when Desk Support decides to escalate) |
| Automated alerts | None |
| Follow-up process | Manual emails sent by Desk Support — no automation |

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

## 14. VALIDATED PAIN POINTS (Account Opening Scope)

| # | Pain Point | Severity | Detail |
|---|---|---|---|
| 1 | **No workflow system — all email coordination, no audit trail** | Critical | Entire process runs via email. No system of record, no case management. |
| 2 | **Zero case visibility for Sales and Customer** | Critical | When delayed, Sales and customer only see elapsed time. Actual bottleneck (missing doc, pending approval, credit backlog) is invisible. |
| 3 | **Delay = direct revenue loss** | Critical | Customers wanting to trade on market opportunities cannot act until account is open. Delay means missed trades and potential customer attrition to competitors. |
| 4 | **No parallel stream tracking** | High | Credit and TMO Static work concurrently but coordination is blind. No visibility into which stream is blocking. |
| 5 | **COO Desk Support bandwidth is already a constraint** | High | Small team, single orchestrator role. Backup exists for leave but capacity is already stretched at 15–20 accounts/month. |
| 6 | **No priority management mechanism** | High | Urgency communicated through email tone only. No structured flag, no queue management, no SLA. No guarantee priority cases move faster. |
| 7 | **Functional email is single unprocessed entry point** | High | All inbound documents (soft copies + physical scans) arrive at one email inbox with no automated triage, classification, or processing. |
| 8 | **Signature verification is manual and subjective** | Medium | Eyeball check with no standardisation. When uncertain, Desk Support calls customer — adds time and subjectivity. |
| 9 | **Escalation is informal** | Medium | Desk Support manually decides when to escalate to DCE Sales Desk Head. No trigger, no threshold. |
| 10 | **Incomplete document submissions handled inconsistently** | Low | Rare but happens. Notification to customer goes through either Desk Support or Sales Dealer — no defined channel. |

### Business Impact Statement

> **Account opening delay = missed trading opportunity = lost revenue + customer attrition risk.** This is the primary business driver. Speed and visibility are not just operational improvements — they are revenue levers.

---

## 15. REGULATORY & COMPLIANCE CONSTRAINTS

| Item | Finding |
|---|---|
| **Primary regulator** | MAS (Monetary Authority of Singapore) — sole regulatory body governing DCE account opening |
| **Exchange-specific regulations** | None directly governing account opening process |
| **Retail investors** | Fall under DCE desk scope. Additional risk disclosure agreements required before any trading activity (MAS mandated) |
| **KYC/CDD timelines** | No MAS-mandated deadlines — internally driven |
| **Document retention** | No specific MAS requirements on retention duration or format (physical vs digital) |
| **Audit trail** | Required — full evidence chain for internal and external audit readiness. Must capture: action + actor + timestamp + evidence (document version, signature confidence score, AI outputs) + outcome. Every step must produce an immutable, auditable record. |
| **Data residency** | Private cloud only — sensitive customer data. No public cloud. |
| **LLM usage** | Claude family + Gemini family deployed within ABS internal environment. Not calling external APIs. |

---

## 16. SUCCESS CRITERIA

### North Star

> **"No customer misses a market opportunity because their account isn't open."**

### Speed Target

- **Instant / real-time** — elapsed time driven only by actual decision time, not coordination overhead
- The 3–15 day range today is almost entirely coordination overhead, not actual work time
- The agentic solution eliminates that overhead

### Visibility Target

| Persona | Visibility Level |
|---|---|
| **COO Desk Support** | Full operational view — all cases, all steps, all teams |
| **Sales Dealer** | Portfolio view — real-time status per case |
| **Customer** | Email-only — proactive status updates at key milestones. Sales Dealer answers queries with real-time Workbench data. Future: customer portal. |

### Metrics Dashboard

| Metric | Target Direction |
|---|---|
| End-to-end account opening time | Minutes (from complete document submission to account live) |
| Cases completed per week/month | Track throughput growth |
| Average time per step | Identify remaining bottlenecks |
| % of cases with zero manual chasing | Measure automation effectiveness |
| Document completeness at first submission | Measure upstream quality |
| Signature verification turnaround | Seconds (AI) + minutes (human approval) |
| Ageing — cases open > 24 hours | Should trend to zero |
| Customer email response time | Time from milestone to customer email notification |
| Audit completeness score | 100% — every case fully traceable |

---

## 17. TECHNOLOGY LANDSCAPE

### Full Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | Angular | Brand new "Agentic Workbench" application |
| **Backend APIs** | Java + Spring Boot | All backend API services |
| **MCP Tools** | Python | Model Context Protocol tools for AI agents |
| **AI Platform** | Dify (on-premises) | Handles LLM access, auth, rate limiting, logging. Active use for other solutions. No established patterns/standards yet. No AI gateway — solution should address. |
| **LLMs** | Claude family + Gemini family | All models available. Deployed within ABS internal environment. |
| **Structured Data** | MariaDB | Case management, status, approvals, audit trail |
| **Document Storage** | MongoDB | Scanned docs, signatures, PDFs |
| **Container Orchestration** | OpenShift | Deployment platform |
| **Event Streaming** | Kafka | Real-time integration with downstream systems |
| **Email Platform** | Outlook / Exchange | Single entry point for documents. No programmatic access today — integration must be built (Microsoft Graph API / EWS). |

### Downstream System Integration Map

| System | Integration Type |
|---|---|
| UBIX | Kafka (streaming) |
| CQG | Kafka (streaming) |
| CLS | Kafka (streaming) |
| SIC | Kafka (streaming) |
| CV | API |
| IDB Platforms | Kafka (streaming) |

---

## 18. KEY DESIGN PRINCIPLES ESTABLISHED

| # | Principle | Detail |
|---|---|---|
| 1 | **Human-in-the-loop for signatures** | AI presents confidence score → Human makes final approval. Non-negotiable. |
| 2 | **Single email entry point** | Functional email (Outlook/Exchange) is the convergence point for all inbound documents — key integration hook. |
| 3 | **Architecture for extensibility** | Build for Account Opening first, but design to support all 6 business areas from day one. |
| 4 | **UX screens are reference only** | Solution design will be shaped by discovery, not by replicating existing UX mockups. |
| 5 | **Pipeline Management handoff** | Account Opening receives a pre-built document checklist from Pipeline Management. Future auto-generation is a design goal. |
| 6 | **Audit-ready by design** | Every action, decision, and approval must be traceable with full evidence chain — not an afterthought. |
| 7 | **Private cloud only** | All data and AI processing stays within ABS internal environment. No external API calls. |
| 8 | **AI assists, human decides** | For all critical decisions (signatures, approvals), AI provides analysis and confidence — human makes the final call. |

---

## 19. DISCOVERY THEMES — FINAL STATUS

| Theme | Status |
|---|---|
| 1. Business Process & Current State | **Complete** |
| 2. People, Teams & Systems | **Complete** |
| 3. Data, Documents & Flows | **Complete** |
| 4. Decisions & Decision-Makers | **Complete** — covered within process workflow |
| 5. Pain Points & Failure Modes | **Complete** — validated |
| 6. Regulatory & Compliance Constraints | **Complete** |
| 7. Success Criteria & What Good Looks Like | **Complete** |
| 8. Technology Landscape | **Complete** |

---

**DISCOVERY IS COMPLETE.**

This document serves as the foundation for all subsequent solution design. No solution design will begin until the explicit instruction: **"Now design the solution."**

---

*End of document*
