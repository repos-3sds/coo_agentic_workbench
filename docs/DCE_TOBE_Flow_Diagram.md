# DCE Account Opening — TO-BE Solution Flow Diagram

## Personas, Touchpoints & User Experience

**Last Updated:** 2026-03-01

---

## 1. PERSONA MAP

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AGENTIC WORKBENCH USERS                      │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────┐ ┌──────────┐ ┌──────────────┐ │
│  │  SALES   │ │   COO    │ │      │ │  CREDIT  │ │     TMO      │ │
│  │  DEALER  │ │   DESK   │ │  RM  │ │   TEAM   │ │    STATIC    │ │
│  │          │ │ SUPPORT  │ │      │ │          │ │              │ │
│  └──────────┘ └──────────┘ └──────┘ └──────────┘ └──────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  MANAGEMENT (DCE Sales Desk Head) — Escalation & Oversight  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL (EMAIL ONLY)                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  CUSTOMER — Submits docs via email, receives notifications   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        AI AGENTS (7)                                 │
│                                                                     │
│  A1 Orchestrator  │ A2 Email Ingestion │ A3 Document Intelligence   │
│  A4 Signature     │ A5 Notification    │ A6 Audit & Compliance      │
│  A7 Data Sync     │                    │                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. END-TO-END FLOW — SWIM LANE DIAGRAM

```
 CUSTOMER          SALES DEALER       DESK SUPPORT        RM            CREDIT         TMO STATIC       AI AGENTS          SYSTEMS
 (Email)           (Workbench)        (Workbench)         (Workbench)   (Workbench)    (Workbench)      (Background)       (Downstream)
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │             │              │                 │                  │
────┼───────────────────┼──────────────────┼──────────────────┼─────────────┼──────────────┼─────────────────┼──────────────────┼────
    │                   │                  │                  │             │              │                 │                  │
    │  PHASE 0: DOCUMENT INGESTION (Automated)                │             │              │                 │                  │
    │                   │                  │                  │             │              │                 │                  │
    │──── Emails docs ──┼──────────────────┼──────────────────┼─────────────┼──────────────┼────────────────▶│                  │
    │   to functional   │                  │                  │             │              │          A2: Monitor inbox         │
    │   inbox           │                  │                  │             │              │          A2: Extract attachments   │
    │                   │                  │                  │             │              │          A3: OCR + Classify        │
    │                   │                  │                  │             │              │          A3: Extract data          │
    │                   │                  │                  │             │              │          A3: Validate checklist    │
    │                   │                  │                  │             │              │          A6: Log everything        │
    │                   │                  │                  │             │              │          A1: Create/update case    │
    │                   │                  │                  │             │              │                 │                  │
────┼───────────────────┼──────────────────┼──────────────────┼─────────────┼──────────────┼─────────────────┼──────────────────┼────
    │                   │                  │                  │             │              │                 │                  │
    │  PHASE 1: SALES DEALER REVIEW       │                  │             │              │          A5:Notify Sales Dealer    │
    │                   │                  │                  │             │              │                 │                  │
    │                   │◄── In-app ───────┼──────────────────┼─────────────┼──────────────┼─────────────────│                  │
    │                   │    notification  │                  │             │              │                 │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │  ┌────────────────────────────┐     │             │              │                 │                  │
    │                   │  │ SALES DEALER UX            │     │             │              │                 │                  │
    │                   │  │                            │     │             │              │                 │                  │
    │                   │  │ ┌── Case Summary ────────┐ │     │             │              │                 │                  │
    │                   │  │ │ Customer: ABC Corp     │ │     │             │              │                 │                  │
    │                   │  │ │ Status: New            │ │     │             │              │                 │                  │
    │                   │  │ │ Priority: [Normal ▼]   │ │     │             │              │                 │                  │
    │                   │  │ │ Ageing: 0h 12m         │ │     │             │              │                 │                  │
    │                   │  │ └────────────────────────┘ │     │             │              │                 │                  │
    │                   │  │                            │     │             │              │                 │                  │
    │                   │  │ ┌── AI-Extracted Data ───┐ │     │             │              │                 │                  │
    │                   │  │ │ Company: ABC Corp Ltd  │ │     │             │              │                 │                  │
    │                   │  │ │ UEN: 201912345A       │ │     │             │              │                 │                  │
    │                   │  │ │ Products: LME, SGX    │ │     │             │              │                 │                  │
    │                   │  │ │ [Confirm] [Edit]       │ │     │             │              │                 │                  │
    │                   │  │ └────────────────────────┘ │     │             │              │                 │                  │
    │                   │  │                            │     │             │              │                 │                  │
    │                   │  │ ┌── Document Checklist ──┐ │     │             │              │                 │                  │
    │                   │  │ │ ✅ App Form           │ │     │             │              │                 │                  │
    │                   │  │ │ ✅ Schedule 1         │ │     │             │              │                 │                  │
    │                   │  │ │ ✅ Schedule 8A (LME)  │ │     │             │              │                 │                  │
    │                   │  │ │ ❌ GTA — MISSING      │ │     │             │              │                 │                  │
    │                   │  │ │ ❌ ID Proof — MISSING │ │     │             │              │                 │                  │
    │                   │  │ └────────────────────────┘ │     │             │              │                 │                  │
    │                   │  │                            │     │             │              │                 │                  │
    │                   │  │ [Notify Customer]          │     │             │              │                 │                  │
    │                   │  │ [Submit for Review]        │     │             │              │                 │                  │
    │                   │  └────────────────────────────┘     │             │              │                 │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │── IF incomplete: │                  │             │              │          A5: Send customer email   │
    │◄── Missing docs ──┼── "Notify       │                  │             │              │          "GTA and ID Proof are     │
    │    email          │    Customer"    │                  │             │              │           missing. Please submit." │
    │                   │                  │                  │             │              │                 │                  │
    │                   │── IF complete: ──┼──────────────────┼─────────────┼──────────────┼────────────────▶│                  │
    │                   │  "Submit for     │                  │             │              │          A1: Advance to Phase 2    │
    │                   │   Review"        │                  │             │              │          A6: Log review            │
    │                   │                  │                  │             │              │                 │                  │
────┼───────────────────┼──────────────────┼──────────────────┼─────────────┼──────────────┼─────────────────┼──────────────────┼────
    │                   │                  │                  │             │              │                 │                  │
    │  PHASE 2: DOCUMENT & SIGNATURE VERIFICATION             │             │              │          A5: Notify Desk Support  │
    │                   │                  │                  │             │              │          A4: Begin sig analysis    │
    │                   │                  │◄── In-app ───────┼─────────────┼──────────────┼─────────────────│                  │
    │                   │                  │    notification  │             │              │                 │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │  ┌──────────────────────────────────┐         │                 │                  │
    │                   │                  │  │ DESK SUPPORT UX                  │         │                 │                  │
    │                   │                  │  │                                  │         │                 │                  │
    │                   │                  │  │ ┌── Signature Review Panel ────┐ │         │                 │                  │
    │                   │                  │  │ │                              │ │         │                 │                  │
    │                   │                  │  │ │ Signatory: Lee Wei Ming     │ │         │                 │                  │
    │                   │                  │  │ │ Authority: ✅ Director      │ │         │                 │                  │
    │                   │                  │  │ │ Confidence: 94.2%          │ │         │                 │                  │
    │                   │                  │  │ │ Flag: 🟢 HIGH CONFIDENCE   │ │         │                 │                  │
    │                   │                  │  │ │                              │ │         │                 │                  │
    │                   │                  │  │ │ ┌─────────┐  ┌──────────┐  │ │         │                 │                  │
    │                   │                  │  │ │ │Submitted│  │ ID Doc   │  │ │         │                 │                  │
    │                   │                  │  │ │ │  Sig    │  │   Sig    │  │ │         │                 │                  │
    │                   │                  │  │ │ │ [image] │  │ [image]  │  │ │         │                 │                  │
    │                   │                  │  │ │ └─────────┘  └──────────┘  │ │         │                 │                  │
    │                   │                  │  │ │                              │ │         │                 │                  │
    │                   │                  │  │ │ [Approve] [Reject] [Clarify] │ │         │                 │                  │
    │                   │                  │  │ └──────────────────────────────┘ │         │                 │                  │
    │                   │                  │  │                                  │         │                 │                  │
    │                   │                  │  │ ┌── Physical Copy Tracker ─────┐ │         │                 │                  │
    │                   │                  │  │ │ App Form    Digital:✅ Phys:⏳│ │         │                 │                  │
    │                   │                  │  │ │ Schedule 1  Digital:✅ Phys:⏳│ │         │                 │                  │
    │                   │                  │  │ │ GTA         Digital:✅ Phys:⏳│ │         │                 │                  │
    │                   │                  │  │ └─────────────────────────────┘ │         │                 │                  │
    │                   │                  │  │                                  │         │                 │                  │
    │                   │                  │  │ [Submit to RM]                   │         │                 │                  │
    │                   │                  │  └──────────────────────────────────┘         │                 │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │── "Approve" sig ─┼─────────────┼──────────────┼────────────────▶│                  │
    │                   │                  │                  │             │              │          A4: Store verified sig    │
    │                   │                  │                  │             │              │          A6: Log approval          │
    │                   │                  │                  │             │              │                 │                  │
    │◄── Clarify email ─┼──────────────────┼── IF "Clarify" ─┼─────────────┼──────────────┼────────────────▶│                  │
    │   (if needed)     │                  │                  │             │              │          A5: Send clarify email    │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │── "Submit to RM" ┼─────────────┼──────────────┼────────────────▶│                  │
    │                   │                  │                  │             │              │          A1: Advance to Phase 3    │
    │                   │                  │                  │             │              │                 │                  │
────┼───────────────────┼──────────────────┼──────────────────┼─────────────┼──────────────┼─────────────────┼──────────────────┼────
    │                   │                  │                  │             │              │                 │                  │
    │  PHASE 3: RM REVIEW — KYC / CDD / BCAP / CREDIT ASSESSMENT          │              │          A5: Notify RM            │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │◄── In-app ──┼──────────────┼─────────────────│                  │
    │                   │                  │                  │  notification              │                 │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │  ┌─────────────────────────────┐             │                  │
    │                   │                  │                  │  │ RM UX                       │             │                  │
    │                   │                  │                  │  │                             │             │                  │
    │                   │                  │                  │  │ ┌── Pre-populated Data ───┐ │             │                  │
    │                   │                  │                  │  │ │ All extracted + verified │ │             │                  │
    │                   │                  │                  │  │ │ customer data displayed  │ │             │                  │
    │                   │                  │                  │  │ └────────────────────────┘ │             │                  │
    │                   │                  │                  │  │                             │             │                  │
    │                   │                  │                  │  │ ┌── KYC / CDD / BCAP ────┐ │             │                  │
    │                   │                  │                  │  │ │ CDD: [Upload] [Sync]   │ │             │                  │
    │                   │                  │                  │  │ │ BCAP: [Upload]          │ │             │                  │
    │                   │                  │                  │  │ │ ACRA: ✅ Verified       │ │             │                  │
    │                   │                  │                  │  │ │ Directors ID: ✅        │ │             │                  │
    │                   │                  │                  │  │ │ UBO/Guarantor: ✅       │ │             │                  │
    │                   │                  │                  │  │ └────────────────────────┘ │             │                  │
    │                   │                  │                  │  │                             │             │                  │
    │                   │                  │                  │  │ ┌── Credit Assessment ───┐ │             │                  │
    │                   │                  │                  │  │ │ CAA: (●) IRB  (○) SA   │ │             │                  │
    │                   │                  │                  │  │ │ OSCA No: [________]    │ │             │                  │
    │                   │                  │                  │  │ │ DCE Limit: [___] SGD   │ │             │                  │
    │                   │                  │                  │  │ │ DCE-PCE:  [___] SGD   │ │             │                  │
    │                   │                  │                  │  │ └────────────────────────┘ │             │                  │
    │                   │                  │                  │  │                             │             │                  │
    │                   │                  │                  │  │ ⚠️ Retail Investor Flag    │             │                  │
    │                   │                  │                  │  │ (shown if applicable)       │             │                  │
    │                   │                  │                  │  │                             │             │                  │
    │                   │                  │                  │  │ [Submit RM Review]          │             │                  │
    │                   │                  │                  │  └─────────────────────────────┘             │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │── "Submit" ─┼──────────────┼────────────────▶│                  │
    │                   │                  │                  │             │              │          A1: Compliance check      │
    │                   │                  │                  │             │              │          A1: TRIGGER Phase 4A + 4B │
    │                   │                  │                  │             │              │               SIMULTANEOUSLY       │
    │                   │                  │                  │             │              │                 │                  │
────┼───────────────────┼──────────────────┼──────────────────┼─────────────┼──────────────┼─────────────────┼──────────────────┼────
    │                   │                  │                  │             │              │                 │                  │
    │  PHASE 4A: CREDIT (Parallel)        │                  │      A5: Notify Credit    │                 │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │             │◄── In-app ───┼─────────────────│                  │
    │                   │                  │                  │             │  notification│                 │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │             │  ┌───────────────────────┐     │                  │
    │                   │                  │                  │             │  │ CREDIT UX             │     │                  │
    │                   │                  │                  │             │  │                       │     │                  │
    │                   │                  │                  │             │  │ RM Recommends:        │     │                  │
    │                   │                  │                  │             │  │  DCE: 5M SGD          │     │                  │
    │                   │                  │                  │             │  │  PCE: 2M SGD          │     │                  │
    │                   │                  │                  │             │  │                       │     │                  │
    │                   │                  │                  │             │  │ Approved Limits:      │     │                  │
    │                   │                  │                  │             │  │  DCE: [______] SGD    │     │                  │
    │                   │                  │                  │             │  │  PCE: [______] SGD    │     │                  │
    │                   │                  │                  │             │  │                       │     │                  │
    │                   │                  │                  │             │  │ [Execute Limit Setup] │     │                  │
    │                   │                  │                  │             │  │                       │     │                  │
    │                   │                  │                  │             │  │ System Status:        │     │                  │
    │                   │                  │                  │             │  │  CLS:  ⏳ → 🟢       │     │                  │
    │                   │                  │                  │             │  │  CQG:  ⏳ → 🟢       │     │                  │
    │                   │                  │                  │             │  │  IDB:  ⏳ → 🟢       │     │                  │
    │                   │                  │                  │             │  └───────────────────────┘     │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │             │── "Execute" ─┼────────────────▶│                  │
    │                   │                  │                  │             │              │          A7: CLS update ──────────▶│── CLS
    │                   │                  │                  │             │              │          A7: CQG login ───────────▶│── CQG
    │                   │                  │                  │             │              │          A7: IDB enable ──────────▶│── IDB
    │                   │                  │                  │             │              │                 │◄── Confirmations ─│
    │                   │                  │                  │             │              │          A1: Stream 4A COMPLETE    │
    │                   │                  │                  │             │              │                 │                  │
    │  PHASE 4B: TMO STATIC (Parallel — runs at same time as 4A)          │              │          A5: Notify TMO Static    │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │             │              │◄── In-app ──────│                  │
    │                   │                  │                  │             │              │  notification   │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │             │              │  ┌─────────────────────────┐       │
    │                   │                  │                  │             │              │  │ TMO STATIC UX           │       │
    │                   │                  │                  │             │              │  │                         │       │
    │                   │                  │                  │             │              │  │ Pre-populated:          │       │
    │                   │                  │                  │             │              │  │  Entity: ABC Corp Ltd   │       │
    │                   │                  │                  │             │              │  │  Account Name: DBS-CIN  │       │
    │                   │                  │                  │             │              │  │  Currency: USD          │       │
    │                   │                  │                  │             │              │  │  Platform: CQG          │       │
    │                   │                  │                  │             │              │  │                         │       │
    │                   │                  │                  │             │              │  │ [Create Account]        │       │
    │                   │                  │                  │             │              │  │                         │       │
    │                   │                  │                  │             │              │  │ System Status:          │       │
    │                   │                  │                  │             │              │  │  UBIX: ⏳ → 🟢         │       │
    │                   │                  │                  │             │              │  │  SIC:  ⏳ → 🟢         │       │
    │                   │                  │                  │             │              │  │  CV:   ⏳ → 🟢         │       │
    │                   │                  │                  │             │              │  └─────────────────────────┘       │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │             │              │── "Create" ────▶│                  │
    │                   │                  │                  │             │              │          A7: UBIX create ─────────▶│── UBIX
    │                   │                  │                  │             │              │          A7: SIC map ────────────▶│── SIC
    │                   │                  │                  │             │              │          A7: CV update ──────────▶│── CV
    │                   │                  │                  │             │              │                 │◄── Confirmations ─│
    │                   │                  │                  │             │              │          A1: Stream 4B COMPLETE    │
    │                   │                  │                  │             │              │                 │                  │
────┼───────────────────┼──────────────────┼──────────────────┼─────────────┼──────────────┼─────────────────┼──────────────────┼────
    │                   │                  │                  │             │              │                 │                  │
    │  PHASE 4 CONVERGENCE (Automated)    │                  │             │              │                 │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │             │              │          A1: Both streams done?    │
    │                   │                  │                  │             │              │          ├─ 4A: ✅ Credit DONE     │
    │                   │                  │                  │             │              │          ├─ 4B: ✅ TMO DONE        │
    │                   │                  │                  │             │              │          └─ YES → Advance Phase 5  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │             │              │          IF ONE STREAM DELAYED:    │
    │                   │                  │                  │             │              │          ├─ Dashboard shows blocker │
    │                   │                  │                  │             │              │          ├─ A5: SLA warning        │
    │                   │                  │                  │             │              │          └─ A5: Auto-escalate      │
    │                   │                  │                  │             │              │                 │                  │
────┼───────────────────┼──────────────────┼──────────────────┼─────────────┼──────────────┼─────────────────┼──────────────────┼────
    │                   │                  │                  │             │              │                 │                  │
    │  PHASE 5: WELCOME KIT & GO-LIVE (Automated)            │             │              │                 │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │             │              │          A1: Final compliance check│
    │                   │                  │                  │             │              │          ├─ All docs verified ✅    │
    │                   │                  │                  │             │              │          ├─ All sigs approved ✅    │
    │                   │                  │                  │             │              │          ├─ RM review done ✅       │
    │                   │                  │                  │             │              │          ├─ Credit done ✅          │
    │                   │                  │                  │             │              │          ├─ Account created ✅      │
    │                   │                  │                  │             │              │          └─ ALL PASS               │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │                  │             │              │          A1: Status → ACCOUNT LIVE │
    │                   │◄── In-app: ──────┼──────────────────┼─────────────┼──────────────┼──────────A5: Notify Sales Dealer  │
    │                   │  "Account Live!" │                  │             │              │                 │                  │
    │                   │                  │◄── In-app: ──────┼─────────────┼──────────────┼──────────A5: Notify Desk Support  │
    │                   │                  │  "Case closed"   │             │              │                 │                  │
    │◄── Welcome Kit ───┼──────────────────┼──────────────────┼─────────────┼──────────────┼──────────A5: Send Welcome Kit     │
    │    email          │                  │                  │             │              │          A6: Log go-live           │
    │                   │                  │                  │             │              │                 │                  │
────┼───────────────────┼──────────────────┼──────────────────┼─────────────┼──────────────┼─────────────────┼──────────────────┼────
    │                   │                  │                  │             │              │                 │                  │
    │  BACKGROUND: PHYSICAL COPY TRACKING (Continuous)        │             │              │                 │                  │
    │                   │                  │                  │             │              │                 │                  │
    │                   │                  │  Desk Support    │             │              │          A1: Monitor phys copy age │
    │                   │                  │  marks "Received"│             │              │          IF overdue:              │
    │◄── Reminder ──────┼──────────────────┼── when physical  ┼─────────────┼──────────────┼──────────A5: Reminder email       │
    │    email          │                  │   copy arrives   │             │              │                 │                  │
    │                   │                  │                  │             │              │                 │                  │
════╪═══════════════════╪══════════════════╪══════════════════╪═════════════╪══════════════╪═════════════════╪══════════════════╪════
```

---

## 3. PERSONA TOUCHPOINT SUMMARY

### 3.1 Customer (External — Email Only)

```
┌─────────────────────────────────────────────────────────────────────┐
│  CUSTOMER JOURNEY (Email Touchpoints Only)                          │
│                                                                     │
│  📧 SENDS ──────────────────────────────────────────────────────── │
│  │  Documents to functional email inbox                             │
│  │  (Soft copies / scanned physical copies)                         │
│  │                                                                  │
│  📧 RECEIVES ───────────────────────────────────────────────────── │
│  │                                                                  │
│  │  ┌─ Missing Docs Email ─────────────────────────────────────┐   │
│  │  │ "Dear Customer, the following documents are missing:     │   │
│  │  │  - General Trading Agreement                             │   │
│  │  │  - ID Proof (2 Key Directors)                            │   │
│  │  │ Please submit at your earliest convenience."             │   │
│  │  └──────────────────────────────────────────────────────────┘   │
│  │                                                                  │
│  │  ┌─ Clarification Email ───────────────────────────────────┐    │
│  │  │ "Dear Customer, we require clarification regarding the  │    │
│  │  │  signature on Schedule 8A. Please contact us."           │    │
│  │  └──────────────────────────────────────────────────────────┘   │
│  │                                                                  │
│  │  ┌─ Physical Copy Reminder ────────────────────────────────┐    │
│  │  │ "Dear Customer, physical originals for the following    │    │
│  │  │  are still pending: App Form, GTA, Schedule 1."          │    │
│  │  └──────────────────────────────────────────────────────────┘   │
│  │                                                                  │
│  │  ┌─ Welcome Kit Email ─────────────────────────────────────┐    │
│  │  │ "Dear Customer, your DCE account is now live!           │    │
│  │  │  Account details, trading platform access, and          │    │
│  │  │  next steps enclosed."                                   │    │
│  │  └──────────────────────────────────────────────────────────┘   │
│  │                                                                  │
│  📞 STATUS QUERIES ─────────────────────────────────────────────── │
│     Customer calls/emails Sales Dealer                              │
│     Sales Dealer answers instantly from Workbench                   │
│                                                                     │
│  🔮 FUTURE: Customer Portal (not in current scope)                 │
│     Self-service status tracking, document upload, limit view       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Internal Personas — Workbench Touchpoint Matrix

```
┌──────────────┬──────────┬───────────┬───────────┬──────────┬──────────┬────────────┐
│              │  SALES   │   DESK    │           │  CREDIT  │   TMO    │ MANAGEMENT │
│   FEATURE    │  DEALER  │  SUPPORT  │    RM     │   TEAM   │  STATIC  │  (Desk Hd) │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ My Cases/    │    ✅    │     ✅    │    ✅     │    ✅    │    ✅    │     ✅     │
│ Queue        │          │           │           │          │          │            │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ Case Summary │    ✅    │     ✅    │    ✅     │    ✅    │    ✅    │     ✅     │
│ (read)       │ (edit)   │ (full)    │ (review)  │ (review) │ (review) │  (read)    │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ Priority     │    ✅    │     ✅    │           │          │          │     ✅     │
│ Control      │ (set)    │ (view)    │           │          │          │  (override)│
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ Notify       │    ✅    │     ✅    │           │          │          │            │
│ Customer     │          │           │           │          │          │            │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ Document     │          │     ✅    │           │          │          │            │
│ Verification │          │           │           │          │          │            │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ Signature    │          │     ✅    │           │          │          │            │
│ Review Panel │          │ (approve) │           │          │          │            │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ Physical     │          │     ✅    │           │          │          │            │
│ Copy Tracker │          │           │           │          │          │            │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ KYC/CDD/BCAP │          │           │    ✅     │          │          │            │
│ Panel        │          │           │           │          │          │            │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ Credit       │          │           │    ✅     │    ✅    │          │            │
│ Assessment   │          │           │ (recommend)│ (approve)│          │            │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ Limit Setup  │          │           │           │    ✅    │          │            │
│ & Execute    │          │           │           │          │          │            │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ Account      │          │           │           │          │    ✅    │            │
│ Creation     │          │           │           │          │          │            │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ System       │          │           │           │    ✅    │    ✅    │            │
│ Confirmations│          │ (view all)│           │(CLS/CQG) │(UBIX/SIC)│            │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ Auth Traders │          │     ✅    │           │          │          │            │
│ Queue        │          │ (approve) │           │          │          │            │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ SLA/Ageing   │    ✅    │     ✅    │    ✅     │    ✅    │    ✅    │     ✅     │
│ Dashboard    │ (my cases)│ (all)    │ (my cases)│(my cases)│(my cases)│   (all)    │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ Escalation   │          │     ✅    │           │          │          │     ✅     │
│ Panel        │          │ (trigger) │           │          │          │  (receive) │
├──────────────┼──────────┼───────────┼───────────┼──────────┼──────────┼────────────┤
│ Audit Trail  │          │     ✅    │           │          │          │     ✅     │
│ View         │          │           │           │          │          │            │
└──────────────┴──────────┴───────────┴───────────┴──────────┴──────────┴────────────┘
```

---

## 4. PHASE-BY-PHASE — PERSONA RESPONSIBILITY MAP

```
╔══════════════════╦═══════════╦═══════════╦═══════════╦══════════╦══════════╦═══════════╦═══════════╗
║                  ║           ║   DESK    ║           ║          ║   TMO    ║           ║           ║
║ PHASE            ║  SALES    ║  SUPPORT  ║    RM     ║  CREDIT  ║  STATIC  ║ CUSTOMER  ║ AI AGENTS ║
╠══════════════════╬═══════════╬═══════════╬═══════════╬══════════╬══════════╬═══════════╬═══════════╣
║ 0: Ingestion     ║           ║           ║           ║          ║          ║  Submits  ║ A2,A3,A6  ║
║                  ║           ║           ║           ║          ║          ║  docs     ║ AUTOMATED ║
╠══════════════════╬═══════════╬═══════════╬═══════════╬══════════╬══════════╬═══════════╬═══════════╣
║ 1: Sales Review  ║ CONFIRMS  ║           ║           ║          ║          ║  Receives ║ A1,A5,A6  ║
║                  ║ data,     ║           ║           ║          ║          ║  missing  ║           ║
║                  ║ sets      ║           ║           ║          ║          ║  doc email║           ║
║                  ║ priority  ║           ║           ║          ║          ║           ║           ║
╠══════════════════╬═══════════╬═══════════╬═══════════╬══════════╬══════════╬═══════════╬═══════════╣
║ 2: Doc & Sig     ║           ║ REVIEWS   ║           ║          ║          ║  Receives ║ A1,A4,    ║
║    Verification  ║           ║ AI output ║           ║          ║          ║  clarify  ║ A5,A6     ║
║                  ║           ║ APPROVES  ║           ║          ║          ║  email    ║           ║
║                  ║           ║ sigs      ║           ║          ║          ║           ║           ║
╠══════════════════╬═══════════╬═══════════╬═══════════╬══════════╬══════════╬═══════════╬═══════════╣
║ 3: RM Review     ║           ║           ║ REVIEWS   ║          ║          ║           ║ A1,A5,A6  ║
║                  ║           ║           ║ KYC/CDD   ║          ║          ║           ║           ║
║                  ║           ║           ║ RECOMMENDS║          ║          ║           ║           ║
║                  ║           ║           ║ limits    ║          ║          ║           ║           ║
╠══════════════════╬═══════════╬═══════════╬═══════════╬══════════╬══════════╬═══════════╬═══════════╣
║ 4A: Credit       ║           ║           ║           ║ APPROVES ║          ║           ║ A1,A7,    ║
║    (parallel)    ║           ║           ║           ║ limits,  ║          ║           ║ A5,A6     ║
║                  ║           ║           ║           ║ EXECUTES ║          ║           ║           ║
╠══════════════════╬═══════════╬═══════════╬═══════════╬══════════╬══════════╬═══════════╬═══════════╣
║ 4B: TMO Static   ║           ║           ║           ║          ║ CONFIRMS ║           ║ A1,A7,    ║
║    (parallel)    ║           ║           ║           ║          ║ data,    ║           ║ A5,A6     ║
║                  ║           ║           ║           ║          ║ CREATES  ║           ║           ║
╠══════════════════╬═══════════╬═══════════╬═══════════╬══════════╬══════════╬═══════════╬═══════════╣
║ 4: Convergence   ║           ║           ║           ║          ║          ║           ║ A1,A5,A6  ║
║                  ║           ║           ║           ║          ║          ║           ║ AUTOMATED ║
╠══════════════════╬═══════════╬═══════════╬═══════════╬══════════╬══════════╬═══════════╬═══════════╣
║ 5: Welcome Kit   ║  Receives ║  Receives ║           ║          ║          ║  Receives ║ A1,A5,A6  ║
║   & Go-Live      ║  in-app   ║  in-app   ║           ║          ║          ║  Welcome  ║ AUTOMATED ║
║                  ║  "Live!"  ║  "Closed" ║           ║          ║          ║  Kit email║           ║
╠══════════════════╬═══════════╬═══════════╬═══════════╬══════════╬══════════╬═══════════╬═══════════╣
║ 6: Auth Traders  ║           ║ REVIEWS   ║           ║          ║          ║  Submits  ║ A2,A3,A4  ║
║  (post-opening)  ║           ║ APPROVES  ║           ║          ║          ║  mandate  ║ A5,A6     ║
║                  ║           ║ traders   ║           ║          ║          ║  letter   ║           ║
╠══════════════════╬═══════════╬═══════════╬═══════════╬══════════╬══════════╬═══════════╬═══════════╣
║ 7: Phys Copy     ║           ║ MARKS     ║           ║          ║          ║  Receives ║ A1,A5,A6  ║
║    Tracking      ║           ║ received  ║           ║          ║          ║  reminder ║           ║
║  (background)    ║           ║           ║           ║          ║          ║  email    ║           ║
╚══════════════════╩═══════════╩═══════════╩═══════════╩══════════╩══════════╩═══════════╩═══════════╝
```

---

## 5. UX DECISION POINTS — HUMAN-IN-THE-LOOP MAP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HUMAN DECISION POINTS — Where AI Assists, Human Decides                    │
│                                                                             │
│  PHASE 1 ─ Sales Dealer                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Decision: Confirm customer data + product requirements              │    │
│  │ AI Input: Pre-extracted from documents (OCR + classification)       │    │
│  │ UX: Editable fields with AI-populated defaults + [Confirm] button   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Decision: Set case priority                                         │    │
│  │ AI Input: None — purely human judgement                             │    │
│  │ UX: Dropdown [Normal / High / Urgent]                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Decision: Notify customer of missing documents or submit for review │    │
│  │ AI Input: Checklist showing complete ✅ / missing ❌               │    │
│  │ UX: [Notify Customer] or [Submit for Review] buttons                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  PHASE 2 ─ Desk Support                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Decision: Approve / Reject / Clarify each signature                 │    │
│  │ AI Input: Confidence score + side-by-side comparison + authority     │    │
│  │           check (is signer an authorised director?)                  │    │
│  │ UX: Signature panel with [Approve] [Reject] [Clarify] per signer   │    │
│  │ Criticality: HIGH — this is the key human-in-the-loop gate         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  PHASE 3 ─ RM                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Decision: KYC/CDD/BCAP clearance + Credit Assessment recommendation │    │
│  │ AI Input: Pre-extracted data, document summaries                    │    │
│  │ UX: Structured form — clearance toggles + CAA radio + limit fields  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  PHASE 4A ─ Credit                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Decision: Approve final DCE + DCE-PCE limits                        │    │
│  │ AI Input: RM recommendations displayed alongside                    │    │
│  │ UX: Editable limit fields + [Execute Limit Setup] — one-click      │    │
│  │     triggers CLS + CQG + IDB automatically                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  PHASE 4B ─ TMO Static                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Decision: Confirm account details                                   │    │
│  │ AI Input: Pre-populated from document extraction                    │    │
│  │ UX: Editable fields + [Create Account] — one-click triggers        │    │
│  │     UBIX + SIC + CV automatically                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  PHASE 6 ─ Desk Support (Auth Traders)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Decision: Approve / Reject each authorised trader                   │    │
│  │ AI Input: AI-extracted trader details + signature verification      │    │
│  │ UX: Trader table with [Approve] [Reject] per trader                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. AUTOMATED TOUCHPOINTS — ZERO HUMAN INVOLVEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FULLY AUTOMATED — No Human Touch Required                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Phase 0: Email monitoring + document extraction + OCR +             │    │
│  │          classification + data extraction + checklist validation    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Phase 4 Convergence: Parallel stream tracking + completion          │    │
│  │          detection + auto-advancement to Phase 5                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Phase 5: Final compliance check + Welcome Kit generation +          │    │
│  │          dispatch to customer + notifications to all internal teams │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Background: SLA monitoring + ageing calculation + auto-reminders +  │    │
│  │             auto-escalation + physical copy tracking reminders      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Always-on: Audit logging — every action, every agent, every human   │    │
│  │            decision recorded with full evidence chain               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. NOTIFICATION FLOW — WHO GETS WHAT

```
┌──────────────────────────┬──────────────┬─────────────────────────────────────────────┐
│ EVENT                    │ CHANNEL      │ RECIPIENTS                                  │
├──────────────────────────┼──────────────┼─────────────────────────────────────────────┤
│ New case created         │ In-app       │ Sales Dealer                                │
│ Missing docs identified  │ Email        │ Customer (via Sales Dealer trigger)          │
│ Case submitted to review │ In-app       │ Desk Support                                │
│ Signature clarification  │ Email        │ Customer (via Desk Support trigger)          │
│ Case submitted to RM     │ In-app       │ Assigned RM                                 │
│ RM review submitted      │ In-app       │ Credit Team + TMO Static (simultaneously)   │
│ Credit stream complete   │ In-app       │ Desk Support (dashboard update)              │
│ TMO stream complete      │ In-app       │ Desk Support (dashboard update)              │
│ Account go-live          │ In-app       │ Sales Dealer + Desk Support                 │
│ Welcome Kit              │ Email        │ Customer                                    │
│ SLA warning              │ In-app       │ Assigned team member                        │
│ SLA breach               │ In-app+Email │ Team lead + DCE Sales Desk Head             │
│ Physical copy overdue    │ Email        │ Customer + Sales Dealer                     │
│ Case flagged RED         │ In-app       │ All views — dashboard highlight             │
│ Auth trader approved     │ In-app       │ Desk Support (confirmation)                 │
└──────────────────────────┴──────────────┴─────────────────────────────────────────────┘
```

---

## 8. SPEED COMPARISON — AS-IS vs TO-BE PER PHASE

```
┌──────────────────────────────────┬───────────────────┬───────────────────┐
│ PHASE                            │ AS-IS             │ TO-BE             │
├──────────────────────────────────┼───────────────────┼───────────────────┤
│ 0: Document Ingestion            │ Hours (manual     │ Seconds           │
│                                  │ email processing) │ (automated)       │
├──────────────────────────────────┼───────────────────┼───────────────────┤
│ 1: Sales Dealer Review           │ Hours–Days        │ Minutes           │
│                                  │ (email back-forth)│ (in-app confirm)  │
├──────────────────────────────────┼───────────────────┼───────────────────┤
│ 2: Doc & Signature Verification  │ Hours–Days        │ Minutes           │
│                                  │ (manual check +   │ (AI pre-analysis  │
│                                  │  email forwarding)│ + human approve)  │
├──────────────────────────────────┼───────────────────┼───────────────────┤
│ 3: RM Review                     │ 1–3 Days          │ Hours             │
│                                  │ (email queue +    │ (instant task +   │
│                                  │  manual review)   │ pre-populated)    │
├──────────────────────────────────┼───────────────────┼───────────────────┤
│ 4A: Credit                       │ 1–3 Days          │ Hours             │
│                                  │ (email + manual   │ (one-click +      │
│                                  │  system updates)  │ auto integration) │
├──────────────────────────────────┼───────────────────┼───────────────────┤
│ 4B: TMO Static                   │ 1–2 Days          │ Minutes           │
│                                  │ (email + manual   │ (one-click +      │
│                                  │  UBIX entry)      │ auto integration) │
├──────────────────────────────────┼───────────────────┼───────────────────┤
│ 4: Convergence                   │ Unknown           │ Instant           │
│                                  │ (no tracking)     │ (auto-detected)   │
├──────────────────────────────────┼───────────────────┼───────────────────┤
│ 5: Welcome Kit                   │ Hours             │ Instant           │
│                                  │ (manual email)    │ (auto-generated)  │
├──────────────────────────────────┼───────────────────┼───────────────────┤
│ ═══════════════════════════════  │ ═════════════════ │ ═════════════════ │
│ TOTAL END-TO-END                 │ 3–15 DAYS         │ SAME DAY (HOURS)  │
└──────────────────────────────────┴───────────────────┴───────────────────┘
```

---

*This flow diagram complements DCE_TOBE_Process.md. Together they provide the complete TO-BE solution view from both process and experience perspectives.*

*End of document*
