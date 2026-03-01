# DCE Hub — Current Situation Analysis
## Derivatives Clearing & Execution | DBS Bank, Singapore

**Document Type:** Business & Technology Discovery  
**Audience:** DCE Head, GFM Leadership, CTO Office, Program Stakeholders  
**Classification:** Internal — Confidential  
**Version:** 1.0 | February 2026  
**Prepared for:** DCE Agentic Transformation Program

---

## 1. Executive Summary

The Derivatives Clearing & Execution (DCE) Hub within DBS Bank's Treasury & Markets / Global Financial Markets (GFM) division operates a 24-hour, globally connected derivatives clearing and execution business serving both institutional (IBG) and professional retail (CBG) clients across major global exchanges including SGX, CME, LME, MCX, and others.

DCE processes 15,000–25,000 trades daily, onboards 15–20 new accounts weekly, and coordinates approximately 60 personnel across 10 distinct operational personas spanning Front Office, Middle Office, Back Office, Credit, and supporting units.

Despite the sophistication of its core transaction systems — Murex MX.3 (front-to-back OTC and ETD), FIS UBIX (back-office clearing), CQG (execution platform), FIS ClearVision (order entry), and FIS SIC (real-time risk monitoring) — the operational coordination layer that connects these systems and the people who use them is almost entirely manual. Pipeline management, account onboarding, workflow tracking, margin call notifications, product registry approvals, and inter-team coordination all run on email, Excel spreadsheets, and Microsoft Teams chats.

This creates a structural gap: world-class transaction infrastructure is undermined by pre-digital operational processes. The result is slow client onboarding (3–15 working days versus competitor benchmarks of 1–3 days), process slippage with no tracking visibility, elevated operational risk, and a competitive disadvantage against global FCM players (Goldman Sachs, JP Morgan, BNP Paribas) who have invested heavily in operational digitization.

DBS has committed to a full transformation program to revolutionize DCE operations using an agentic AI architecture. This document establishes the comprehensive current-state baseline from which that transformation will be designed.

---

## 2. Organizational Structure

### 2.1 Positioning Within DBS

```
DBS Bank Ltd
  └── Global Financial Markets (GFM)
        └── Treasury & Markets (T&M)
              └── Derivatives Clearing & Execution (DCE)
                    ├── Front Office (Sales + Execution)
                    ├── Relationship Management (IBG + CBG)
                    ├── COO — Desk Support
                    ├── COO — Client Services
                    ├── TMO — Static Team
                    ├── TMO — DCE Operations
                    ├── Credit
                    ├── Finance
                    └── Tech Support
```

DCE sits under T&M within GFM and has a single Head of DCE with multiple reporting lines beneath covering front office, operations, and support functions. The business operates 24 hours daily (Monday–Friday) across three time zones (Asia, Europe, Americas) to provide continuous execution and clearing services globally.

### 2.2 Team Size and Distribution

Total headcount across all DCE-related functions: approximately **60 personnel**.

| Function | Approximate Size | Primary Role |
|---|---|---|
| FO — Sales Dealers | 8–10 | Client relationship, pipeline management, account origination |
| FO — Execution Dealers | 6–8 | Order execution across global exchanges, trade key-in |
| RM (IBG, CBG) | 8–10 | KYC, CDD, BCAP, credit assessment for new accounts |
| COO — Desk Support | 5–7 | Document verification, account maintenance, auth trader scanning |
| COO — Client Services | 5–7 | Account maintenance, limit management (off-hours US exchange), trade amendments, trade simulation |
| TMO — Static Team | 4–5 | Account creation in UBIX, static data maintenance, product enablement, data mapping |
| TMO — DCE Operations | 5–7 | Funds deposit/withdrawal, EOD processing, reconciliation, workflow monitoring |
| Credit | 5–6 | DCE PCE limits, CQG login creation, IDB enablement, limit management, product review |
| Finance | 2–3 | Financial reporting, P&L, commission tracking |
| Tech Support | 2–3 | System maintenance, connectivity, issue resolution |

### 2.3 External Stakeholders

| Stakeholder | Relationship | Interaction Mode |
|---|---|---|
| **Customers — Corporate (IBG)** | Institutional clients using derivatives for hedging, speculation, or portfolio management | Sales Dealers, RMs, Client Services |
| **Customers — Professional Retail (CBG)** | Accredited individual investors and smaller professional firms | Sales Dealers, RMs, Client Services |
| **SGX (Singapore Exchange Derivatives Trading)** | Primary local exchange; DBS is a clearing member | Direct connectivity via systems |
| **CME Group** | Major global derivatives exchange (US) | CQG connectivity, clearing via correspondent |
| **LME (London Metal Exchange)** | DBS is a Trading Member; offers LME Registered Client Contracts | Direct membership; requires Accredited Investor status for clients |
| **MCX and other exchanges** | Additional exchange connectivity for commodities | Exchange connectivity via CQG and direct feeds |
| **Inter-Dealer Brokers (IDBs)** | Third-party brokers facilitating trade registration for clearing | Credit team enables IDB connectivity per client in CQG and other platforms |
| **MAS (Monetary Authority of Singapore)** | Primary regulator | Compliance, reporting, licensing (Capital Markets Services licence under SFA) |
| **Clearing Houses (SGX-DC, LCH, etc.)** | Central counterparties for trade clearing | Automated via UBIX |

---

## 3. Business Process Landscape

### 3.1 End-to-End Value Chain

```
PIPELINE          ACCOUNT           ACCOUNT            PRODUCT         TRADE            BACK OFFICE
MANAGEMENT        OPENING           MAINTENANCE        REGISTRY        MANAGEMENT       OPERATIONS
─────────────     ─────────────     ─────────────      ───────────     ─────────────    ──────────────
Prospect ID  →    KYC/CDD     →    Auth Traders   →   New Product →   Execution   →    Reconciliation
Customer          Doc Verify        Funds Deposit      Approval        Split/Alloc      Statements
Engagement        Credit Assess     Funds Withdraw     Enable in       Manual Key-in    Margin Calls
Commission        Multi-system      Limit Mgmt         Systems         Amendments       Contracts Setup
GTA Addendum      Account Create                       Static Data                      EOD Processing
                                                       Mapping                          Workflow Monitor
```

### 3.2 Process 1: Pipeline Management

**Owner:** FO — Sales Dealers  
**Supporting:** Relationship Managers (IBG/CBG)

**Current Process:**
The pipeline management process is the origin point for all new DCE business. Sales Dealers identify prospect customers through existing DBS relationships (cross-sell from IBG/CBG), industry events, referrals, and direct outreach.

Once a prospect is identified, Sales Dealers engage the customer to understand their specific DCE requirements: which products they want to trade (listed futures, options, OTC products, LME contracts, deliverable contracts), which exchanges they need access to, the commission structure to be charged, and whether any addendums to the General Trading Agreement (GTA) are required.

**Current Tools:** Email, Excel spreadsheets, MS Teams chats  
**No CRM.** No structured pipeline tracking. No visibility into pipeline stage, conversion rates, or bottleneck identification.

**Pain Points:**
- No centralized view of the pipeline across all Sales Dealers
- Pipeline status lives in individual Sales Dealers' email inboxes and personal Excel files
- No SLA tracking on engagement-to-onboarding conversion
- Duplicate outreach to the same prospect by different Sales Dealers is possible
- No automated handoff from pipeline to account opening — it's a manual email to the RM

### 3.3 Process 2: Account Opening

**Owner:** Distributed across 7 personas (highest coordination complexity)  
**Duration:** 3–15 working days (current) vs. 1–3 days (competitor benchmark)

This is the single most operationally intensive and highest-pain process in DCE. It touches virtually every supporting unit and requires coordination across multiple external and internal systems.

**Current Process Flow:**

```
Step 1: APPLICATION INITIATION
  Customer fills in the DCE Corporate/Institution Application Form (31-page PDF)

  The form is DYNAMIC — while core sections and 8 schedules apply to all
  customers, 3 schedules are conditionally applicable based on the customer's
  product choices and broker arrangements. The customer first selects which
  services they require (checkboxes on the application form):
    □ Execution and/or clearing services for listed futures and options
    □ Execution and clearing services for OTC products (including
      exchange-cleared OTC products and OTC lookalikes)
  This selection, along with specific product choices (exchange-listed,
  LME, deliverable contracts) and broker arrangements, determines which
  conditional schedules must be completed.

  CORE SECTIONS (all customers):
  ├── Corporate Information (name, address, registration, tax residence)
  ├── Account Relationship Details (existing DCE accounts, shareholding)
  └── Customer Declaration (16 clauses, signature required)

  SCHEDULES — MANDATORY (applicable to all customers):
  ├── Schedule 1: Risk Disclosure — SFA (Form 13, Reg 47E(1))
  ├── Schedule 2: Risk Disclosure — Commodity Trading Act (Chapter 48A)
  ├── Schedule 3: Execution Only Form (listed futures, options, OTC)
  ├── Schedule 4: Formal Consent to Take the Other Side of an Order
  ├── Schedule 5: Authorisation for Auto-Conversion of Currency
  ├── Schedule 10: Consent to Receive Statements in Electronic Form
  ├── Schedule 11A: Authorisation for Receiving Instructions by Electronic Means
  └── Schedule 12: Registration of Bank Accounts for Fund Withdrawal

  SCHEDULES — CONDITIONAL (based on customer's product choices):
  ├── Schedule 7A: Provision of Registration & Clearing Services for
  │                Exchange-Listed Contracts
  │                → Applicable to: Customers who wish to apply for registration
  │                  and clearing services for transactions in exchange-listed contracts
  ├── Schedule 8A: Provision of information for trading in LME futures & options
  │                → Applicable to: Customers who wish to trade in LME Contracts
  └── Schedule 9: Terms & Conditions for Trading in Deliverable Contracts
                   → Applicable to: Customers who wish to trade in any
                     Deliverable Contracts

  REMOVED:
  └── Schedule 6: Intentionally removed (blank placeholder)

  Supporting Documents Required:
  ├── Extract of Corporate Resolutions (original) or Full Corporate Resolutions (certified)
  ├── Letter of Appointment of Authorised Trader(s)
  ├── Specimen Signatures of Authorised Person(s)
  └── All documents must be certified by: DBS staff, Advocate & Solicitor, 
      Notary Public, Commissioner for Oaths, Judiciary member, or Embassy

Step 2: SUBMISSION
  Customer submits via:
  ├── Email scan to T&M-BMS-DCECustomerSupport@dbs.com
  └── Original hardcopy mailed to DBS Asia Central, Level 41, MBFC Tower 3
  NOTE: Scanned copies are processed first; originals still required physically

Step 3: RM REVIEW (IBG/CBG)
  Relationship Manager performs:
  ├── KYC verification
  ├── CDD (Customer Due Diligence) and BCAP checks
  ├── Credit assessment initiation
  └── Assigns to COO Desk Support for further processing

Step 4: COO DESK SUPPORT PROCESSING
  ├── Document verification (completeness, signatures, certifications)
  ├── Authorized Traders list scanning and verification
  └── Coordination with other teams via email

Step 5: MULTI-SYSTEM ACCOUNT CREATION (Sequential, manual)
  ├── Credit Team:
  │     ├── DCE PCE (Pre-agreed Credit Exposure) limit setup
  │     ├── CQG login creation for customer
  │     ├── IDB enablement in platforms (if applicable)
  │     └── Limit configuration
  │
  ├── TMO Static Team:
  │     ├── Account creation in UBIX
  │     ├── Static data maintenance in UBIX
  │     └── Static data mapping in ClearVision (CV)
  │
  ├── COO Client Services:
  │     └── Additional account setup tasks
  │
  └── Murex booking setup (if OTC products included)

Step 6: NOTIFICATION
  Customer notified of account approval + funding instructions via mail
  Customer must NOT remit funds until account is processed

Step 7: ACCOUNT ACTIVE
  Customer can begin trading
```

**Systems Touched During Account Opening:**

| System | Action | Team |
|---|---|---|
| UBIX | Account creation, static data setup | TMO Static |
| Murex MX.3 | Account/counterparty setup for OTC | TMO Static / Credit |
| CQG | Login creation, IDB enablement | Credit |
| ClearVision (CV) | Static data mapping | TMO Static |
| SIC | Account configuration for risk monitoring | Credit |
| Internal DBS systems | KYC/CDD/BCAP | RM |

**Critical Pain Points:**
- **31-page paper PDF** form with 8 mandatory schedules and 3 conditionally applicable schedules (7A, 8A, 9) that depend on the customer's product choices (exchange-listed, LME, deliverable contracts) and broker arrangements. Customers frequently submit incomplete forms — either missing mandatory schedules or incorrectly including/excluding conditional schedules — triggering back-and-forth emails that add days
- **No form validation** — errors, missing schedules, and incorrect conditional schedule selection are caught during manual review, not at submission time. There is no mechanism to guide the customer on which conditional schedules apply to their specific product and broker choices before submission
- **Sequential processing** — each team waits for the previous one; no parallel processing
- **No workflow tracking** — nobody has a real-time view of where an application stands
- **Multi-system manual data entry** — the same customer data is keyed into UBIX, Murex, CQG, ClearVision, and SIC separately, creating data consistency risk
- **Physical document requirement** — originals must be mailed even though processing begins from scanned copies
- **3–15 working day turnaround** — compared to 1–3 days at global competitors, this is a significant competitive disadvantage that directly impacts revenue (delayed onboarding = delayed trading = delayed commission)

### 3.4 Process 3: Account Maintenance

**Owner:** Multiple personas  
**Frequency:** Ongoing, daily

| Sub-Process | Owner(s) | Current Method | Systems |
|---|---|---|---|
| **Authorized Traders List** | COO Desk Support (scanning), COO Client Services, FO Sales Dealer | Customer sends updated list via email → manual verification → update in systems | UBIX, CQG |
| **Funds Deposit** | TMO DCE Ops | Customer notification via email → manual verification → posting in system | UBIX |
| **Funds Withdrawal** | TMO DCE Ops, Credit (approval for large amounts), FO Sales Dealer (request initiation) | Customer request via email → verification against registered bank accounts (Schedule 12) → manual processing | UBIX |
| **Customer Limit Management** | Credit, COO Client Services (off-hours for US exchange) | Email-based requests → Credit review → manual update in systems | UBIX, SIC, CQG |

**Pain Points:**
- All requests arrive via unstructured email — no ticketing, no SLA tracking
- Auth Trader updates require physical document scanning
- Funds withdrawal requires cross-referencing registered bank accounts (Schedule 12) manually
- Off-hours limit management for US exchanges handled by Client Services without Credit oversight, creating operational risk

### 3.5 Process 4: Product Registry

**Owner:** COO Desk Support (initiation), Credit (approval/rejection), TMO Static (enablement)  
**Frequency:** ~1 new product per week; 10,000+ products currently offered  
**Scope:** Enabling new exchange-traded products for customer trading

**Current Process Flow:**

```
COO Desk Support identifies need for new product
  │
  ├── Engage PDD (Product Development & Distribution) team
  ├── Collaborate to seek approval from supporting units:
  │     ├── LCS (Legal, Compliance & Secretariat)
  │     ├── Credit
  │     ├── Risk
  │     └── Other teams as required
  │
  ├── Credit Team:
  │     ├── Review product information
  │     ├── Approve or Reject product
  │     └── Key in products in UBIX
  │
  ├── COO Client Services:
  │     └── Assess Liquidity vs. Illiquidity characteristics
  │
  ├── TMO Static Team:
  │     ├── Enable product in UBIX
  │     └── Static data mapping in ClearVision (CV)
  │
  └── FO Sales Dealer:
        └── Product Registry Approval (final sign-off)
```

**Pain Points:**
- Multi-team approval chain entirely via email — no structured workflow
- No visibility into where a product approval stands
- Product information scattered across emails and attachments
- Static data must be manually entered in both UBIX and ClearVision
- Delay in product enablement means customers can't trade new products, potentially losing business to competitors

### 3.6 Process 5: Trade Management

**Owner:** FO Execution Dealers, COO Client Services  
**Volume:** 15,000–25,000 trades daily  
**Sources:** CQG, CME, LME, SGX, MCX, and other exchanges

| Sub-Process | Owner | Current Method | Systems |
|---|---|---|---|
| **Order Execution** | FO Execution Dealer | Electronic via CQG platform (voice and online) | CQG → Exchange |
| **Trade Key-in** | FO Execution Dealer | Manual entry into ClearVision for trades not flowing electronically | ClearVision (CV) |
| **Trade Registration** | FO Execution Dealer | Register trades in ClearVision | CV |
| **Split and Allocation** | FO Execution Dealer | Split block trades across multiple customer accounts; manual in CV | ClearVision (CV) |
| **Trade Amendments** | COO Client Services | Correct trade errors, adjust allocations; manual process | CV, UBIX |
| **Trade Simulation** | COO Client Services | Simulate trade impact in SIC before execution | SIC |
| **Enable Trade** | COO Client Services | Enable specific trade types for customers | Systems |

**Pain Points:**
- Manual trade key-in for non-electronic trades is error-prone and time-sensitive
- Split and allocation across multiple accounts is manual and complex — mistakes here directly impact customer P&L
- Trade amendments require manual coordination between Client Services and Execution Dealers
- No automated trade validation before submission
- High volume (15K–25K/day) with manual touchpoints creates operational risk concentration

### 3.7 Process 6: Back Office Operations

**Owner:** TMO DCE Operations, TMO Static Team  
**Frequency:** Daily (EOD processing, reconciliation), triggered (margin calls)

| Sub-Process | Owner | Current Method | Systems |
|---|---|---|---|
| **EOD Processing** | TMO DCE Ops | End-of-day batch processing | UBIX |
| **Trade Reconciliation** | TMO DCE Ops | Match trades between front-office systems and back-office/exchange records | UBIX, Murex |
| **Workflow Monitoring** | TMO DCE Ops | Monitor UBIX workflows for failures or exceptions | UBIX |
| **Statement Distribution** | TMO DCE Ops | Generate and distribute daily trading statements to customers via encrypted email | UBIX → Email |
| **Margin Call Notifications** | TMO DCE Ops / SIC monitoring | Monitor margin levels in SIC → identify breaches → manually calculate margin → email notification to customer | SIC, UBIX, Email |
| **Contracts (Products) Setup** | TMO Static Team | Set up new product contracts in back-office systems | SIC, UBIX |

**Pain Points — Margin Calls (highest risk):**
- Margin calls are **time-critical** — delayed notification can result in forced liquidation, customer complaints, and regulatory scrutiny
- Current process: someone monitors SIC for margin breaches → manually checks UBIX for account balances → calculates margin requirement → composes email to customer → sends
- During high volatility (market stress), margin call volume spikes dramatically — the manual process doesn't scale
- No automated escalation if customer doesn't respond within the margin call deadline
- No centralized dashboard showing all accounts approaching margin thresholds (proactive vs. reactive)

**Pain Points — Reconciliation:**
- Reconciliation between front-office trades (CQG/CV/Murex) and back-office records (UBIX) is partially automated by UBIX but exceptions require manual investigation
- Breaks can take hours to resolve, delaying EOD processing and downstream reporting

---

## 4. Technology Landscape

### 4.1 Core Systems Map

```
CUSTOMER-FACING                    FRONT OFFICE              BACK OFFICE / RISK
──────────────────                 ──────────────            ──────────────────

                                   ┌──────────┐
                                   │   CQG    │ ← Customer trading platform
                                   │ (Vendor) │   (order routing, market data,
                                   └────┬─────┘    execution — 24hr)
                                        │
                                        ▼
┌─────────────┐                   ┌──────────────┐         ┌──────────────┐
│  Exchanges  │ ◄─────────────────│ ClearVision  │────────►│    UBIX      │
│  SGX, CME,  │   Trade Execution │   (CV)       │  Trade  │  (FIS)       │
│  LME, MCX   │                   │ Order Entry   │  Feed   │ Back-Office  │
│  etc.       │                   │  (FIS)        │         │ Clearing     │
└─────────────┘                   └──────┬───────┘         │ Settlement   │
                                         │                  │ Recon        │
                                         │                  │ Statements   │
                                   ┌─────▼───────┐         └──────┬───────┘
                                   │  Murex MX.3 │                │
                                   │ Front-to-Back│         ┌─────▼───────┐
                                   │ OTC + ETD    │         │    SIC      │
                                   │ Risk, P&L    │         │ (FIS)       │
                                   └──────────────┘         │ Real-Time   │
                                                            │ Risk/Margin │
                                                            │ Monitoring  │
                                                            └─────────────┘

OPERATIONAL COORDINATION LAYER (the gap)
════════════════════════════════════════
  Email + Excel + MS Teams + PDF Forms
  ├── Pipeline tracking
  ├── Account opening workflow
  ├── Account maintenance requests
  ├── Product registry approvals
  ├── Margin call notifications
  ├── Inter-team coordination
  └── SLA tracking (nonexistent)
```

### 4.2 System Details

| System | Vendor | Purpose | Users | Data |
|---|---|---|---|---|
| **Murex MX.3** | Murex (Paris) | Front-to-back platform for OTC and exchange-traded derivatives. Trade capture, pricing, risk analytics, P&L, regulatory reporting. Adopted by DBS in 2014 for risk management operations. | Sales, Trading, Risk, Finance, Operations | Trade data, positions, P&L, risk metrics, counterparty data |
| **FIS UBIX** | FIS (Fidelity National Information Services) | Real-time back-office system for cleared derivatives. Global clearing for sell-side and buy-side. Time-zone-independent automated processing. SOA architecture using Java and Oracle DB. | TMO Static, TMO DCE Ops, Credit | Account master, trade clearing, margin, reconciliation, statements, static data |
| **CQG** | CQG Inc. | Trading platform for execution. High-performance trade routing, global market data, advanced technical analysis. Consolidates 75+ data sources. Available as desktop, web (HTML5), and mobile. | Execution Dealers, Customers | Order flow, market data, execution records |
| **FIS ClearVision (CV)** | FIS (part of Cleared Derivatives Suite) | Order entry system. Single platform for global trade processing. | Execution Dealers, TMO Static | Trade entry, registration, allocation |
| **FIS SIC (Streaming Instant Control)** | FIS (part of Cleared Derivatives Suite) | Real-time, post-trade risk monitoring system. Intraday monitoring of accounts and portfolios. Margin calculation and monitoring. | Credit, COO Client Services | Real-time risk, margin levels, portfolio exposure |
| **Internal DBS Systems** | DBS (proprietary) | KYC/CDD/BCAP, corporate banking systems, credit assessment | RM, Compliance | Customer identity, due diligence records, credit profiles |

### 4.3 The FIS Cleared Derivatives Suite

Three of the five core systems (UBIX, ClearVision, SIC) are from FIS's Cleared Derivatives Suite, which provides an integrated post-trade ecosystem. However, the operational coordination between these systems and Murex/CQG is manual. The FIS suite handles the transactional backbone but does not provide workflow orchestration, case management, or intelligent process automation.

### 4.4 Integration Gaps

| Gap | Impact |
|---|---|
| **No workflow orchestration layer** between systems | Account opening requires sequential manual data entry across 5+ systems. No parallel processing. No status tracking. |
| **No unified customer view** | Customer data exists in UBIX, Murex, CQG, ClearVision, and internal banking systems — no single source of truth. |
| **No case management** | Every request (account opening, maintenance, funds, product registry) is an email thread, not a trackable case with SLA. |
| **No document intelligence** | The 31-page PDF application form is processed entirely by human reading. No OCR, no field extraction, no completeness validation at submission. |
| **No proactive margin monitoring** | SIC provides data, but alerting and notification are manual. No predictive margin breach warnings. |
| **No pipeline/CRM integration** | Sales Dealers manage pipeline in personal Excel files. No connection to downstream account opening workflow. |

---

## 5. Persona Analysis

### 5.1 Persona-Process Responsibility Matrix

Based on the T&M DCE Bank Personas matrix, the following captures each persona's responsibilities across the four process domains:

| Persona | Customer Processes | Product Processes | Trade Processes | Other |
|---|---|---|---|---|
| **FO — Sales Dealer** | Pipeline Management, Account Opening, Account Maintenance, Funds Withdrawal | Product Registry Approval | — | — |
| **FO — Execution Dealer** | Order Execution | — | Trade Key-in (CV), Registering Trades, Split and Allocation | — |
| **RM (IBG, CBG)** | Account Opening (KYC, CDD/BCAP, Credit Assessment) | — | — | — |
| **COO — Desk Support** | Account Opening (Doc Verification), Account Maintenance, Auth Traders (Doc Scanning) | Product Registry (Engage PDD, Collaborate for approvals from LCS, Credit, Risk teams) | — | — |
| **COO — Client Services** | Account Opening, Account Maintenance (Auth Traders), Limit Management (off-hours US exchange) | Product Registry (Liquidity vs. Illiquidity) | Trade Amendments, Enable Trade, Trade Simulation (SIC) | — |
| **TMO — Static Team** | Account Opening (Account creation in UBIX, Static data maintenance in UBIX) | Product Registry (Enable product in UBIX, Static data mapping in CV) | Contracts Setup (SIC, UBIX) | — |
| **TMO — DCE Ops** | Funds Withdrawal, Funds Deposit | — | EOD Processing, Reconciliation, Workflow Monitoring | — |
| **Credit** | Account Opening (DCE PCE Limit, CQG Login, IDB Enablement, Limit Mgmt, Funds Withdrawal) | Product Registry (Review product info, Approve/Reject, Key in products in UBIX) | — | — |
| **Finance** | *(Finance processes not fully documented in current discovery)* | — | — | — |
| **Tech Support** | *(Tech support processes not fully documented in current discovery)* | — | — | — |

### 5.2 Key Observations

**Highest coordination burden:** Account Opening touches 7 of 10 personas. This is the process where email-based coordination breaks down most severely.

**Cross-functional bottleneck:** The Credit team is involved in Account Opening (PCE limits, CQG login, IDB enablement), Account Maintenance (limit management, funds withdrawal), AND Product Registry (product approval). Any backlog in Credit cascades across all three processes.

**Off-hours coverage gap:** COO Client Services handles Limit Management for US exchange hours, operating without direct Credit team oversight. This is a controlled operational risk that should be documented and monitored.

**Static data duplication:** TMO Static Team must enter data in both UBIX and ClearVision (CV) for products and accounts. This dual-entry pattern creates data consistency risk.

---

## 6. Volume and Scale Metrics

| Metric | Current Volume | Notes |
|---|---|---|
| **Daily Trade Volume** | 15,000–25,000 trades | Across CQG, CME, LME, SGX, MCX, and other exchanges |
| **New Accounts per Week** | 15–20 | Mix of retail, individual, high-net-worth, institutional, accredited investor |
| **New Accounts per Month** | ~60–80 | Seasonal variation; higher during market volatility |
| **Products Currently Offered** | 10,000+ | Listed futures, options, exchange-cleared OTC, LME, deliverable contracts |
| **New Products per Week** | ~1 | Requires multi-team approval workflow |
| **Account Opening Duration** | 3–15 working days | Highly variable; depends on document completeness, credit assessment complexity |
| **Operating Hours** | 24 hours, Monday–Friday | Three time zones: Asia, Europe, Americas |
| **Margin Call Volume** | Variable | Depends on market volatility and customer fund availability; spikes during stress events |
| **Team Size** | ~60 personnel | Across 10 operational personas |

---

## 7. Pain Points and Risk Assessment

### 7.1 Ranked Pain Points

| Rank | Pain Point | Business Impact | Risk Level |
|---|---|---|---|
| **1** | **Account Onboarding: 3–15 days vs. 1–3 day competitor benchmark** | Revenue leakage (delayed trading = delayed commissions); customer attrition to faster competitors (Goldman, JPM, BNP); competitive disadvantage in client acquisition | **Critical** |
| **2** | **No Workflow Tracking or Visibility** | Nobody knows where any given request stands. Status inquiries consume operational time. SLA breaches go undetected. Management has no operational dashboard. | **High** |
| **3** | **Process Slippage** | Manual handoffs between 7+ personas via email create drop-off points. Requests get lost in inboxes. No escalation mechanism. | **High** |
| **4** | **Manual Margin Call Process** | During market stress, margin call volume spikes but the manual process doesn't scale. Delayed margin calls create regulatory and financial risk. | **Critical** |
| **5** | **Multi-System Manual Data Entry** | Same customer/product data entered into 5+ systems separately. Data inconsistency risk. Operational overhead. | **High** |
| **6** | **31-Page Paper PDF Application** | No field validation, no completeness check, no digital submission. Customers submit incomplete forms, triggering days of back-and-forth. | **Medium-High** |
| **7** | **No Pipeline/CRM Visibility** | Sales management cannot see pipeline, conversion rates, or dealer productivity. Strategic decisions based on anecdotal information. | **Medium** |
| **8** | **Account Slippage** | Incomplete onboarding steps across systems — account created in UBIX but not in CQG, or enabled in CQG but not in Murex. No checklist enforcement. | **High** |
| **9** | **Product Registry Approval Bottleneck** | Multi-team email-based approval chain with no tracking. Products that could be offered to customers are delayed. | **Medium** |
| **10** | **Reconciliation Breaks** | Exceptions between front-office and back-office records require manual investigation, delaying EOD and downstream reporting. | **Medium** |

### 7.2 Operational Risk Heat Map

```
                    LIKELIHOOD
                    Low        Medium      High
              ┌──────────┬──────────┬──────────┐
      High    │          │ Recon    │ Margin   │
              │          │ Breaks   │ Call     │
IMPACT        │          │          │ Delay    │
              ├──────────┼──────────┼──────────┤
      Medium  │ Product  │ Data     │ Process  │
              │ Registry │ Inconsis │ Slippage │
              │ Delay    │ -tency   │ Account  │
              │          │          │ Slippage │
              ├──────────┼──────────┼──────────┤
      Low     │          │ Pipeline │          │
              │          │ Overlap  │          │
              └──────────┴──────────┴──────────┘
```

### 7.3 Regulatory Risk Considerations

| Risk Area | Regulation | Current Exposure |
|---|---|---|
| **KYC/AML compliance gaps** | MAS Notice 626, SFA | Manual KYC process increases risk of inconsistent due diligence. No automated re-screening. |
| **Margin call timeliness** | SGX Rules, MAS TRMG | Manual margin call process may not meet regulatory expectations during market stress. SGX rules require timely notification. |
| **Trade reporting accuracy** | MAS — OTC derivatives reporting | Manual trade key-in and amendment process creates risk of reporting errors. |
| **Record keeping** | MAS — Business Conduct Regulations | Email-based workflow coordination doesn't provide the structured audit trail that regulatory examinations require. |
| **Accredited Investor verification** | SFA, MAS | LME trading requires Accredited Investor status (Schedule 8A). Ongoing status verification is manual. |
| **Authorized Trader management** | SFA, Exchange Rules | Auth Trader lists maintained manually; risk of unauthorized trading if updates are delayed. |

---

## 8. Competitive Landscape

### 8.1 Competitive Position

DBS DCE competes for derivatives clearing and execution business against both local Singapore banks and global FCM (Futures Commission Merchant) players:

| Competitor Tier | Examples | Typical Onboarding Speed | Digital Maturity |
|---|---|---|---|
| **Global FCMs** | Goldman Sachs, JP Morgan, BNP Paribas, Morgan Stanley, Citigroup | 1–3 working days | High — digital onboarding, automated workflows, client portals, real-time margin dashboards |
| **Regional Banks** | OCBC, UOB (Singapore); HSBC, Standard Chartered (regional) | 3–7 working days | Medium — partial digitization, some workflow automation |
| **DBS DCE (Current)** | — | 3–15 working days | Low — core transaction systems are strong, but operational layer is pre-digital |

### 8.2 DBS Competitive Advantages (to protect and enhance)

Despite the operational gaps, DBS DCE has significant competitive advantages:

- **Strong brand and trust** — DBS is the largest bank in Southeast Asia; the brand carries weight with institutional and retail clients
- **Multi-currency, single account** — customers access all banking and futures products on one multi-currency account
- **24-hour service** — full voice and electronic execution across three time zones
- **LME Trading Membership** — DBS is a direct Trading Member of LME, offering registered client contracts
- **Local presence** — deep relationships with Singapore-based corporates and government-linked entities
- **Integrated banking** — DCE customers can leverage DBS's full banking platform (cash management, trade finance, FX)

### 8.3 Competitive Threat Assessment

The primary competitive threat is not that DBS will lose existing clients (switching costs are high in derivatives clearing), but that DBS will fail to win new clients who compare the onboarding experience against global players. A corporate treasurer who can open a derivatives clearing account with Goldman in 2 days will not wait 15 days for DBS — regardless of DBS's other advantages.

---

## 9. Transformation Readiness Assessment

### 9.1 Strengths for Transformation

| Strength | Implication |
|---|---|
| **Strong core systems** (Murex, UBIX, CQG, CV, SIC) | The transaction backbone is solid. The transformation is about the coordination layer, not replacing core systems. This de-risks the program significantly. |
| **FIS Cleared Derivatives Suite** (UBIX + CV + SIC) | Three systems from the same vendor — potential for unified API access and data model alignment. |
| **Single Head of DCE** | Clear decision authority for process changes. No committee paralysis. |
| **Compact team (~60)** | Change management is feasible with a team this size. Every persona can be directly engaged. |
| **Fresh start** | No legacy automation to untangle. First-mover advantage in shaping the digital operating model. |
| **DBS institutional AI capability** | DBS has broader AI/ML capability and infrastructure (Vikram's broader GFM context). The DCE transformation can leverage existing enterprise AI platforms. |

### 9.2 Risks and Constraints

| Risk | Mitigation |
|---|---|
| **Change resistance** — 60 people whose daily work will change fundamentally | Persona-centric design. Build agents that each persona sees as "their assistant," not a replacement. Early wins build trust. |
| **System integration complexity** — 5 core systems, some vendor-managed | MCP tool approach allows gradual integration. Start with read-only tools, add write operations after validation. |
| **Regulatory sensitivity** — MAS-regulated activity with strict compliance requirements | Trust Plane architecture from the enterprise framework. HITL approval for all critical operations. Explainability for every agent action. |
| **Vendor dependency** — FIS and CQG are third-party managed systems | API access needs to be confirmed. If APIs are limited, RPA may be needed as a bridge. Assess early. |
| **Data quality** — years of manual data entry may have created inconsistencies across systems | Data audit should be an early Phase 1 activity before agents are built on top of potentially inconsistent data. |

### 9.3 Program Parameters

| Parameter | Value |
|---|---|
| **Program Type** | Full Transformation (not a pilot) |
| **Estimated Duration** | 12–18 months |
| **Strategic Approach** | Start with high-impact process (account onboarding) to prove value, then expand agentic copilot across all personas and processes |
| **Architecture** | Agentic AI — multi-agent system with persona-aligned copilots |
| **Prior Digital Initiatives** | None — greenfield digitalization; DCE is just starting its digital journey |
| **Executive Sponsor** | Head of DCE |

---

## 10. Recommended Next Steps

This current situation analysis establishes the comprehensive baseline. The recommended next steps for the transformation program are:

1. **Process Deep-Dive Workshops** — conduct 2-hour workshops with each persona group to capture detailed step-by-step workflows, exception handling, decision logic, and undocumented tribal knowledge

2. **System API Assessment** — engage FIS and CQG to assess API availability for UBIX, ClearVision, SIC, and CQG. Determine which operations can be automated via API vs. which require RPA bridge solutions

3. **Target State Architecture** — apply the 7-Plane Enterprise Agentic Architecture to DCE specifically, designing the agent topology, tool map, and trust framework for this business unit

4. **Agent Design per Persona** — design the agentic copilot for each of the 10 personas, defining what the agent does autonomously, what requires human approval, and what remains fully human

5. **Account Onboarding Transformation Sprint** — execute the first transformation sprint focused on reducing account onboarding from 3–15 days to under 3 days, as this delivers the highest immediate business impact

6. **Data Quality Audit** — assess data consistency across UBIX, Murex, CQG, and ClearVision to establish a clean foundation before building agent-powered workflows on top

---

## Appendix A: DCE Application Form Structure

The current Corporate/Institution Application Form (Version 02.20, last updated dates ranging from Feb 2017 to Nov 2021) is a 31-page PDF document with the following structure:

**IMPORTANT: The form has dynamic applicability.** While 8 schedules are mandatory for all customers, 3 schedules (7A, 8A, 9) are conditionally applicable based on the customer's product choices and broker arrangements. The Application Checklist on page 2 of the form explicitly defines these applicability rules. The customer also selects their desired services via checkboxes on the application form (execution/clearing for listed futures & options, and/or execution/clearing for OTC products), which drives the conditional schedule requirements. The full depth of this dynamic logic and its interaction with broker arrangements will be documented in subsequent discovery.

| Section | Pages | Content | Applicability (per PDF) |
|---|---|---|---|
| Cover & Instructions | 1 | Document verification requirements, submission methods | Informational |
| Application Checklist | 1 | List of all schedules with explicit applicability rules | Reference |
| Corporate Application Form | 1 | Corporate info, account relationships, service selection checkboxes | All customers |
| Customer Declaration | 2 | 16 legal declarations (a–p), signatures | All customers |
| Schedule 1 — SFA Risk Disclosure | 4 | Form 13 (Reg 47E(1)), detailed risk disclosure for futures, options, OTCD, Spot LFX | All customers |
| Schedule 2 — CTA Risk Disclosure | 1 | Commodity Trading Act (Chapter 48A) risk disclosure | All customers |
| Schedule 3 — Execution Only Form | 1 | SIP acknowledgment, no advisory | All customers |
| Schedule 4 — Consent to Take Other Side | 1 | Reg 47C compliance — formal consent to DBS as counterparty | All customers |
| Schedule 5 — Auto Currency Conversion | 1 | Authorization for auto-conversion of controlled currencies | All customers |
| Schedule 6 — (Intentionally Removed) | 1 | Blank placeholder | N/A |
| Schedule 7A — Registration & Clearing | 4 | Registration & clearing services for exchange-listed contracts; includes IDB consent and ECP representation (US exchanges) | **Conditional** — Customers who wish to apply for registration and clearing services for transactions in exchange-listed contracts |
| Schedule 8A — LME Information | 2 | LEI, account category (hedger/non-hedger), EU Emissions Allowance classification | **Conditional** — Customers who wish to trade in LME Contracts |
| Schedule 9 — Deliverable Contracts | 2 | Physical delivery terms, indemnities, compliance with exchange delivery rules | **Conditional** — Customers who wish to trade in any Deliverable Contracts |
| Schedule 10 — Electronic Statements | 2 | Consent for encrypted email statements | All customers |
| Schedule 11A — Electronic Instructions | 2 | Authorization for receiving instructions by fax/email | All customers |
| Schedule 12 — Fund Withdrawal Accounts | 3 | Registered bank accounts for fund withdrawal (DBS/POSB + 3rd party, max 3 each) | All customers |

**Key observations:**
- Of the 11 active schedules, **8 are mandatory for all customers** and **3 are conditionally applicable** (7A, 8A, 9) based on specific product choices. The PDF's Application Checklist and each schedule's header page explicitly state these applicability rules.
- The form is a static 31-page PDF — customers receive all pages regardless of which conditional schedules apply to them. There is no built-in mechanism to present only the relevant schedules based on the customer's product selections.
- The form has different version dates across schedules (ranging from Oct 2014 to Nov 2021), suggesting piecemeal updates over time rather than systematic form management.
- The dynamic nature of conditional schedule applicability, combined with the static PDF format, contributes to incomplete/incorrect submissions — customers may not realize which conditional schedules they need to complete based on their product and broker choices.

---

## Appendix B: Glossary

| Term | Definition |
|---|---|
| **BCAP** | Business Conduct and Accountability Programme — DBS internal customer assessment |
| **CBG** | Consumer Banking Group — retail banking division |
| **CDD** | Customer Due Diligence — KYC verification process |
| **CV (ClearVision)** | FIS order entry and trade processing system |
| **DCE** | Derivatives Clearing & Execution |
| **ECP** | Eligible Contract Participant (US regulatory classification) |
| **EFRP** | Exchange for Related Position |
| **ETD** | Exchange-Traded Derivatives |
| **FCM** | Futures Commission Merchant |
| **GFM** | Global Financial Markets (DBS division) |
| **GTA** | General Trading Agreement — master agreement between DBS and DCE customers |
| **IBG** | Institutional Banking Group |
| **IDB** | Inter-Dealer Broker |
| **KYC** | Know Your Customer |
| **LCS** | Legal, Compliance & Secretariat |
| **LEI** | Legal Entity Identifier |
| **LME** | London Metal Exchange |
| **MAS** | Monetary Authority of Singapore |
| **MCX** | Multi Commodity Exchange (India) |
| **OTC** | Over-The-Counter |
| **PCE** | Pre-agreed Credit Exposure |
| **PDD** | Product Development & Distribution |
| **SFA** | Securities and Futures Act (Singapore) |
| **SGX** | Singapore Exchange |
| **SIC** | Streaming Instant Control — FIS real-time risk monitoring |
| **SIP** | Specified Investment Products |
| **T&M** | Treasury & Markets |
| **TMO** | Treasury & Markets Operations |
| **UBIX** | FIS real-time back-office system for cleared derivatives |

---

*This document serves as the authoritative current-state baseline for the DCE Agentic Transformation Program. All subsequent architecture, design, and implementation decisions should reference this document as the source of truth for the existing business and technology landscape.*
