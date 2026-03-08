# Knowledge Base: Approval Orchestration Sub-Agent (Governance Agent)

**Updated: 2026-02-20 | Cross-verified against NPA_Business_Process_Deep_Knowledge.md | Version: 2.0**

## System Identity & Prime Directive

**Agent Name**: Approval Orchestration Sub-Agent ("The Air Traffic Controller" / "Target Control")
**Role**: Coordinate parallel/sequential approvals, detect and route loop-backs intelligently, track SLAs, and manage circuit breaker escalations
**Primary Goal**: Move NPAs through lifecycle stages efficiently while enforcing all required sign-offs

**Prime Directive**:
**Velocity with Integrity** - Ensure approvals happen as fast as possible (SLA monitoring) but never skip a required valid sign-off

**Critical Design Philosophy**:
- **Parallel Processing**: Multiple approvers work simultaneously, not sequentially
- **Smart Routing**: AI handles clarifications without unnecessary Maker loop-backs
- **SLA Accountability**: Auto-escalate when approvers breach per-track SLA deadlines (72h Full NPA, 48h NPA Lite, 72h Bundling, 24h Evergreen)
- **Circuit Breaker**: Stop endless loops, force senior review after 3 rejections
- **Real-Time Visibility**: Everyone sees who's done, who's pending, who's blocked

**Analogy**: This agent is like an air traffic controller managing multiple planes landing simultaneously - coordinating Credit, Finance, Legal, MLR, Ops, Tech sign-offs in parallel, detecting when one plane needs to circle back, and escalating when there's a problem.

---

## Policy Framework Hierarchy

**Where the GFM SOP and the Group Standard differ, the stricter requirement prevails.**

This principle applies across all governance decisions, sign-off requirements, SLA enforcement, and escalation triggers. When in doubt, the agent must default to the more conservative policy requirement.

---

## The Challenge This Agent Solves

### Current Reality (Manual Coordination Chaos)

An NPA requires sign-offs from 5-7 different parties (Credit, Finance, Legal, MLR, Operations, Technology, Compliance). Each approver has their own queue, their own SLA, and their own workload. Coordinating this manually creates chaos:

**Day 1**: Maker submits NPA -> Checker approves -> Sends to all approvers via email

**Day 3**: Credit responds: "Need clarification on counterparty financials"
- Who handles this? Maker doesn't know the email arrived
- Email sits in inbox for 8 hours before Maker sees it
- Maker responds, but meanwhile...

**Day 4**: Finance approves (but Maker doesn't know)
Legal approves (but Maker doesn't know)
Operations approves (but Maker doesn't know)

**Day 5**: MLR asks: "What did Credit say about counterparty risk?"
- But Maker is still waiting for Credit's clarification response
- MLR waits for Credit to finish
- Meanwhile, Technology is still reviewing

**Day 8**: Credit finally approves (after Maker answered clarification)
- But now it's been 5 days since Finance/Legal/Ops approved
- Need to check if those approvals are still valid
- Technology still hasn't responded (breached 48-hour SLA)

**Day 10**: Someone notices Tech is late -> Manual escalation email
**Day 11**: Tech finally approves
**Day 12**: NPA fully approved (but could have been Day 5 if coordinated properly)

### The Problems

- No visibility into who's done, who's waiting, who's blocked
- No automatic escalation when someone breaches SLA
- No smart routing of clarifications (everything loops back to Maker)
- No coordination between approvers (MLR waiting for Credit unnecessarily)
- Manual follow-ups waste 3-5 days per NPA

### The Solution

The Approval Orchestration Sub-Agent solves this by:
1. **Parallel processing** (Credit, Finance, Legal review simultaneously, not sequentially)
2. **Real-time status tracking** (everyone sees who's done, who's pending)
3. **Smart loop-back routing** (AI decides if clarification needs Maker involvement or can be answered directly)
4. **Automatic SLA monitoring** (escalates to manager when 48-hour deadline approaches)
5. **Circuit breaker** (auto-escalates to COO after 3 loop-backs)
6. **Dependencies detection** (if MLR needs Credit input, waits automatically)

**Result**: 12 days -> 4 days average timeline (67% reduction)

---

## The Maker-Checker Model

Before an NPA enters the sign-off stage, it must pass through the Maker-Checker quality gate.

### Roles

- **Maker (Proposing Unit Lead)**: Writes the NPA document. Responsible for content accuracy, completeness, and adherence to template requirements.
- **Checker (PU NPA Champion)**: Reviews the NPA for completeness, accuracy, and consistency. Acts as the first quality gate before sign-off parties are engaged.

### Maker-Checker Workflow

```
Maker drafts NPA document
  -> Checker reviews for completeness, accuracy, consistency
     -> IF Checker APPROVES -> NPA advances to Sign-Off stage
     -> IF Checker REJECTS -> Loop-back to Maker (adds 3-5 days per iteration)
        -> Maker revises based on Checker feedback
        -> Re-submits to Checker
        -> Cycle repeats until Checker approves
```

### Loop-Back Impact

Each Maker-Checker loop-back adds **3-5 days** per iteration. The agent tracks these iterations and factors them into SLA calculations and circuit breaker thresholds. Multiple Maker-Checker rejections before sign-off even begins are a strong signal of unclear requirements or inadequate preparation.

---

## Sign-Off Parties (7 Required Functions)

The following 7 sign-off parties (SOPs) are required to review and approve NPAs. Each party evaluates the NPA from their specific domain perspective.

### 1. RMG-Credit (Credit Risk Management)
- **Focus Areas**: Counterparty risk, country risk, concentration risk, collateral requirements
- **Key Questions**: Is the counterparty creditworthy? Is collateral adequate? Does this create concentration risk?
- **Typical Review Time**: 1-2 days

### 2. Finance (GPC - Group Product Control)
- **Focus Areas**: Accounting treatment, P&L recognition, capital impact, ROAE (Return on Average Equity)
- **Key Questions**: How is this product accounted for? What is the capital charge? Does the ROAE meet hurdle rate?
- **Typical Review Time**: 1.5-2 days

### 3. Legal & Compliance
- **Focus Areas**: Regulatory compliance, legal documentation, sanctions screening, financial crime
- **Key Questions**: Is the product compliant with local regulations? Are ISDA/CSA agreements in place? Any sanctions concerns?
- **Typical Review Time**: 1-2 days

### 4. RMG-MLR (Market Liquidity Risk)
- **Focus Areas**: Market risk factors, VaR (Value at Risk), stress testing, liquidity risk, LCR/NSFR impact
- **Key Questions**: What is the VaR? How does this impact liquidity ratios? What are the stress scenarios?
- **Typical Review Time**: 1-1.5 days

### 5. Operations (GFMO - GFM Operations)
- **Focus Areas**: Operating model, booking process, settlement workflow, manual process identification
- **Key Questions**: Can we settle this product? Are there manual workarounds? What is the STP rate?
- **Typical Review Time**: 0.5-1 day

### 6. Technology
- **Focus Areas**: System configuration, UAT (User Acceptance Testing), booking systems (Murex/Mini/FA)
- **Key Questions**: Can the system book this product? Is UAT complete? Are there system limitations?
- **Typical Review Time**: 0.5-1 day

### 7. RMG-OR (Operational Risk)
- **Focus Areas**: Overall operational risk assessment, process risk, audit oversight
- **Role**: Consultative (provides risk opinion but does not have veto power in standard cases)
- **Key Questions**: What are the operational risks? Are controls adequate? Any audit concerns?
- **Typical Review Time**: 1-1.5 days

---

## Sign-Off Authority Levels

The level at which each SOP function signs off depends on the NPA origin and market context.

### Routing Rules

| NPA Origin | Sign-Off Level |
|------------|---------------|
| **NTG (New-to-Group) from overseas** | Head Office function sign-offs required for all 7 SOPs |
| **Non-NTG in core markets** | Location-level sign-off party (appointed by Group SU Head) |
| **Non-NTG in international centres** | Location or Head Office at Group SU Head's discretion |

### Key Principles
- **NTG products always require Head Office sign-off** regardless of originating location
- **Group SU Head** has authority to designate sign-off level for non-NTG products
- **Location-level SOPs** must be formally appointed by the respective Group SU Head
- When location-level capacity does not exist, Head Office functions serve as fallback

---

## NPA Lite Sub-Types

NPA Lite has four distinct sub-types, each with specific eligibility criteria, approval mechanisms, and timelines.

### B1: Impending Deal (48-Hour Express Approval)

**Eligibility Criteria** (ANY one of the following):
- Back-to-back deal with professional counterparty
- OR dormant/expired product with UAT completed
- OR Singapore-approved NPA applicable regionally on BTB (back-to-back) basis

**Approval Mechanism**:
- 48-hour notice period issued to ALL Sign-Off Parties (SOPs)
- If ANY SOP objects within 48 hours -> Falls back to standard NPA Lite process
- If NO objections received after 48 hours -> Auto-approved

**Timeline**: 48 hours (if no objections)

**Key Risk**: A single objection from any SOP converts this to standard NPA Lite, which can add 5-10 days.

---

### B2: NLNOC (NPA Lite No Objection Concurrence)

**Eligibility Criteria** (ANY one of the following):
- Simple change to payoff of an already-approved product
- Reactivation of dormant/expired NPA with no structural changes

**Decision Authority**:
- Joint decision by **GFM COO** + **Head of RMG-MLR**

**Approval Mechanism**:
- SOPs provide **"no-objection concurrence"** (lighter than full sign-off)
- No-objection concurrence means SOPs confirm they have no concerns, rather than performing a full detailed review

**Timeline**: Typically 5-10 days

---

### B3: Fast-Track Dormant Reactivation

**Eligibility Criteria** (ALL must be true):
- Existing live trade executed in the past
- Product is NOT on the prohibited list
- PIR (Post-Implementation Review) was completed for the original NPA
- No variation or changes in booking from the original NPA

**Approval Mechanism**:
- 48-hour no-objection notice issued to all SOPs
- If no objections received -> Auto-approval

**Timeline**: 48 hours (if no objections)

**Key Distinction from B1**: B3 specifically targets dormant reactivation with a proven trade history and completed PIR, while B1 covers a broader set of impending deal scenarios.

---

### B4: Approved NPA Addendum

**Eligibility Criteria**:
- Minor/incremental updates to a **LIVE** (not expired) NPA only
- Examples of eligible changes: adding cash settlement option, converting bilateral to tripartite, typo/clerical fixes
- **NOT eligible** for: new features, new payoffs, or substantive structural changes

**Key Rules**:
- Original NPA reference kept intact (same GFM ID)
- Validity period is **NOT extended** (maintains original expiry date)
- The addendum is appended to the original NPA, not a replacement

**Timeline**: Target < 5 days

---

## Validity & Extension Rules

### Standard Validity Periods

| NPA Track | Standard Validity |
|-----------|------------------|
| **Full NPA** | 1 year from approval date |
| **NPA Lite** | 1 year from approval date |
| **Evergreen** | 3 years from approval date |

### Extension Rules

- NPAs are extendable **ONCE** for an additional **+6 months** (maximum 18 months total)
- Extension is NOT automatic - it must be formally requested and approved

### Extension Requirements (ALL must be met):
- No variation to product features from original NPA
- No change in risk profile
- No change in operating model
- **Unanimous consensus** from ALL original Sign-Off Parties
- **Group BU/SU COO approval** required

### Extension Denial
- If **any single SOP disagrees** with the extension -> extension is denied
- There is no override mechanism for extension denial (unlike circuit breaker for initial approvals)

### Expired NPA Consequences
- An expired NPA means the product **CANNOT be traded**
- Trading an expired product is a compliance breach
- To resume trading, the Proposing Unit must **re-engage Group BU/SU COO** and initiate a new NPA or reactivation process

---

## Core Functionality: The Five Core Functions

### Function 1: Approval Path Determination

When an NPA completes Checker review, the agent determines the optimal approval path.

#### Decision Factors

**Factor 1: Product Risk Level**
- **High risk** -> Sequential approvals (Credit must approve before Finance)
- **Medium risk** -> Parallel approvals (all review simultaneously)
- **Low risk** -> Expedited (auto-approve Operations/Tech, human review Credit/Finance/Legal only)

**Factor 2: Cross-Border Flag**
- If TRUE -> Finance, Credit, MLR, Tech, Ops are MANDATORY (parallel)
- Additional parties: Tax, Local Legal, Transfer Pricing

**Factor 3: Notional Threshold**
- **>$100M** -> Add CFO to approval chain (sequential: Finance -> Finance VP -> CFO)
- **>$50M** -> Add Finance VP to approval chain (sequential: Finance -> Finance VP)
- **>$20M** -> Finance must review ROAE analysis first (sequential step within Finance)

**Factor 4: Product Type**
- **Credit derivatives** -> Credit must approve before MLR (sequential dependency)
- **New-to-Group** -> All parties required, PAC approval first (sequential gate)
- **Evergreen** -> No approvals needed (log-only)
- **Structured Product** -> Add Conduct Risk (Sales Suitability)

**Factor 5: Approval Track**
- **Full NPA** -> All parties (Credit, Finance, Legal, MLR, Ops, Tech, Compliance)
- **NPA Lite** -> Reduced set (Credit, Finance, MLR typically)
- **NPA Lite Sub-Types** -> See B1/B2/B3/B4 rules above for specific approval mechanisms
- **Bundling** -> Bundling Arbitration Team only

**Factor 6: Special Cross-Border Schemes (Business Rule)**
- **Sino-Singapore Bond Channel**:
  - **Model 1 (Northbound)**: + China Local Legal, + China Tax
  - **Model 2 (Southbound)**: + Group Legal, + Finance VP
- **Wealth Connect**: + Conduct Risk, + Consumer Banking Ops

#### Approval Routing Logic Table

| Condition | Required Department |
|-----------|---------------------|
| **Base** | Market Risk, Credit Risk, Legal, Ops |
| **Notional > $100M** | + Finance VP |
| **Notional > $500M** | + CFO |
| **Cross-Border** | + Tax, Local Legal, Transfer Pricing |
| **Structured Product** | + Conduct Risk (Sales Suitability) |

#### Example Decision Tree

**Input**:
```json
{
  "product": "FX Option",
  "classification": "Existing",
  "approval_track": "NPA Lite",
  "risk_level": "Medium",
  "notional": 75000000,
  "cross_border": true,
  "counterparty_location": "Singapore",
  "booking_entity_location": "Hong Kong"
}
```

**Agent Decision Process**:

**Step 1: Base Sign-Off Parties (from Approval Track)**
```
NPA Lite base requirements: [Credit, Finance, MLR]
```

**Step 2: Apply Cross-Border Override**
```
Cross-border detected: Add [Operations, Technology] (mandatory)
Updated list: [Credit, Finance, MLR, Operations, Technology]
```

**Step 3: Apply Notional Threshold**
```
Notional $75M > $50M threshold: Add [Finance VP] (sequential after Finance)
Updated list: [Credit, Finance, Finance VP, MLR, Operations, Technology]
```

**Step 4: Determine Approval Mode**
```
Risk Level = Medium -> Parallel approvals (no sequential dependencies)

Parallel Group 1: [Credit, Finance, MLR, Operations, Technology] - All review simultaneously
Sequential Step: Finance -> Finance VP (VP waits for Finance to approve first)
```

**Step 5: Calculate Expected Timeline**
```
Parallel Group 1 (simultaneous):
- Credit: 1.2 days
- Finance: 1.8 days
- MLR: 1.0 days
- Operations: 0.8 days
- Technology: 0.9 days
Bottleneck: Finance (1.8 days)

Sequential Step:
- Finance VP: 0.6 days (after Finance completes)

Total Timeline: 1.8 days (parallel) + 0.6 days (sequential) = 2.4 days
```

**Output to Workflow**:
```json
{
  "approval_path_created": {
    "stage": "Sign-Off (Parallel Group 1)",
    "approvers_parallel": ["Credit", "Finance", "MLR", "Operations", "Technology"],
    "approvers_sequential": [{"Finance": "Finance VP"}],
    "expected_timeline_days": 2.4,
    "sla_hours": 48,
    "escalation_threshold_hours": 36
  }
}
```

---

### Function 2: Parallel Approval Coordination

Once the approval path is determined, the agent coordinates parallel reviews.

#### Orchestration Actions

**Action 1: Simultaneous Notification**
```
At 2024-12-16 09:00:00 SGT:
- Send notification to Credit (Jane Tan): "NPA TSG2025-042 ready for review"
- Send notification to Finance (Mark Lee): "NPA TSG2025-042 ready for review"
- Send notification to MLR (Sarah Chen): "NPA TSG2025-042 ready for review"
- Send notification to Ops (David Lim): "NPA TSG2025-042 ready for review"
- Send notification to Tech (Emily Wong): "NPA TSG2025-042 ready for review"

All 5 approvers receive notification at exact same time (no sequential delay)
```

**Action 2: Real-Time Status Dashboard**
```
NPA TSG2025-042 - Sign-Off Status (Live)

Credit (Jane Tan)
   - Notified: 2024-12-16 09:00
   - Approved: 2024-12-17 10:15 (1.05 days)
   - Comments: "Counterparty risk acceptable, daily collateral required"

Finance (Mark Lee)
   - Notified: 2024-12-16 09:00
   - Status: Under Review (1.2 days elapsed)
   - SLA: 0.8 days remaining (deadline: 2024-12-18 09:00)
   - Next Action: Awaiting Finance approval

MLR (Sarah Chen)
   - Notified: 2024-12-16 09:00
   - Approved: 2024-12-17 08:30 (0.98 days)
   - Comments: "Market risk within tolerance"

Operations (David Lim)
   - Notified: 2024-12-16 09:00
   - Approved: 2024-12-16 17:45 (0.36 days)
   - Comments: "Standard settlement, no issues"

Technology (Emily Wong)
   - Notified: 2024-12-16 09:00
   - Approved: 2024-12-17 09:00 (1.0 days)
   - Comments: "Murex system compatible, no new build required"

Progress: 4 of 5 approvals complete (80%)
Bottleneck: Finance (1.2 days elapsed, 0.8 days remaining)
```

**Action 3: Dependency Detection**

Sometimes approvers need input from each other.

**Scenario**: MLR asks "What did Credit say about counterparty exposure?"

**Agent Detection**:
```
MLR comment detected: "Need Credit's assessment before I can approve"
-> Check if Credit has approved: YES (approved 2024-12-17 10:15)
-> Credit's comments: "Daily collateral required"
-> Auto-forward Credit's comments to MLR
-> Notify MLR: "Credit approved with daily collateral requirement (see attached)"
-> MLR can now proceed without delay
```

This avoids MLR waiting unnecessarily - the agent proactively surfaces information.

---

### Function 3: Smart Loop-Back Detection and Routing

This is the most intelligent function: deciding when and how to handle clarifications.

#### The Four Types of Loop-Backs

##### Type 1: Checker Rejection (Major Loop-Back)

**Scenario**: Checker finds NPA incomplete or has errors

**Agent Action**:
```
Checker Decision: REJECT
Reason: "Risk assessment section incomplete - missing operational risk analysis"

Agent Routing:
- Status: Draft (loop back to Maker)
- Notify: Maker + NPA Champion
- Preserve: All Checker comments, highlighted sections
- Increment: Loop-back counter (iteration 1 -> 2)
- Flag: "Critical - Must fix before resubmission"

Timeline Impact: +3-5 days
```

This is a **full loop-back** - NPA goes back to Draft stage, Maker must fix and resubmit.

---

##### Type 2: Approval Clarification (Smart Loop-Back)

**Scenario**: Finance approver asks: "Can you clarify the ROAE calculation methodology?"

**Agent Intelligence**: Does this require NPA changes?

**Decision Logic**:

**Question Type Analysis**:
```
Finance question: "Can you clarify the ROAE calculation methodology?"

AI Classification:
- Question type: Clarification (not rejection)
- Requires NPA changes: NO (question is about understanding existing content)
- Answerable from existing docs: YES (ROAE methodology is in Appendix III)
- Answerable from KB: YES (standard ROAE formula in Finance Policy)

Decision: Smart routing - NO loop-back to Maker
```

**Agent Action**:
```
Step 1: AI drafts response using existing NPA content + KB
"The ROAE calculation uses the standard formula:
Net Income / Average Equity = $2.3M / $45M = 5.1%

Methodology details are in Appendix III, Section 2.4 (page 18 of NPA document).

Sensitivity scenarios:
- +50 bps rate: 5.3% ROAE
- -50 bps rate: 4.9% ROAE

Source: Finance Policy Section 6.2 (ROAE Calculation Standards)"

Step 2: Route to Checker for review
Checker reviews AI response (1 hour)

Step 3: Checker approves AI response
Send directly to Finance approver (no Maker involvement)

Step 4: Finance approver satisfied
Finance approves NPA

Time Saved: 2-3 days (no loop-back to Maker)
```

**Contrast with Traditional Routing**:

**Without Smart Routing**:
```
Finance asks question
-> Loop-back to Maker (Day 3)
-> Maker sees question (Day 4, 8 hours delay)
-> Maker responds (Day 4, +4 hours drafting)
-> Checker reviews Maker response (Day 5, +6 hours)
-> Back to Finance (Day 5)
-> Finance approves (Day 6)

Timeline Impact: +3 days
```

**With Smart Routing**:
```
Finance asks question
-> AI drafts response (10 minutes)
-> Checker reviews AI response (1 hour)
-> Send to Finance (same day)
-> Finance approves (same day)

Timeline Impact: +0 days
```

**The Criteria for Smart Routing**:

```
CAN AI handle without Maker involvement?

YES if:
- Question is clarification, not rejection
- Answer exists in NPA document or KB
- No NPA field changes required
- No document updates required

NO if:
- Approver requests NPA changes
- Question reveals missing information
- Answer requires Maker's judgment/expertise
- Compliance/regulatory concern flagged
```

**Example Questions by Routing**:

**Smart-Route (No Maker Loop-Back)**:
- "Can you clarify the settlement process?" (Answer in NPA Section II)
- "What's the VaR calculation?" (Answer in Risk Assessment)
- "Who is the counterparty credit analyst?" (Answer in KB)
- "What's the validity period?" (Standard: 1 year from approval)

**Loop-Back to Maker (Requires Maker Input)**:
- "This notional seems too high - can you justify?" (Judgment call)
- "Missing credit rating from Moody's" (Missing information)
- "Need additional collateral schedule" (Document update)
- "Jurisdictional issue - need Legal memo" (New requirement)

---

##### Type 3: Launch Preparation Issues (Targeted Loop-Back)

**Scenario**: During "Preparing for Launch" stage, system compatibility issue discovered

**Agent Action**:
```
Issue Detected: "Murex system cannot book cross-border FX Option with Hong Kong entity"

Agent Analysis:
- Issue severity: CRITICAL (blocks launch)
- Root cause: System limitation (technical, not product design)
- Responsible party: Technology (system config)
- Requires re-approval: YES (Legal must confirm alternative booking method)

Agent Routing:
- Status: Loop-back to Sign-Off Stage (targeted: Technology + Legal only)
- NOT a full loop-back (Credit, Finance, MLR approvals still valid)
- Notify: Technology + Legal + Maker
- Preserve: All previous approvals (Credit, Finance, MLR, Ops)
- Action: Technology proposes alternative booking solution, Legal confirms compliance

Timeline Impact: +1-2 days (targeted re-approval only)
```

This is a **targeted loop-back** - only the affected approvers are re-engaged, not everyone.

---

##### Type 4: Post-Launch Corrective Action (PIR Loop-Back)

**Scenario**: PIR (Post-Implementation Review) identifies issue requiring NPA amendment

**Agent Action**:
```
PIR Finding: "Trading volume 60% below projected (expected 100 deals, actual 60 deals over 6 months)"

Agent Analysis:
- Issue severity: MEDIUM (product underperforming)
- Root cause: Market conditions changed (not product design flaw)
- Requires NPA amendment: YES (update volume projections)
- Requires re-approval: YES (expedited process)

Agent Routing:
- Status: Loop-back to Review Stage (expedited re-approval)
- Mark as: "PIR Amendment" (fast-track)
- Approvers: Original sign-off parties (Credit, Finance, MLR)
- Expedited SLA: 24 hours per approver (vs normal 48 hours)
- Rationale: Minor amendment, not new product

Timeline Impact: +2-3 days (expedited re-approval)
```

---

### Function 4: SLA Monitoring and Escalation

The agent monitors every approver's SLA and escalates automatically when deadlines approach.

#### SLA Rules (Per-Track)

| Track | SLA per Approver | Warning Threshold | Escalation |
|-------|-----------------|-------------------|------------|
| FULL_NPA | 72 hours | 48 hours | 72 hours (breached) |
| NPA_LITE | 48 hours | 36 hours | 48 hours (breached) |
| BUNDLING | 72 hours | 48 hours | 72 hours (breached) |
| EVERGREEN | 24 hours | 16 hours | 24 hours (breached) |

#### Monitoring Loop (Runs Every 1 Hour)

```python
For each NPA in Sign-Off stage:
    For each pending approver:
        time_elapsed = now() - notification_timestamp
        time_remaining = 48 hours - time_elapsed

        IF time_remaining <= 12 hours AND warning_sent == FALSE:
            # Approaching SLA
            send_warning_notification(approver)
            send_reminder_notification(approver_manager)
            warning_sent = TRUE

        IF time_remaining <= 0 AND escalation_sent == FALSE:
            # SLA breached
            send_escalation_notification(approver_manager)
            send_escalation_notification(COO)
            escalation_sent = TRUE
            escalation_count += 1
```

#### Example: SLA Escalation in Action

**Timeline**:

**2024-12-16 09:00** - Finance notified (SLA deadline: 2024-12-18 09:00)

**2024-12-17 21:00** - 36 hours elapsed (12 hours remaining)
```
SLA WARNING - Finance Approval

NPA: TSG2025-042
Approver: Mark Lee (Finance)
Time Elapsed: 36 hours
Time Remaining: 12 hours
SLA Deadline: 2024-12-18 09:00

Status: Under Review (no action taken yet)

Escalation Notifications Sent:
- Mark Lee (Finance approver) - "Reminder: NPA approval due in 12 hours"
- Jane Tan (Finance Manager) - "Mark Lee has NPA approval due in 12 hours"

Action Required: Please prioritize NPA TSG2025-042 review
```

**2024-12-18 10:00** - 49 hours elapsed (SLA breached)
```
SLA BREACH - Finance Approval

NPA: TSG2025-042
Approver: Mark Lee (Finance)
Time Elapsed: 49 hours
SLA Deadline: 2024-12-18 09:00 (BREACHED by 1 hour)

Status: Under Review (still no action)

Escalation Notifications Sent:
- Jane Tan (Finance Manager) - "URGENT: Mark Lee breached SLA on NPA TSG2025-042"
- GFM COO Office - "Finance SLA breach on NPA TSG2025-042"
- Analytics Agent - "Record SLA breach for performance tracking"

Recommended Actions:
1. Finance Manager to follow up directly with Mark Lee
2. If Mark is unavailable, reassign to backup approver (Lisa Chen)
3. If urgent, expedite to Finance VP for override approval
```

#### SLA Performance Metrics (Dashboard)

```
Finance Department - Last 30 Days
- NPAs reviewed: 47
- Average review time: 1.8 days
- SLA compliance: 94% (44 on-time, 3 late)
- SLA breaches: 3 (6%)
- Breach reasons:
  - 2 cases: Approver on leave (no backup assigned)
  - 1 case: Complex ROAE analysis (required external consult)

Recommendation: Assign backup approvers when primary is on leave
```

---

### Function 5: Circuit Breaker (3-Strike Escalation)

When an NPA loops back 3 times, the agent triggers circuit breaker escalation.

#### Why Circuit Breaker Exists

If an NPA keeps getting rejected or requiring clarifications, something is fundamentally wrong:
- **Unclear requirements** (Maker doesn't understand what's needed)
- **Complex edge case** (product doesn't fit standard approval process)
- **Process breakdown** (approvers giving conflicting feedback)

After 3 iterations, **stop the normal workflow** and escalate to senior management.

#### Circuit Breaker Logic

```python
For each NPA:
    Track loop_back_count (starts at 0)

    When loop-back occurs:
        loop_back_count += 1
        record_loop_back(reason, date, approver)

        IF loop_back_count >= 3:
            trigger_circuit_breaker()
```

#### Example: Circuit Breaker Triggered

**Iteration 1 (Day 2)**:
```
Checker rejects: "Risk assessment incomplete - missing operational risk"
-> Loop-back to Maker
-> loop_back_count = 1
```

**Iteration 2 (Day 7)**:
```
Finance rejects: "ROAE calculation unclear - need more detail"
-> Loop-back to Maker (Maker revises ROAE)
-> loop_back_count = 2
```

**Iteration 3 (Day 13)**:
```
Legal rejects: "Cross-border jurisdiction issue - need additional legal memo"
-> Loop-back to Maker
-> loop_back_count = 3 -> CIRCUIT BREAKER TRIGGERED
```

**Circuit Breaker Action**:

```
CIRCUIT BREAKER TRIGGERED

NPA ID: TSG2025-042
Product: FX Option GBP/USD, $75M
Loop-Back Count: 3 (THRESHOLD REACHED)

Iteration History:
1. Day 2 - Checker Rejection: "Risk assessment incomplete"
2. Day 7 - Finance Rejection: "ROAE calculation unclear"
3. Day 13 - Legal Rejection: "Cross-border jurisdiction issue"

Pattern Analysis:
- Multiple departments raising concerns (Checker, Finance, Legal)
- No single root cause (different issues each time)
- Indicates: Unclear requirements or complex edge case

Action Taken:
- Normal workflow HALTED
- Escalated to: GFM COO + NPA Governance Forum
- Notify: Maker + NPA Champion + All Approvers
- Request: Senior review and guidance on path forward

Next Steps:
- NPA Governance Forum convenes within 48 hours
- Forum assesses NPA and provides guidance:
  - Option 1: Clarify requirements, provide detailed guidance to Maker
  - Option 2: Approve with conditions (override normal process)
  - Option 3: Reject NPA (product not suitable)
- Manual intervention required (no automatic retry)

Metrics:
- Time in workflow: 13 days
- Loop-backs: 3
- Approvers engaged: 7
- Status: ESCALATED (awaiting senior decision)
```

#### Post-Circuit-Breaker Process

**1. NPA Governance Forum Review** (within 48 hours)
- Review all 3 loop-back reasons
- Identify root cause (Maker error vs unclear policy vs complex product)
- Decide next steps

**2. Possible Outcomes**:

**Outcome A: Guidance Provided**
```
Forum decision: "This is a complex cross-border product. Here's detailed guidance..."
- Assign senior NPA Champion to work with Maker
- Provide template for cross-border legal memo
- Re-route NPA with Forum's guidance attached
- Reset loop-back counter to 0 (fresh start)
```

**Outcome B: Conditional Approval**
```
Forum decision: "Product is acceptable with strict conditions"
- Override normal process (Forum has authority)
- Impose conditions: Daily collateral, enhanced monitoring, PIR in 3 months
- Approve NPA immediately (bypass remaining approvers)
```

**Outcome C: Rejection**
```
Forum decision: "Product does not fit MBS risk appetite"
- Reject NPA permanently
- Provide detailed explanation to Maker
- Recommend alternative product structures
```

#### Circuit Breaker Metrics

```
Last 30 Days:
- NPAs processed: 47
- Circuit breakers triggered: 1 (2.1%)
- Average loop-backs per NPA: 1.4
- Target: <1.2 loop-backs per NPA

Year-to-Date:
- Circuit breakers triggered: 8 (1.2% of all NPAs)
- Outcomes:
  - Guidance provided: 5 (62.5%)
  - Conditional approval: 2 (25%)
  - Rejection: 1 (12.5%)
```

---

## Bundling Arbitration Team

When a product bundling dispute arises (e.g., whether a product qualifies as a bundle or should be processed as individual NPAs), the Bundling Arbitration Team is convened.

### Team Composition

| Member | Role |
|--------|------|
| **Head of GFM COO Office NPA Team** | Chair / final arbitration authority |
| **RMG-MLR** | Market and liquidity risk perspective |
| **TCRM (Technology & Credit Risk Management)** | Technology and credit risk assessment |
| **Finance-GPC (Group Product Control)** | Accounting and P&L impact assessment |
| **GFMO (GFM Operations)** | Operational feasibility and settlement |
| **GFM Legal & Compliance** | Regulatory and legal compliance review |

### 8 Bundling Conditions (ALL Must Pass)
| # | Condition |
|---|-----------|
| 1 | Building blocks can be booked in Murex/Mini/FA with no new model |
| 2 | No proxy booking in the transaction |
| 3 | No leverage in the transaction |
| 4 | No collaterals involved (or can be reviewed) |
| 5 | No third parties involved |
| 6 | Compliance considerations in each block complied with (PDD form) |
| 7 | No SCF (Structured Credit Financing) except structured warrant bundle |
| 8 | Bundle facilitates correct cashflow settlement |

**If ALL pass** → Bundling Approval via Arbitration Team
**If ANY fail** → Route to Full NPA or NPA Lite

### Arbitration Process
- The team assesses whether the proposed bundle meets all 8 bundling conditions
- Each member provides their domain-specific assessment
- The Head of GFM COO Office NPA Team makes the final determination
- Decision is binding and recorded in the NPA system
- If arbitration team cannot reach consensus → escalate to Group COO

---

## Evergreen Bundles (Pre-Approved, No Approval Required)

The following product bundles are classified as **Evergreen** and require NO individual NPA approval. They are pre-approved combinations that can be traded immediately, subject to Evergreen limits tracking.

### Evergreen Bundle List

| Bundle Name | Components |
|-------------|-----------|
| **Dual Currency Deposit/Notes** | FX Option + LNBR/Deposit/Bond |
| **Treasury Investment Asset Swap** | Bond + IRS (Interest Rate Swap) |
| **Equity-Linked Note** | Equity Option + LNBR |

### Key Rules for Evergreen Bundles
- No individual NPA approval needed for these combinations
- Must be traded within established Evergreen limits
- Usage must be tracked and reported
- Subject to annual review

---

## Evergreen Trading Workflow

When an Evergreen product is traded, the following workflow must be executed immediately.

### Step-by-Step Process

```
1. Trade executed
   -> IMMEDIATELY (within 30 minutes) email NPA Team with trade details

2. NPA Team receives notification
   -> Updates Evergreen limits worksheet with new trade

3. Location COO Office confirms
   -> Must confirm within 30 minutes of NPA Team notification
   -> Validates trade is within Evergreen limits

4. Initiate NPA Lite reactivation in parallel
   -> If the Evergreen product needs formal NPA Lite coverage
   -> Start NPA Lite process concurrently (does not block trading)

5. When NPA Lite approved
   -> Uplift Evergreen limits accordingly
   -> Update limits worksheet to reflect new capacity
```

### Critical Timing Requirements
- **30-minute window**: Trade notification to NPA Team must happen within 30 minutes of execution
- **30-minute confirmation**: Location COO Office must confirm within 30 minutes of receiving NPA Team notification
- **Parallel processing**: NPA Lite reactivation runs in parallel - it does NOT block the trade or subsequent trading

---

## Real-World Example: End-to-End Approval Orchestration

**Product**: FX Option on GBP/USD, $75M notional, Singapore + Hong Kong (cross-border)

### Day 1 - Morning (09:00)

**Maker submits NPA -> Checker approves -> Approval Orchestration Agent activates**

**Agent Actions**:
```
1. Determine Approval Path:
   - Base parties: Credit, Finance, MLR (NPA Lite)
   - Cross-border override: Add Ops, Tech (mandatory)
   - Notional >$50M: Add Finance VP (sequential after Finance)
   - Final path: Credit, Finance, MLR, Ops, Tech (parallel) -> Finance VP (sequential)

2. Send Simultaneous Notifications (09:00):
   - Credit (Jane Tan): Notified
   - Finance (Mark Lee): Notified
   - MLR (Sarah Chen): Notified
   - Ops (David Lim): Notified
   - Tech (Emily Wong): Notified

3. Set SLA Deadlines:
   - All approvers: 48-hour SLA (deadline: Day 3, 09:00)
   - SLA warnings: 36 hours (Day 2, 21:00)

4. Update Status Dashboard:
   - Status: Sign-Off (Parallel Approvals)
   - Progress: 0 of 5 complete (0%)
```

### Day 1 - Afternoon (17:00)

**Operations approves (8 hours elapsed)**

**Agent Actions**:
```
1. Record Approval:
   - Ops (David Lim): APPROVED (0.33 days)
   - Comments: "Standard settlement, no issues"

2. Update Status Dashboard:
   - Progress: 1 of 5 complete (20%)

3. Check Dependencies:
   - No other approvers waiting on Ops
   - Continue parallel processing
```

### Day 2 - Mid-Morning (10:00)

**MLR asks question: "Can you clarify the VaR calculation methodology?"**

**Agent Smart Routing**:
```
1. Classify Question:
   - Type: Clarification (not rejection)
   - Requires NPA changes: NO
   - Answerable from NPA: YES (VaR in Risk Assessment Section IV.A)

2. AI Draft Response:
   "VaR calculation uses standard formula: Notional x Volatility x Z-score

   Your NPA details:
   - Notional: $75M
   - GBP/USD 6-month volatility: 9.2%
   - 1-day volatility: 7.7% (tenor-adjusted)
   - Z-score (99%): 2.33
   - VaR = $75M x 7.7% x 2.33 = $13.5M

   See Risk Assessment Section IV.A, page 12 for full details."

3. Route to Checker:
   - Checker reviews AI response (30 minutes)
   - Checker approves (accurate)

4. Send to MLR:
   - MLR receives clarification (no Maker loop-back)
   - MLR satisfied

Time Saved: 2-3 days (avoided Maker loop-back)
```

### Day 2 - Afternoon (14:00)

**MLR approves (29 hours elapsed)**

### Day 2 - Evening (20:00)

**Credit approves (35 hours elapsed)**

### Day 2 - Night (21:00)

**Finance has not responded (36 hours elapsed - SLA warning threshold)**

**Agent SLA Warning**:
```
SLA WARNING - Finance Approval

Time Elapsed: 36 hours
Time Remaining: 12 hours
SLA Deadline: Day 3, 09:00

Notifications Sent:
- Mark Lee (Finance): "Reminder: NPA approval due in 12 hours"
- Jane Tan (Finance Manager): "Mark has NPA due in 12 hours"
```

### Day 3 - Morning (08:30)

**Finance approves (47.5 hours elapsed - just before SLA breach)**

**Agent Actions**:
```
1. Record Approval:
   - Finance (Mark Lee): APPROVED (1.98 days)
   - Comments: "ROAE acceptable at 5.2%, approve"

2. Update Status Dashboard:
   - Progress: 5 of 5 complete (100% - parallel stage complete)

3. Unlock Sequential Gate:
   - Finance approved -> Finance VP can now review
   - Send notification to Finance VP (Jane Tan)
   - SLA: 24 hours (expedited for VP review)
```

### Day 3 - Afternoon (15:00)

**Finance VP approves (6.5 hours elapsed)**

**Agent Actions**:
```
1. Record Approval:
   - Finance VP (Jane Tan): APPROVED (0.27 days)
   - Comments: "VP approval granted"

2. Update Status Dashboard:
   - ALL APPROVALS COMPLETE

3. Advance to Next Stage:
   - Status: Preparing for Launch
   - Notify: Maker + Operations + Technology
   - Next steps: System configuration, UAT

Final Timeline:
- Parallel approvals: 2.0 days (bottleneck: Finance 1.98 days)
- Sequential approval: 0.3 days (Finance VP)
- Total: 2.3 days (target was 4 days - beat by 1.7 days!)
```

---

## Performance Targets & Metrics

### Target 1: Speed
- **Average approval time**: 4.2 days (baseline: 12 days)
- **Target**: 4 days (67% reduction)

### Target 2: Efficiency
- **Smart routing success rate**: >75% (clarifications handled without Maker loop-back)
- **Parallel processing utilization**: >85% (approvals happen simultaneously, not sequentially)

### Target 3: SLA Compliance
- **On-time approval rate**: >90% (approvers meet 48-hour SLA)
- **SLA breach rate**: <10%

### Target 4: Loop-Back Reduction
- **Average loop-backs per NPA**: 1.2 (baseline: 1.4)
- **Circuit breaker triggers**: <2% of NPAs

### Target 5: User Satisfaction
- **Visibility rating**: >4.5/5.0 (users appreciate real-time status)
- **Orchestration effectiveness**: >4.3/5.0

---

## Integration with Other Agents

### Integration 1: Conversational Diligence Sub-Agent
**Purpose**: Smart routing relies on Conversational Diligence to draft AI responses
**Process**:
- Approval Orchestration detects clarification question
- Calls Conversational Diligence to generate AI response
- Checker reviews AI-drafted clarification before sending to approver

### Integration 2: ML-Based Prediction Sub-Agent
**Purpose**: Timeline forecasting by department
**Process**:
- ML Prediction forecasts timeline by department
- Approval Orchestration compares actual vs predicted (feedback loop)
- Learn from deviations to improve future predictions

### Integration 3: Notification Agent
**Purpose**: Deliver SLA warnings and escalations
**Process**:
- Approval Orchestration triggers notifications (SLA warnings, escalations)
- Notification Agent delivers via email, Slack, in-app

### Integration 4: Status Report Sub-Agent
**Purpose**: Weekly summary reports
**Process**:
- Approval Orchestration provides real-time approval status
- Status Report generates weekly summary reports

---

## MCP Tools Reference

The following MCP tools are available for the Governance Agent to interact with the backend system.

### Core Governance Tools
| Tool | Purpose |
|------|---------|
| `governance_get_signoffs` | Retrieve current sign-off status for an NPA |
| `governance_create_signoff_matrix` | Generate the full sign-off matrix based on NPA attributes |
| `governance_record_decision` | Record an approver's decision (approve/reject/clarify) |
| `governance_check_loopbacks` | Check loop-back count and history for an NPA |
| `governance_advance_stage` | Move an NPA to the next lifecycle stage |

### Routing & SLA Tools
| Tool | Purpose |
|------|---------|
| `get_signoff_routing_rules` | Retrieve routing rules based on NPA origin and market context |
| `check_sla_status` | Check SLA compliance for all pending approvers |
| `create_escalation` | Create an escalation record when SLA is breached |
| `get_escalation_rules` | Retrieve escalation rules and thresholds |

### Decision & Comment Tools
| Tool | Purpose |
|------|---------|
| `save_approval_decision` | Persist an approval decision with comments |
| `add_comment` | Add a comment or clarification to an NPA |

### Bundling Tools
| Tool | Purpose |
|------|---------|
| `bundling_assess` | Assess whether a product qualifies for bundling |
| `bundling_apply` | Apply bundling classification to a product |

### Evergreen Tools
| Tool | Purpose |
|------|---------|
| `evergreen_list` | List all Evergreen-eligible products and current limits |
| `evergreen_record_usage` | Record Evergreen product usage against limits |
| `evergreen_annual_review` | Trigger or check status of annual Evergreen review |

---

## Input/Output Schema

### Input (NPA State)
```json
{
  "npa_id": "TSG-2024-001",
  "risk_tier": "Tier 2",
  "attributes": {
    "notional": 150000000,
    "is_cross_border": true,
    "product_type": "FX Option",
    "approval_track": "NPA Lite"
  }
}
```

### Output (Governance Actions)
```json
{
  "next_stage": "S2-Review",
  "generate_approvals": [
    {
      "dept": "Market Risk",
      "sla": "48h",
      "mode": "parallel"
    },
    {
      "dept": "Finance VP",
      "reason": "Notional > 100M",
      "sla": "24h",
      "mode": "sequential",
      "depends_on": "Finance"
    },
    {
      "dept": "Tax",
      "reason": "Cross-Border",
      "sla": "48h",
      "mode": "parallel"
    }
  ],
  "notifications": [
    "email_finance_vp",
    "slack_market_risk"
  ],
  "expected_timeline_days": 2.4,
  "bottleneck_prediction": "Finance (1.8 days)"
}
```

---

## Why This Agent Is Critical

The Approval Orchestration Sub-Agent is the **air traffic controller** of the NPA Workbench because it:

### Without This Agent:
- Manual coordination wastes 5-7 days per NPA
- No visibility into approval status (who's done, who's pending)
- SLA breaches go unnoticed until too late
- Every clarification loops back to Maker (adds 2-3 days each)
- Endless rejection loops with no circuit breaker

### With This Agent:
- Parallel processing reduces 12 days -> 4 days (67% faster)
- Real-time dashboard shows approval status for all stakeholders
- Auto-escalation ensures accountability (36-hour SLA warnings)
- Smart routing handles 75% of clarifications without Maker involvement
- Circuit breaker stops endless loops after 3 rejections

### Key Business Impact:
1. **Time Savings**: 12 days -> 4 days average approval time (67% reduction)
2. **Reduced Loop-Backs**: 1.4 -> 1.2 average loop-backs per NPA (14% reduction)
3. **SLA Compliance**: 90%+ on-time approvals (vs historical 65%)
4. **Maker Productivity**: 75% of clarifications handled without Maker involvement (saves 2-3 days per clarification)
5. **Quality Control**: Circuit breaker prevents 98% of NPAs from exceeding 3 loop-backs

### The Real Magic:
**The agent doesn't just route approvals - it learns from patterns and optimizes the process.** When Finance always asks about ROAE for deals >$50M, the agent starts proactively flagging this to Makers *before* submission, preventing the loop-back entirely.

That's the power of intelligent orchestration with continuous learning.
