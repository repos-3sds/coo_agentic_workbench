# KB_NPA_State_Machine.md
## Workflow State Machine & Business Rules for NPA Process

**Document Version:** 1.0  
**Last Updated:** December 31, 2025  
**Purpose:** Complete state machine logic for LLM agents to validate workflow transitions and enforce business rules

---

## Table of Contents

1. [Overview & State Machine Principles](#1-overview--state-machine-principles)
2. [State Definitions](#2-state-definitions)
3. [Valid State Transitions](#3-valid-state-transitions)
4. [Business Rules](#4-business-rules)
5. [Loop-Back Scenarios](#5-loop-back-scenarios)
6. [Circuit Breaker Rules](#6-circuit-breaker-rules)
7. [SLA & Timeout Rules](#7-sla--timeout-rules)
8. [Edge Cases & Exceptions](#8-edge-cases--exceptions)
9. [State Transition Examples](#9-state-transition-examples)

---

## 1. Overview & State Machine Principles

### What is a State Machine?

A **state machine** defines:
1. **All possible states** an NPA can be in (e.g., Draft, Pending Approvals, Approved)
2. **Valid transitions** between states (e.g., Draft → Pending Classification is valid, but Draft → Approved is NOT)
3. **Business rules** that govern when transitions can occur
4. **Actions** triggered by state changes (e.g., send notifications, create approval tasks)

### Core Principles

**Principle 1: Deterministic Transitions**
- Every state has a **defined set of valid next states**
- Invalid transitions are **BLOCKED** (e.g., cannot skip from Draft directly to Approved)

**Principle 2: One Active State**
- An NPA is in **exactly one state** at any given time
- State changes are **atomic** (no partial transitions)

**Principle 3: Audit Trail**
- Every state change is **logged** with timestamp, actor, and reason
- Complete history enables **rollback** and **forensics**

**Principle 4: Terminal States**
- Some states are **final** (no further transitions allowed)
- Terminal states: Approved, Rejected, Withdrawn, Prohibited, Archived

**Principle 5: Loop-Back Protection**
- **Circuit breaker** prevents infinite loops (max 3 loop-backs)
- After 3 loop-backs → **Escalate** to senior management

---

## 2. State Definitions

### State 1: Draft

**Description:**  
Initial state where Maker is creating/editing the NPA form.

**Who Can Access:**  
- Maker (creator) - **Read/Write**
- NPA Champion (assigned) - **Read Only**

**Allowed Actions:**
- Save progress (auto-save every 30 seconds)
- Submit for classification
- Withdraw (delete draft)

**Timeout Rule:**  
- If Draft for >30 days → Send reminder to Maker
- If Draft for >45 days → Auto-withdraw with notification

**Valid Next States:**
- `Pending_Classification` (action: Maker clicks "Submit")
- `Withdrawn` (action: Maker clicks "Withdraw" OR timeout after 45 days)

**Business Logic:**
```
When entering Draft state:
  - Assign Maker as owner
  - Initialize all fields as blank/default
  - Create auto-save job (every 30 seconds)
  - Set reminder job (30 days from creation)
  
When exiting Draft state:
  - Validate required fields (product name, notional, counterparty)
  - If validation fails → Block transition, show error
  - If validation passes → Allow transition to Pending_Classification
```

---

### State 2: Pending_Classification

**Description:**  
Automated classification in progress (Classification Router Agent is executing).

**Who Can Access:**  
- System only (no human interaction)

**Allowed Actions:**
- None (fully automated state)

**Duration:**  
- Expected: <30 seconds
- Max: 2 minutes (if exceeded → Escalate to NPA Champion)

**Valid Next States:**
- `Classified_Full_NPA` (Classification result: Full NPA)
- `Classified_NPA_Lite` (Classification result: NPA Lite)
- `Classified_Bundling` (Classification result: Bundling)
- `Classified_Evergreen` (Classification result: Evergreen)
- `Prohibited` (Classification result: Prohibited product - **TERMINAL**)

**Business Logic:**
```
When entering Pending_Classification state:
  - Call Classification Router Agent with NPA data
  - Agent executes two-stage classification:
    * Stage 1: Product Type (NTG / Variation / Existing)
    * Stage 2: Approval Track (Full NPA / NPA Lite / Bundling / Evergreen / Prohibited)
  
  - Agent returns:
    {
      "classification": "Full NPA",
      "confidence": 0.92,
      "required_approvers": ["Credit", "Finance", "Legal", "MLR", "Operations", "Technology"],
      "reasoning": "Cross-border FX Option...",
      "estimated_timeline": 7
    }
  
When exiting Pending_Classification state:
  - Store classification result in database
  - If Prohibited → Transition to Prohibited (TERMINAL, notify Maker immediately)
  - Else → Transition to appropriate Classified_* state
  - Notify Maker: "Your NPA has been classified as [X]"
```

---

### State 3: Classified_Full_NPA

**Description:**  
Classified as Full NPA, awaiting Maker confirmation before proceeding to approvals.

**Who Can Access:**  
- Maker - **Read/Write**
- NPA Champion - **Read Only**

**Allowed Actions:**
- **Confirm** classification and proceed to approvals
- **Challenge** classification (request manual review)
- **Withdraw** NPA

**Why Confirmation Needed:**  
- Maker may disagree with classification (e.g., thinks it should be NPA Lite)
- Gives Maker opportunity to add missing info before approvals start
- Prevents wasted approver time if Maker realizes NPA needs changes

**Valid Next States:**
- `Pending_Approvals` (action: Maker clicks "Confirm & Proceed")
- `Manual_Review` (action: Maker clicks "Challenge Classification")
- `Withdrawn` (action: Maker withdraws)

**Business Logic:**
```
When entering Classified_Full_NPA state:
  - Display classification result to Maker:
    * Approval Track: Full NPA
    * Required Approvers: [List]
    * Estimated Timeline: 7-12 days
    * Reasoning: "Cross-border products require..."
  
  - Present options:
    [Confirm & Proceed] [Challenge Classification] [Withdraw]
  
When Maker confirms:
  - Validate NPA completeness (all required fields filled)
  - If incomplete → Block, show validation errors
  - If complete → Transition to Pending_Approvals
  
When Maker challenges:
  - Prompt for challenge reason
  - Transition to Manual_Review
  - Notify NPA Champion: "Classification challenged by Maker"
```

---

### State 4: Classified_NPA_Lite

**Description:**  
Classified as NPA Lite, awaiting Maker confirmation.

**Who Can Access:**  
- Maker - **Read/Write**

**Allowed Actions:**
- Confirm and proceed
- Challenge classification
- Withdraw

**Valid Next States:**
- `Pending_Approvals` (action: Confirm)
- `Manual_Review` (action: Challenge)
- `Withdrawn` (action: Withdraw)

**Business Logic:**  
(Same as Classified_Full_NPA, but with NPA Lite approval requirements)

---

### State 5: Classified_Bundling

**Description:**  
Classified as Bundling submission, requires Bundling Arbitration Team review.

**Who Can Access:**  
- Maker - **Read Only**
- Bundling Arbitration Team - **Read/Write**

**Allowed Actions:**
- Bundling Team reviews bundling approach
- Bundling Team decides: Approve as bundle OR Split into separate NPAs

**Valid Next States:**
- `Pending_Approvals` (if Bundling Team approves bundle approach)
- `Split_NPAs` (if Bundling Team decides to split) - creates multiple separate NPAs
- `Withdrawn` (if Maker withdraws)

**Business Logic:**
```
When entering Classified_Bundling state:
  - Notify Bundling Arbitration Team
  - Display bundle components:
    * Component 1: FX Forward $10M (Tier 2)
    * Component 2: IRS $15M (Tier 2)
    * Component 3: Commodity Hedge $5M (Variation, Tier 2)
    * Aggregate: $30M
  
  - Bundling Team evaluates:
    * Are products related (hedging relationship)?
    * Does bundling create new risk?
    * Should be approved together or separately?
  
When Bundling Team decides:
  - If "Approve as bundle" → Transition to Pending_Approvals (aggregate approvers)
  - If "Split into separate NPAs" → Create 3 new NPAs, transition each to Draft
```

---

### State 6: Classified_Evergreen

**Description:**  
Classified as Evergreen (pre-approved), auto-approved if within limits.

**Who Can Access:**  
- Maker - **Read Only** (informational)
- System - Auto-processes

**Allowed Actions:**
- System checks Evergreen limits (notional cap, deal count, aggregate, rating)
- If ALL limits pass → Auto-approve
- If ANY limit fails → Downgrade to NPA Lite

**Valid Next States:**
- `Approved` (if all Evergreen limits pass - **AUTO-APPROVED**)
- `Classified_NPA_Lite` (if any Evergreen limit fails - **DOWNGRADE**)

**Business Logic:**
```
When entering Classified_Evergreen state:
  - Check Evergreen eligibility (6 criteria):
    1. Product on Evergreen list? (e.g., "Standard FX Forward EUR/USD")
    2. Notional <= $10M cap?
    3. Aggregate <= $500M annual cap?
    4. Deal count <= 10/month cap?
    5. Counterparty rating >= A-?
    6. No variations from pre-approved structure?
  
  IF (ALL criteria PASS):
    - Transition to Approved (auto-approved, < 1 hour)
    - Log transaction in Evergreen usage tracker
    - Update aggregate counters (YTD notional, monthly deal count)
    - Notify Maker: "Your NPA is Evergreen auto-approved. Trade immediately."
  
  ELSE (ANY criterion FAILS):
    - Identify failed criterion (e.g., "Notional $12M exceeds cap $10M")
    - Transition to Classified_NPA_Lite (downgrade)
    - Notify Maker: "NPA exceeds Evergreen limits. Proceeding as NPA Lite."
```

---

### State 7: Manual_Review

**Description:**  
Maker challenged classification OR Agent confidence <75%, requires human review.

**Who Can Access:**  
- NPA Champion - **Read/Write** (decision maker)
- GFM COO - **Read Only** (escalation)
- Maker - **Read Only**

**Allowed Actions:**
- NPA Champion reviews classification
- NPA Champion decides: Confirm classification OR Override to different track

**Valid Next States:**
- `Classified_Full_NPA` (if Champion confirms Full NPA)
- `Classified_NPA_Lite` (if Champion overrides to NPA Lite)
- `Classified_Bundling` (if Champion decides bundling needed)
- `Withdrawn` (if Champion rejects NPA as invalid)

**Business Logic:**
```
When entering Manual_Review state:
  - Notify NPA Champion
  - Display:
    * Original AI classification: "Full NPA" (confidence 0.82)
    * Maker's challenge reason: "I believe this is NPA Lite because..."
    * AI reasoning: "Cross-border flag triggered Full NPA per Rule 2"
  
  - NPA Champion evaluates:
    * Is AI correct?
    * Is Maker's challenge valid?
  
When Champion decides:
  - If "Confirm AI classification" → Transition to Classified_Full_NPA
  - If "Override to NPA Lite" → Transition to Classified_NPA_Lite
  - Log override reason for future ML training
```

---

### State 8: Pending_Approvals

**Description:**  
NPA is in parallel approval stage. All required approvers are reviewing simultaneously.

**Who Can Access:**  
- Maker - **Read Only** (can view status, answer questions)
- Approvers (Credit, Finance, Legal, etc.) - **Read/Write**
- NPA Champion - **Read Only** (monitor progress)

**Allowed Actions:**
- **Approvers:** Approve / Reject / Request Changes (loop-back)
- **Maker:** Respond to approver questions via comments
- **System:** Monitor SLA, send reminders, escalate if needed

**Valid Next States:**
- `Approved` (if ALL approvers approve)
- `Rejected` (if ANY approver rejects - **TERMINAL**)
- `Loop_Back_to_Maker` (if ANY approver requests changes)
- `Escalated` (if SLA breached OR dependency deadlock)

**Business Logic:**
```
When entering Pending_Approvals state:
  - Get required approvers from KB_NPA_Approval_Matrix (based on classification)
  - Create approval tasks for each approver (parallel):
    * Credit (VP): SLA 48 hours
    * Finance (Head of Finance): SLA 48 hours
    * Legal (VP): SLA 48 hours
    * MLR (VP): SLA 48 hours
    * Operations (Ops Head): SLA 48 hours
    * Technology (Tech Lead): SLA 48 hours
  
  - Send notification to ALL approvers simultaneously
  - Start SLA timers for each approver (48 hours)
  - Display real-time dashboard to Maker:
    âœ… Credit (approved 1.2 days)
    â³ Finance (pending, 1.5 days elapsed)
    âœ… Legal (approved 0.8 days)
    ...
  
When approver makes decision:
  - If APPROVE:
    * Mark approval as received
    * Check if ALL approvals received → If yes, transition to Approved
    * If not all → Continue waiting
  
  - If REJECT:
    * Mark overall NPA status as Rejected
    * Store rejection reason
    * Transition to Rejected (TERMINAL)
    * Notify all parties (Maker, NPA Champion, other approvers)
  
  - If REQUEST CHANGES:
    * Increment loop_back_count
    * Store requested changes
    * Transition to Loop_Back_to_Maker
```

---

### State 9: Loop_Back_to_Maker

**Description:**  
One or more approvers requested changes/clarifications. Maker must revise NPA and resubmit.

**Who Can Access:**  
- Maker - **Read/Write** (revise NPA, respond to comments)
- Original approvers - **Read Only** (view Maker's responses)
- NPA Champion - **Read Only** (monitor)

**Allowed Actions:**
- Maker updates NPA fields
- Maker uploads additional documents
- Maker responds to approver comments
- Maker resubmits for approval

**Circuit Breaker:**  
- If `loop_back_count >= 3` → Transition to `Escalated` (not back to Pending_Approvals)

**Valid Next States:**
- `Pending_Approvals` (after Maker resubmits AND loop_back_count < 3)
- `Escalated` (if loop_back_count >= 3 - **CIRCUIT BREAKER**)
- `Withdrawn` (if Maker withdraws)

**Business Logic:**
```
When entering Loop_Back_to_Maker state:
  - Display requested changes from approvers:
    * Finance: "ROAE calculation unclear - need sensitivity analysis"
    * Legal: "Missing cross-border legal memo for Hong Kong jurisdiction"
  
  - Maker revises NPA:
    * Updates ROAE section with 3 scenarios
    * Uploads legal memo from Hong Kong counsel
    * Responds to comments: "ROAE updated per Finance request, legal memo attached"
  
When Maker clicks "Resubmit":
  - Increment loop_back_count (was 1, now 2)
  - Check circuit breaker:
    IF loop_back_count >= 3:
      → Transition to Escalated (STOP normal workflow)
      → Notify GFM COO + NPA Governance Forum
    ELSE:
      → Transition to Pending_Approvals (restart approvals)
      → Notify SAME approvers (not all - only those who requested changes)
      → Preserve previous approvals (Credit approved in iteration 1 → still valid)
```

---

### State 10: Approved

**Description:**  
All approvers have signed off. NPA is approved and can be launched.

**Who Can Access:**  
- Maker - **Read Only**
- All approvers - **Read Only**
- Operations (for launch preparation) - **Read/Write**

**Allowed Actions:**
- Maker downloads approval documentation
- System generates credit memo, risk reports
- Operations prepares product for launch (system configuration, testing)

**Valid Next States:**
- `Live` (once product launches)
- `Archived` (if product never launches before validity expires)

**Business Logic:**
```
When entering Approved state:
  - Record approval date
  - Set validity expiry date (1 year from approval, or 3 years if Evergreen)
  - Generate approval documentation:
    * Approval memo (all sign-offs)
    * Credit memo (counterparty limits)
    * Legal confirmation (documentation approved)
  
  - Notify Maker: "Congratulations! Your NPA is approved. Validity: 1 year."
  - Notify Operations: "NPA TSG2025-042 ready for launch preparation"
  - Schedule PIR reminder (if required - NTG products, 6 months from launch)
  - Schedule validity expiry warning (30 days before expiry)
```

---

### State 11: Rejected

**Description:**  
At least one approver rejected the NPA. **TERMINAL STATE** (no further transitions).

**Who Can Access:**  
- Maker - **Read Only**
- All approvers - **Read Only**

**Allowed Actions:**
- Maker views rejection reason
- Maker can create NEW NPA (learning from rejection)

**Valid Next States:**
- None (terminal state)

**Business Logic:**
```
When entering Rejected state:
  - Record rejection date and reason
  - Display rejection details to Maker:
    * Approver: Finance (Head of Finance)
    * Rejection Date: 2024-12-18
    * Reason: "ROAE below minimum threshold (3.2% vs 5.0% required). 
               Product not economically viable. Recommend reducing costs 
               or increasing pricing."
  
  - Notify all parties (Maker, NPA Champion, all approvers)
  - Archive NPA (read-only, no further changes)
  - Suggest to Maker: "Would you like to create a new NPA with revised terms?"
```

---

### State 12: Withdrawn

**Description:**  
Maker voluntarily withdrew the NPA. **TERMINAL STATE**.

**Who Can Access:**  
- Maker - **Read Only**

**Allowed Actions:**
- None (terminal state)

**Valid Next States:**
- None (terminal state)

**Business Logic:**
```
When entering Withdrawn state:
  - Record withdrawal date and reason (optional)
  - If in Pending_Approvals → Notify all approvers: "NPA withdrawn by Maker"
  - Archive NPA
  - Free up Maker's NPA quota (if applicable)
```

---

### State 13: Prohibited

**Description:**  
Product flagged as prohibited by policy/regulation. **TERMINAL STATE** (HARD STOP).

**Who Can Access:**  
- Maker - **Read Only**
- Compliance - **Read Only**

**Allowed Actions:**
- Maker views prohibition reason
- Maker contacts Compliance if they believe there's an error

**Valid Next States:**
- None (terminal state, HARD STOP)

**Business Logic:**
```
When entering Prohibited state:
  - Display prohibition details:
    * Prohibition Source: MAS Notice 1015 (Singapore regulator)
    * Reason: "Retail distribution of complex derivatives prohibited without 
               accreditation. Product involves barrier options which are 
               considered complex."
    * Affected Jurisdictions: Singapore, Hong Kong
  
  - Notify Maker immediately (HIGH PRIORITY):
    "Your NPA has been flagged as PROHIBITED. You cannot proceed with this product."
  
  - Notify Compliance: "Prohibited product attempt logged"
  - Log attempt for compliance audit trail
  - Suggest alternatives: "Consider institutional-only distribution OR 
                           vanilla options (non-barrier)"
```

---

### State 14: Escalated

**Description:**  
NPA escalated due to circuit breaker (3+ loop-backs) OR complex issue requiring senior review.

**Who Can Access:**  
- GFM COO - **Read/Write** (decision maker)
- NPA Governance Forum - **Read/Write**
- Maker - **Read Only**
- All previous approvers - **Read Only**

**Allowed Actions:**
- Senior management reviews NPA
- Decides: Provide guidance & resume OR Override & approve OR Reject

**Valid Next States:**
- `Pending_Approvals` (if Forum provides guidance, Maker revises, resumes approvals)
- `Approved` (if Forum overrides and approves with conditions)
- `Rejected` (if Forum rejects NPA as unsuitable)

**Business Logic:**
```
When entering Escalated state:
  - Notify GFM COO + NPA Governance Forum (URGENT)
  - Display escalation details:
    * Escalation Trigger: Circuit Breaker (loop_back_count = 3)
    * Iteration History:
      - Iteration 1 (Day 2): Checker rejection - "Risk assessment incomplete"
      - Iteration 2 (Day 7): Finance rejection - "ROAE calculation unclear"
      - Iteration 3 (Day 13): Legal rejection - "Cross-border jurisdiction issue"
    * Pattern Analysis: Multiple departments, different issues each time
    * Root Cause: Unclear requirements OR complex edge case
  
  - NPA Governance Forum reviews within 48 hours
  - Forum options:
    * Option 1: Provide detailed guidance to Maker, resume workflow
    * Option 2: Override and approve with conditions
    * Option 3: Reject NPA as unsuitable
  
When Forum decides:
  - If "Provide Guidance":
    * Send guidance to Maker (e.g., "Legal memo template for cross-border")
    * Reset loop_back_count to 0 (fresh start)
    * Transition to Pending_Approvals (Maker revises per guidance)
  
  - If "Override & Approve":
    * Record override reason and conditions
    * Transition to Approved (expedited, senior approval)
  
  - If "Reject":
    * Record rejection reason
    * Transition to Rejected (terminal)
```

---

### State 15: Live

**Description:**  
Product has launched and is actively being traded.

**Who Can Access:**  
- All (read-only for reporting)
- Operations (for monitoring)

**Allowed Actions:**
- Monitor trading activity
- Track PIR milestones (if NTG product)
- Generate post-launch reports

**Valid Next States:**
- `PIR_Required` (if NTG product, 6 months after launch)
- `Archived` (if validity expires and product not traded)

**Business Logic:**
```
When entering Live state:
  - Record launch date
  - If NTG product:
    * Schedule PIR (6 months from launch)
    * Set PIR reminder (5 months from launch)
  
  - Track trading activity:
    * Notional traded YTD
    * Deal count
    * P&L impact
  
  - Monitor for issues:
    * Operational failures
    * Customer complaints
    * Regulatory findings
```

---

### State 16: PIR_Required

**Description:**  
NTG product launched 6 months ago, Post-Implementation Review (PIR) is now mandatory.

**Who Can Access:**  
- Maker - **Read/Write** (submit PIR report)
- Original approvers - **Read/Write** (review PIR)
- NPA Champion - **Read Only**

**Allowed Actions:**
- Maker submits PIR report (actual vs projected performance)
- Original approvers review PIR
- Approvers decide: PIR Approved OR PIR Requires Corrective Action

**Valid Next States:**
- `PIR_Approved` (if PIR satisfactory)
- `PIR_Corrective_Action` (if issues found requiring NPA amendment)

**Business Logic:**
```
When entering PIR_Required state:
  - Notify Maker: "PIR due for NPA TSG1917 (launched 6 months ago)"
  - Provide PIR template:
    * Projected trading volume: 100 deals
    * Actual trading volume: 60 deals (60% of projection)
    * Projected revenue: $2M
    * Actual revenue: $1.3M (65% of projection)
    * Issues encountered: [List operational issues]
    * Lessons learned: [What would you change?]
  
When Maker submits PIR:
  - Notify original approvers (Credit, Finance, Legal, MLR, Ops, Tech)
  - Approvers review:
    * If performance acceptable → PIR Approved
    * If significant deviation → PIR Requires Corrective Action
```

---

### State 17: PIR_Approved

**Description:**  
PIR completed and approved by all original approvers.

**Who Can Access:**  
- All (read-only for audit)

**Allowed Actions:**
- Archive PIR report
- Continue monitoring product (no changes needed)

**Valid Next States:**
- `Live` (continue normal operations)
- `Archived` (if validity expires)

---

### State 18: PIR_Corrective_Action

**Description:**  
PIR identified issues requiring NPA amendment (e.g., volume projections too high).

**Who Can Access:**  
- Maker - **Read/Write**
- Original approvers - **Read/Write**

**Allowed Actions:**
- Maker proposes NPA amendments
- Approvers review amendments (expedited process)

**Valid Next States:**
- `Pending_Approvals` (expedited re-approval of amendments)
- `Live` (if amendments approved)

---

### State 19: Archived

**Description:**  
NPA approved but product never launched before validity expired. **TERMINAL STATE**.

**Who Can Access:**  
- All (read-only for historical reference)

**Allowed Actions:**
- View archived NPA for reference
- Reactivate if needed (creates NEW NPA based on archived one)

**Valid Next States:**
- None (terminal state, but can spawn new NPA if reactivated)

---

## 3. Valid State Transitions

### Transition Rules

**From Draft:**
```
Draft
├─→ Pending_Classification (action: submit)
└─→ Withdrawn (action: withdraw OR timeout after 45 days)
```

**From Pending_Classification:**
```
Pending_Classification (automated, <30 seconds)
├─→ Classified_Full_NPA
├─→ Classified_NPA_Lite
├─→ Classified_Bundling
├─→ Classified_Evergreen
└─→ Prohibited (TERMINAL)
```

**From Classified_Full_NPA:**
```
Classified_Full_NPA
├─→ Pending_Approvals (action: Maker confirms)
├─→ Manual_Review (action: Maker challenges)
└─→ Withdrawn (action: Maker withdraws)
```

**From Classified_NPA_Lite:**
```
Classified_NPA_Lite
├─→ Pending_Approvals (action: Maker confirms)
├─→ Manual_Review (action: Maker challenges)
└─→ Withdrawn (action: Maker withdraws)
```

**From Classified_Bundling:**
```
Classified_Bundling
├─→ Pending_Approvals (action: Bundling Team approves bundle)
├─→ Split_NPAs (action: Bundling Team splits into separate NPAs)
└─→ Withdrawn (action: Maker withdraws)
```

**From Classified_Evergreen:**
```
Classified_Evergreen (automated check)
├─→ Approved (if all Evergreen limits pass - AUTO-APPROVED)
└─→ Classified_NPA_Lite (if any Evergreen limit fails)
```

**From Manual_Review:**
```
Manual_Review
├─→ Classified_Full_NPA (action: Champion confirms Full NPA)
├─→ Classified_NPA_Lite (action: Champion overrides to NPA Lite)
├─→ Classified_Bundling (action: Champion decides bundling)
└─→ Withdrawn (action: Champion rejects as invalid)
```

**From Pending_Approvals:**
```
Pending_Approvals
├─→ Approved (condition: ALL approvers approve)
├─→ Rejected (condition: ANY approver rejects - TERMINAL)
├─→ Loop_Back_to_Maker (condition: ANY approver requests changes)
└─→ Escalated (condition: SLA breach OR dependency deadlock)
```

**From Loop_Back_to_Maker:**
```
Loop_Back_to_Maker
├─→ Pending_Approvals (action: Maker resubmits AND loop_back_count < 3)
├─→ Escalated (condition: loop_back_count >= 3 - CIRCUIT BREAKER)
└─→ Withdrawn (action: Maker withdraws)
```

**From Approved:**
```
Approved
├─→ Live (action: product launches)
└─→ Archived (condition: validity expires without launch)
```

**From Escalated:**
```
Escalated
├─→ Pending_Approvals (action: Forum provides guidance, resumes workflow)
├─→ Approved (action: Forum overrides and approves)
└─→ Rejected (action: Forum rejects - TERMINAL)
```

**From Live:**
```
Live
├─→ PIR_Required (condition: NTG product + 6 months elapsed)
└─→ Archived (condition: validity expires)
```

**From PIR_Required:**
```
PIR_Required
├─→ PIR_Approved (condition: PIR satisfactory)
└─→ PIR_Corrective_Action (condition: issues found)
```

**From PIR_Approved:**
```
PIR_Approved
├─→ Live (continue operations)
└─→ Archived (validity expires)
```

**From PIR_Corrective_Action:**
```
PIR_Corrective_Action
├─→ Pending_Approvals (expedited re-approval of amendments)
└─→ Live (if amendments approved)
```

**Terminal States (No Further Transitions):**
```
- Rejected
- Withdrawn
- Prohibited
- Archived (can spawn new NPA if reactivated, but this NPA stays terminal)
```

---

## 4. Business Rules

### Rule 1: Draft Timeout

**Condition:**  
NPA in Draft state for >30 days

**Action:**
```
Day 30: Send reminder to Maker
  "Your NPA has been in draft for 30 days. Please complete and submit, or withdraw."

Day 45: Auto-withdraw
  - Transition to Withdrawn
  - Notify Maker: "Your NPA has been auto-withdrawn due to 45-day inactivity."
  - Free up NPA quota (if applicable)
```

---

### Rule 2: Approval SLA

**Condition:**  
Approver hasn't responded within SLA timeline (default 48 hours)

**Action:**
```
At 75% SLA (36 hours):
  - Send warning to approver: "NPA approval due in 12 hours"
  - Send notification to approver's manager: "Your team member has pending approval"

At 100% SLA (48 hours - SLA BREACH):
  - Escalate to approver's manager: "URGENT: NPA approval overdue"
  - Notify GFM COO: "SLA breach detected"
  - Flag on dashboard: "SLA BREACHED"
  - Record in approver's performance metrics

At 150% SLA (72 hours - CRITICAL):
  - Escalate to GFM COO: "Critical delay on NPA approval"
  - Potential: Reassign to backup approver (if configured)
```

---

### Rule 3: Circuit Breaker (Loop-Back Limit)

**Condition:**  
`loop_back_count >= 3`

**Action:**
```
IMMEDIATELY:
  - HALT normal workflow (do NOT return to Pending_Approvals)
  - Transition to Escalated
  - Notify:
    * GFM COO (URGENT)
    * NPA Governance Forum
    * Maker
    * NPA Champion
    * All previous approvers
  
  - Message: "Circuit breaker triggered. NPA looped back 3 times, indicating 
              fundamental issue. Senior review required."
  
  - NPA Governance Forum must convene within 48 hours
```

**Reasoning:**  
Prevents infinite loops, indicates complex issue requiring senior intervention.

---

### Rule 4: Parallel Approvals

**Condition:**  
NPA in Pending_Approvals state

**Action:**
```
All approvers work in PARALLEL (not sequential):
  - Credit, Finance, Legal, MLR, Operations, Technology
  - ALL receive notification at SAME TIME (e.g., 9:00 AM Dec 16)
  - Each approver works independently (no waiting for others)
  - NPA transitions to Approved when LAST approver approves
  
EXCEPTION (Sequential Dependencies):
  - Finance Manager → Finance VP (if notional >$50M)
    * Finance VP waits for Finance Manager to approve first
  
  - All Approvers → CEO (if notional >$100M)
    * CEO waits for ALL other approvers to complete first
```

---

### Rule 5: Conditional Approvals

**Condition:**  
Approver approves with conditions (e.g., "Approve if collateral daily mark-to-market")

**Action:**
```
If condition is STANDARD (common requirement):
  - Count as APPROVED
  - Store condition in NPA
  - Operations must implement condition before launch
  - Example: "Approve with daily collateral requirement" → Approved

If condition is MATERIAL CHANGE (alters product):
  - Count as LOOP-BACK (not approved)
  - Transition to Loop_Back_to_Maker
  - Maker must revise NPA to address condition
  - Example: "Approve if notional reduced to $30M" (from $50M) → Loop-Back
```

---

### Rule 6: Validity Period

**Condition:**  
NPA approved

**Action:**
```
Set validity expiry date:
  - Full NPA: 1 year from approval
  - NPA Lite: 1 year from approval
  - Evergreen: 3 years from approval (GFM deviation)
  
Schedule notifications:
  - 30 days before expiry: Warn Maker "NPA expires in 30 days - launch or extend?"
  - 7 days before expiry: URGENT warning "NPA expires in 7 days"
  - On expiry date: Transition to Archived (if not launched)
  
Extension rules:
  - Can extend ONCE for +6 months (total 18 months)
  - Requires unanimous consent from all original approvers
  - No variations allowed
```

---

### Rule 7: Evergreen Limit Enforcement

**Condition:**  
NPA classified as Evergreen

**Action:**
```
Check ALL Evergreen limits (6 criteria):
  1. Product on Evergreen list
  2. Notional <= $10M per deal
  3. Aggregate <= $500M annual cap per desk
  4. Deal count <= 10 deals per month per desk
  5. Counterparty rating >= A-
  6. No variations from pre-approved structure

IF (ALL pass):
  - Auto-approve (< 1 hour)
  - Log transaction
  - Update counters (YTD notional, monthly deal count)
  - Notify Maker: "Evergreen auto-approved"

IF (ANY fail):
  - Downgrade to Classified_NPA_Lite
  - Specify which limit failed
  - Notify Maker: "Evergreen limit breached (notional $12M > cap $10M). 
                   Proceeding as NPA Lite."
```

---

### Rule 8: NTG PIR Requirement

**Condition:**  
NPA classified as New-to-Group (NTG) AND product launches

**Action:**
```
At product launch:
  - Schedule PIR (6 months from launch date)
  - Set PIR reminder (5 months from launch, 30 days before PIR due)
  
At 6 months post-launch:
  - Transition to PIR_Required
  - Notify Maker: "PIR due for NPA TSG1917"
  - Provide PIR template
  - All original approvers must review PIR (Credit, Finance, Legal, MLR, Ops, Tech)
  
PIR is MANDATORY (cannot skip):
  - If Maker doesn't submit PIR within 30 days → Escalate to GFM COO
  - If PIR not completed → Product may be suspended
```

---

## 5. Loop-Back Scenarios

### Loop-Back Type 1: Checker Rejection (Early Stage)

**Scenario:**  
Checker reviews NPA and finds incomplete/incorrect information before approvals start.

**State Flow:**
```
Draft → Pending_Classification → Classified_Full_NPA → (Checker Review) → Loop_Back_to_Maker
```

**Typical Reasons:**
- Risk assessment incomplete
- Missing required documents
- Calculation errors (notional, ROAE)
- Policy violations

**Action:**
```
Checker clicks "Reject and Send Back to Maker"
  - Enter rejection reason: "Operational risk section incomplete - 
                             missing settlement process description"
  - Increment loop_back_count (0 → 1)
  - Transition to Loop_Back_to_Maker
  - Notify Maker: "Your NPA has been returned by Checker for revision"
  - Display rejection reason prominently
  
Maker revises:
  - Updates operational risk section
  - Adds settlement process description
  - Clicks "Resubmit"
  - Transition back to Pending_Classification (NOT Pending_Approvals - must re-classify)
```

---

### Loop-Back Type 2: Approver Requests Clarification (Mid-Stage)

**Scenario:**  
Approver (e.g., Finance) has question or needs additional information during approval stage.

**State Flow:**
```
Pending_Approvals → (Finance requests clarification) → Smart Routing Decision
  ├─→ Loop_Back_to_Maker (if NPA changes needed)
  └─→ Direct Response (if answerable from existing info, no loop-back)
```

**Smart Routing Logic:**
```
IF (clarification requires NPA field changes OR document updates):
  → Loop_Back_to_Maker (full loop-back)
  → Increment loop_back_count
  → Notify Maker
  
ELSE IF (clarification answerable from existing docs OR KB):
  → AI drafts response
  → Checker reviews AI response
  → IF (Checker approves):
      → Send response directly to approver (no loop-back to Maker)
      → Approver receives answer, continues review
  → ELSE:
      → Loop_Back_to_Maker (AI couldn't answer adequately)
```

**Example (No Loop-Back Needed):**
```
Finance question: "What's the validity period for this NPA?"
AI response: "1 year from approval date per NPA policy. This NPA will be valid 
              until Dec 31, 2026 if approved today."
Checker: Approves AI response
Result: Finance receives answer, NO loop-back to Maker (saves 2-3 days)
```

**Example (Loop-Back Needed):**
```
Finance question: "ROAE seems too high at 8.5%. Can you justify or revise?"
AI: Cannot answer (requires Maker's judgment/calculation revision)
Result: Loop-Back_to_Maker, Maker revises ROAE analysis
```

---

### Loop-Back Type 3: Launch Preparation Issue (Late Stage)

**Scenario:**  
During launch preparation, system compatibility issue discovered.

**State Flow:**
```
Approved → (Operations preparing launch) → Issue found → Targeted Loop-Back
  └─→ Loop_Back_to_Sign_Off (ONLY affected approvers, not all)
```

**Example:**
```
Issue: "Murex system cannot book cross-border FX Option with Hong Kong entity"

Targeted Loop-Back:
  - Status: Return to Sign-Off Stage
  - Affected Approvers: Technology + Legal (NOT Credit, Finance, MLR - their approvals still valid)
  - Notify: Technology + Legal + Maker
  - Preserve: Credit, Finance, MLR, Operations approvals (no need to re-approve)
  
Technology proposes: "Book in Singapore entity, use inter-company transfer"
Legal reviews: "Confirm tax treatment acceptable"
Both approve: Resume launch preparation

Timeline Impact: +1-2 days (targeted re-approval only, not full loop-back)
```

---

### Loop-Back Type 4: Post-Launch Corrective Action (PIR Stage)

**Scenario:**  
PIR identifies issue requiring NPA amendment.

**State Flow:**
```
Live → PIR_Required → PIR submitted → PIR_Corrective_Action → Loop_Back for Amendment
  └─→ Pending_Approvals (expedited re-approval)
```

**Example:**
```
PIR Finding: "Trading volume 60% below projection (60 deals vs 100 expected). 
              Market demand lower than anticipated."

Corrective Action:
  - Maker proposes: Update volume projection from 100 to 60 deals/year
  - Mark as "PIR Amendment" (expedited process)
  - Approvers: Original sign-off parties (Credit, Finance, MLR)
  - Timeline: 2-3 days (expedited vs normal 7 days)
  - Rationale: Minor amendment, not new product
```

---

## 6. Circuit Breaker Rules

### Trigger: 3 Loop-Backs

**Condition:**
```
loop_back_count >= 3
```

**Action:**
```
HALT normal workflow:
  - Do NOT transition to Pending_Approvals (even if Maker resubmits)
  - Transition to Escalated
  - Block Maker from resubmitting (require senior override)
  
Notify (URGENT):
  - GFM COO
  - NPA Governance Forum
  - Maker
  - NPA Champion
  - All previous approvers
  
Message:
  "🚨 CIRCUIT BREAKER TRIGGERED
  
  NPA ID: TSG2025-042
  Loop-Back Count: 3 (THRESHOLD REACHED)
  
  Iteration History:
  1. Day 2 - Checker: Risk assessment incomplete
  2. Day 7 - Finance: ROAE calculation unclear
  3. Day 13 - Legal: Cross-border jurisdiction issue
  
  Pattern: Multiple departments, different issues each time
  Root Cause: Unclear requirements OR complex edge case
  
  Action: NPA Governance Forum will review within 48 hours"
```

---

### Forum Review Process

**NPA Governance Forum convenes within 48 hours:**

**Step 1: Analyze Loop-Back History**
```
Review all 3 iterations:
  - What was requested each time?
  - Did Maker address issues adequately?
  - Are approvers giving conflicting feedback?
  - Is this a valid product or fundamentally flawed?
```

**Step 2: Identify Root Cause**
```
Possible Causes:
  - Maker doesn't understand requirements (need training/guidance)
  - Product is complex edge case (policy unclear)
  - Approvers giving conflicting feedback (need alignment)
  - Product genuinely unsuitable (should be rejected)
```

**Step 3: Decide Path Forward**

**Option A: Provide Guidance & Resume**
```
Forum Decision: "This is a valid cross-border product, but complex. 
                 Provide Maker with detailed guidance."

Action:
  - Draft guidance document: "Cross-Border Legal Requirements Template"
  - Send to Maker with explicit instructions
  - Reset loop_back_count to 0 (fresh start)
  - Transition to Pending_Approvals (resume normal workflow)
  - Notify all approvers: "Guidance provided, please review revised NPA"
```

**Option B: Override & Approve with Conditions**
```
Forum Decision: "NPA is valid but approvers are being overly cautious. 
                 Override and approve with standard conditions."

Action:
  - Record override reason: "Senior approval, standard cross-border product"
  - Add conditions: "Daily collateral mark-to-market, Legal review annually"
  - Transition to Approved (bypass further approvals)
  - Notify all parties: "NPA approved by Forum override"
```

**Option C: Reject as Unsuitable**
```
Forum Decision: "Product is not suitable for MBS risk appetite."

Action:
  - Record rejection reason: "Product complexity exceeds capabilities, 
                              multiple operational issues identified"
  - Transition to Rejected (terminal)
  - Notify Maker: "Forum has rejected NPA after 3 iterations. 
                   Product not suitable for MBS at this time."
```

---

### Circuit Breaker Metrics

**Track:**
- NPAs hitting circuit breaker: 1 per month (target <2%)
- Average iterations before circuit breaker: 3.2 (by definition >=3)
- Forum resolution time: 2.5 days average (target <3 days)
- Forum outcomes:
  - 60% Provide Guidance & Resume
  - 30% Override & Approve
  - 10% Reject

**Goal:** Reduce circuit breaker triggers from 1/month to <1/quarter (indication of unclear processes)

---

## 7. SLA & Timeout Rules

### SLA Table

| State | Actor | SLA Duration | Warning Threshold | Escalation |
|-------|-------|--------------|-------------------|------------|
| Draft (idle) | Maker | 30 days | 30 days (reminder) | 45 days (auto-withdraw) |
| Pending_Classification | System | 30 seconds | 1 minute | 2 minutes (alert) |
| Classified_* (awaiting Maker) | Maker | 7 days | 5 days | 7 days (alert) |
| Pending_Approvals | Each Approver | 48 hours | 36 hours (75%) | 48 hours (SLA breach) |
| Loop_Back_to_Maker | Maker | 5 days | 3 days | 5 days (alert) |
| Manual_Review | NPA Champion | 48 hours | 36 hours | 48 hours (escalate to COO) |
| Escalated | Forum | 48 hours | 36 hours | 48 hours (escalate to Board) |

---

### SLA Monitoring Loop

**Runs every 1 hour (automated job):**
```
For each active NPA:
  For each pending state/actor:
    time_elapsed = now() - state_entered_at
    time_remaining = SLA_duration - time_elapsed
    
    IF (time_remaining <= warning_threshold AND warning_sent == FALSE):
      send_warning_notification(actor)
      send_reminder_notification(actor_manager)
      warning_sent = TRUE
    
    IF (time_remaining <= 0 AND escalation_sent == FALSE):
      send_escalation_notification(actor_manager)
      send_escalation_notification(COO)
      escalation_sent = TRUE
      log_sla_breach(npa_id, actor, time_elapsed)
```

---

### SLA Breach Example

**Timeline:**

**Dec 16, 09:00** - Finance notified (SLA deadline: Dec 18, 09:00)

**Dec 17, 21:00** - 36 hours elapsed (75% SLA, 12 hours remaining)
```
⚠️ SLA WARNING

NPA: TSG2025-042
Approver: Mark Lee (Finance)
Time Elapsed: 36 hours / 48 hours
Time Remaining: 12 hours
Deadline: Dec 18, 09:00

Action: Please prioritize NPA review

Notifications Sent:
✅ Mark Lee - "NPA approval due in 12 hours"
✅ Jane Tan (Finance Manager) - "Your team member has pending approval"
```

**Dec 18, 10:00** - 49 hours elapsed (SLA BREACHED by 1 hour)
```
🚨 SLA BREACH

NPA: TSG2025-042
Approver: Mark Lee (Finance)
Time Elapsed: 49 hours
SLA: 48 hours (BREACHED by 1 hour)
Status: Under Review (no decision yet)

Notifications Sent:
🚨 Jane Tan (Finance Manager) - "URGENT: Team member breached SLA"
🚨 GFM COO - "Finance SLA breach on NPA TSG2025-042"
📊 Analytics - "Record breach for performance tracking"

Recommended Actions:
1. Finance Manager follow up with Mark Lee
2. If unavailable, reassign to backup (Lisa Chen)
3. If urgent, escalate to Finance VP for override
```

---

## 8. Edge Cases & Exceptions

### Edge Case 1: Approver Out of Office (OOO)

**Scenario:**  
Approver on vacation during approval period, no response within SLA.

**Action:**
```
Check approver's delegate (from org hierarchy):
  - If delegate assigned AND OOO >3 days:
    * Auto-reassign to delegate
    * Notify delegate: "Assigned as backup for Mark Lee (OOO)"
    * Reset SLA timer (48 hours from delegation)
  
  - If NO delegate AND OOO >3 days:
    * Escalate to approver's manager
    * Manager decides: Wait OR assign backup
  
  - If OOO <3 days:
    * Wait (do NOT reassign)
    * SLA timer continues (approver expected back soon)
```

---

### Edge Case 2: Conflicting Approvals

**Scenario:**  
Credit approves, but Finance rejects. What is overall status?

**Action:**
```
Overall Status = Rejected (ANY reject → overall reject)

Reasoning:
  - NPA requires ALL approvals (unanimous consent)
  - Single rejection stops NPA (risk-averse approach)
  - Maker can revise and resubmit to address rejection

Example:
  - Credit: APPROVED ("Counterparty acceptable, daily collateral")
  - Finance: REJECTED ("ROAE 3.2% below minimum 5.0%")
  → Overall: REJECTED
  → Transition to Rejected (terminal)
  → Maker notified: "Finance rejected due to low ROAE"
```

---

### Edge Case 3: Bundled NPAs (State Machine for Bundle)

**Scenario:**  
3 products bundled together. How do they move through states?

**Action:**
```
Single State Machine for Entire Bundle:
  - Bundle treated as ONE entity (not 3 separate NPAs)
  - All 3 products transition together (same state at same time)
  - Cannot approve one product individually (must approve bundle)

Example:
  Bundle: FX Forward + IRS + Commodity Hedge
  
  States:
  - Draft: All 3 products in draft
  - Pending_Classification: All 3 classified together → Bundling
  - Classified_Bundling: Bundling Team reviews bundle approach
  - Pending_Approvals: Aggregate approvers (superset of all 3 products)
  - Approved: All 3 products approved together
  
  Cannot:
  - Approve FX Forward but reject IRS (all or nothing)
  - Launch FX Forward while IRS still in review (synchronous)
```

---

### Edge Case 4: Evergreen Fast-Track

**Scenario:**  
Evergreen product approved in <1 hour (same day). How does state machine handle?

**Action:**
```
Fast-Track State Flow:
  Draft → Pending_Classification → Classified_Evergreen → Approved
  
  Duration: <1 hour (automated)
  
  States bypassed:
  - Classified_Full_NPA (not needed, Evergreen auto-approved)
  - Pending_Approvals (no human approvers, system auto-approves)
  
  Maker Experience:
  - 09:00: Submit NPA
  - 09:05: Classified as Evergreen
  - 09:06: All limits checked (pass)
  - 09:07: APPROVED (auto-approved)
  - 09:10: Notify Maker: "Your NPA is Evergreen auto-approved. Trade immediately."
```

---

### Edge Case 5: Maker Withdraws During Approvals

**Scenario:**  
NPA in Pending_Approvals (3 of 6 approvers already approved), Maker withdraws.

**Action:**
```
Allow withdrawal (Maker can withdraw at any time):
  - Transition to Withdrawn (terminal)
  - Notify all approvers: "NPA withdrawn by Maker. Your approval is void."
  - Do NOT count partial approvals (reset approval count)
  - Archive NPA (read-only)
  
Approver Notifications:
  - Credit (already approved): "NPA TSG2025-042 withdrawn by Maker"
  - Finance (already approved): "NPA TSG2025-042 withdrawn by Maker"
  - Legal (already approved): "NPA TSG2025-042 withdrawn by Maker"
  - MLR (pending): "NPA TSG2025-042 withdrawn - no action needed"
  - Operations (pending): "NPA TSG2025-042 withdrawn - no action needed"
  - Technology (pending): "NPA TSG2025-042 withdrawn - no action needed"
```

---

### Edge Case 6: Classification Confidence <75%

**Scenario:**  
AI classifies NPA but confidence only 0.68 (below 0.75 threshold).

**Action:**
```
Auto-escalate to Manual_Review (do NOT proceed to Classified_* state):
  - Skip Classified_Full_NPA / Classified_NPA_Lite
  - Go directly to Manual_Review
  - Notify NPA Champion: "AI classification uncertain (68% confidence). 
                          Manual review required."
  
  - Display to Champion:
    * AI Classification: "Full NPA" (confidence 0.68)
    * Reason for uncertainty: "Borderline notional ($48M close to $50M threshold), 
                               cross-border flag unclear"
    * Recommendation: "Suggest Full NPA due to cross-border complexity"
  
  - Champion reviews and decides final classification
```

---

## 9. State Transition Examples

### Example 1: Happy Path (NPA Lite, No Loop-Backs)

**Timeline:**

**Day 0, 09:00** - Maker starts NPA
```
State: Draft
Actor: Maker
Action: Creating NPA for FX Forward EUR/USD, $8M, A- counterparty, domestic
```

**Day 0, 14:30** - Maker submits
```
State: Draft → Pending_Classification
Action: Maker clicks "Submit"
Validation: All required fields complete ✓
```

**Day 0, 14:31** - AI classifies (30 seconds)
```
State: Pending_Classification → Classified_NPA_Lite
Classification: NPA Lite (Variation, low risk, domestic, $8M)
Confidence: 0.89
Required Approvers: Credit (Senior Analyst), Finance (Senior Manager), MLR (Senior Analyst)
```

**Day 0, 15:00** - Maker confirms
```
State: Classified_NPA_Lite → Pending_Approvals
Action: Maker clicks "Confirm & Proceed"
Approvers Notified: Credit, Finance, MLR (all notified simultaneously)
SLA: 48 hours per approver
```

**Day 1, 10:30** - Credit approves (1.1 days)
```
State: Pending_Approvals (3 pending → 2 pending)
Approver: Credit (Senior Analyst)
Decision: APPROVED
Comments: "Counterparty acceptable, standard terms"
```

**Day 1, 14:00** - Finance approves (1.2 days)
```
State: Pending_Approvals (2 pending → 1 pending)
Approver: Finance (Senior Manager)
Decision: APPROVED
Comments: "ROAE 6.8%, within acceptable range"
```

**Day 2, 09:00** - MLR approves (1.8 days)
```
State: Pending_Approvals → Approved
Approver: MLR (Senior Analyst)
Decision: APPROVED
Comments: "Market risk acceptable, VaR within limit"

ALL approvals received → Transition to Approved
Total Timeline: 2 days (within 4-day SLA)
```

**Day 2, 09:05** - Approval complete
```
State: Approved
Actions:
  - Generate approval memo
  - Notify Maker: "Congratulations! NPA approved in 2 days."
  - Notify Operations: "NPA ready for launch"
  - Set validity: 1 year (expires Dec 2026)
```

**Total Time:** 2 days (Draft → Approved)  
**Loop-Backs:** 0  
**SLA Compliance:** 100% (all approvers within 48 hours)

---

### Example 2: Loop-Back Scenario (Finance Requests Changes)

**Timeline:**

**Day 0-1:** Same as Example 1 (Draft → Classified_Full_NPA → Pending_Approvals)

**Day 2, 10:00** - Finance requests changes
```
State: Pending_Approvals → Loop_Back_to_Maker
Approver: Finance (Senior Manager)
Decision: REQUEST CHANGES
Comments: "ROAE calculation incomplete - need sensitivity analysis 
           (3 scenarios: base case, stress case, best case)"

loop_back_count: 0 → 1
Action: Notify Maker, transition to Loop_Back_to_Maker
```

**Day 2-4:** Maker revises ROAE
```
State: Loop_Back_to_Maker
Actor: Maker
Action: Adds ROAE sensitivity analysis with 3 scenarios:
  - Base Case: 6.8% ROAE
  - Stress Case: 4.2% ROAE (20% notional reduction)
  - Best Case: 9.1% ROAE (20% notional increase)
Comments: "ROAE sensitivity added per Finance request"
```

**Day 4, 16:00** - Maker resubmits
```
State: Loop_Back_to_Maker → Pending_Approvals
Action: Maker clicks "Resubmit"
Circuit Breaker Check: loop_back_count = 1 < 3 → OK to resubmit
Approvers Notified: Finance ONLY (Credit, MLR approvals still valid)
SLA: 48 hours for Finance
```

**Day 5, 14:00** - Finance approves (revised)
```
State: Pending_Approvals → Approved
Approver: Finance (Senior Manager)
Decision: APPROVED
Comments: "ROAE sensitivity analysis acceptable, proceed"

All approvals received (Credit from Day 1, MLR from Day 2, Finance now)
→ Transition to Approved
```

**Total Time:** 5 days (Draft → Approved)  
**Loop-Backs:** 1 (Finance ROAE clarification)  
**Impact:** +3 days vs happy path

---

### Example 3: Circuit Breaker Triggered (3 Loop-Backs)

**Timeline:**

**Iteration 1 (Day 0-2):** Checker rejects
```
State: Classified_Full_NPA → Loop_Back_to_Maker
Reason: "Operational risk section incomplete"
loop_back_count: 0 → 1
```

**Iteration 2 (Day 5-7):** Finance rejects
```
State: Pending_Approvals → Loop_Back_to_Maker
Reason: "ROAE calculation unclear"
loop_back_count: 1 → 2
```

**Iteration 3 (Day 10-13):** Legal rejects
```
State: Pending_Approvals → Loop_Back_to_Maker
Reason: "Cross-border jurisdiction issue - need legal memo"
loop_back_count: 2 → 3
```

**Day 13** - Circuit Breaker Triggered
```
State: Loop_Back_to_Maker (attempted resubmit)
Circuit Breaker Check: loop_back_count = 3 >= 3 → TRIGGERED

HALT: Do NOT transition to Pending_Approvals
Action: Transition to Escalated

Notifications (URGENT):
  🚨 GFM COO
  🚨 NPA Governance Forum
  🚨 Maker
  🚨 NPA Champion

Message: "Circuit breaker triggered. 3 loop-backs indicate fundamental issue. 
          Forum will review within 48 hours."
```

**Day 14-15** - Forum Reviews
```
State: Escalated
Actor: NPA Governance Forum
Review: Analyze 3 iterations, identify root cause

Forum Decision: "Provide Guidance"
  - Root Cause: Complex cross-border product, unclear policy on HK-SG legal structure
  - Action: Draft "Cross-Border Legal Requirements Template"
  - Send to Maker with explicit guidance
  - Reset loop_back_count to 0 (fresh start)

State: Escalated → Pending_Approvals
Approvers: All original (Credit, Finance, Legal, MLR, Ops, Tech)
Maker: Revises per guidance
```

**Day 18** - All Approve (After Guidance)
```
State: Pending_Approvals → Approved
All approvers: APPROVED
Total Time: 18 days (3 iterations + Forum intervention)
```

**Total Time:** 18 days  
**Loop-Backs:** 3 (triggered circuit breaker)  
**Outcome:** Forum guidance enabled successful approval

---

## END OF KB_NPA_State_Machine.md

**This document provides complete state machine logic for LLM agents to validate workflow transitions.**

**Key Features:**
- ✅ 19 state definitions with detailed descriptions
- ✅ Valid transitions from each state (what can follow what)
- ✅ 8 core business rules (timeouts, SLA, circuit breaker, parallel approvals)
- ✅ 4 loop-back types with smart routing
- ✅ Circuit breaker (3-strike escalation) with Forum resolution
- ✅ SLA monitoring with 75%/100%/150% escalation
- ✅ 6 edge cases (OOO, conflicts, bundling, Evergreen, withdrawal, low confidence)
- ✅ 3 detailed examples (happy path, loop-back, circuit breaker)

**Total Length:** ~18,000 words | ~30 KB

**Usage:** Upload to Dify KB, link to Governance Agent, Classification Router Agent, Product Ideation Agent
