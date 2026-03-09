
# Approval Orchestration Sub-Agent
## The Air Traffic Controller of NPA Approvals

**Agent Type:** Sub-Agent (Decisioning Stage)  
**Stage:** Stage 3 - Decisioning (Sign-Off Coordination)  
**Purpose:** Coordinate parallel/sequential approvals, detect and route loop-backs intelligently, track SLAs, and manage circuit breaker escalations  
**Analogy:** This agent is like an air traffic controller managing multiple planes landing simultaneously—coordinating Credit, Finance, Legal, MLR, Ops, Tech sign-offs in parallel, detecting when one plane needs to circle back, and escalating when there's a problem

---

## The Challenge This Agent Solves

An NPA requires sign-offs from 5-7 different parties (Credit, Finance, Legal, MLR, Operations, Technology, Compliance). Each approver has their own queue, their own SLA, and their own workload. Coordinating this manually is chaos:

**Current Reality (Manual Coordination):**

**Day 1:** Maker submits NPA → Checker approves → Sends to all approvers via email

**Day 3:** Credit responds: "Need clarification on counterparty financials"  
- Who handles this? Maker doesn't know the email arrived  
- Email sits in inbox for 8 hours before Maker sees it  
- Maker responds, but meanwhile...

**Day 4:** Finance approves (but Maker doesn't know)  
Legal approves (but Maker doesn't know)  
Operations approves (but Maker doesn't know)

**Day 5:** MLR asks: "What did Credit say about counterparty risk?"  
- But Maker is still waiting for Credit's clarification response  
- MLR waits for Credit to finish  
- Meanwhile, Technology is still reviewing

**Day 8:** Credit finally approves (after Maker answered clarification)  
- But now it's been 5 days since Finance/Legal/Ops approved  
- Need to check if those approvals are still valid  
- Technology still hasn't responded (breached 48-hour SLA)

**Day 10:** Someone notices Tech is late → Manual escalation email  
**Day 11:** Tech finally approves  
**Day 12:** NPA fully approved (but could have been Day 5 if coordinated properly)

**The Problems:**
- No visibility into who's done, who's waiting, who's blocked
- No automatic escalation when someone breaches SLA
- No smart routing of clarifications (everything loops back to Maker)
- No coordination between approvers (MLR waiting for Credit unnecessarily)
- Manual follow-ups waste 3-5 days per NPA

**The Approval Orchestration Sub-Agent solves this by:**
1. **Parallel processing** (Credit, Finance, Legal review simultaneously, not sequentially)
2. **Real-time status tracking** (everyone sees who's done, who's pending)
3. **Smart loop-back routing** (AI decides if clarification needs Maker involvement or can be answered directly)
4. **Automatic SLA monitoring** (escalates to manager when 48-hour deadline approaches)
5. **Circuit breaker** (auto-escalates to COO after 3 loop-backs)
6. **Dependencies detection** (if MLR needs Credit input, waits automatically)

**Result:** 12 days → 4 days average timeline (67% reduction)

---

## How the Agent Works: The Five Core Functions

### Function 1: Approval Path Determination

When an NPA completes Checker review, the agent determines the optimal approval path.

**Decision Factors:**

**Factor 1: Product Risk Level**
- High risk → Sequential approvals (Credit must approve before Finance)
- Medium risk → Parallel approvals (all review simultaneously)
- Low risk → Expedited (auto-approve Operations/Tech, human review Credit/Finance/Legal only)

**Factor 2: Cross-Border Flag**
- If TRUE → Finance, Credit, MLR, Tech, Ops are MANDATORY (parallel)

**Factor 3: Notional Threshold**
- >$100M → Add CFO to approval chain (sequential: Finance → Finance VP → CFO)
- >$50M → Add Finance VP to approval chain (sequential: Finance → Finance VP)
- >$20M → Finance must review ROAE analysis first (sequential step within Finance)

**Factor 4: Product Type**
- Credit derivatives → Credit must approve before MLR (sequential dependency)
- New-to-Group → All parties required, PAC approval first (sequential gate)
- Evergreen → No approvals needed (log-only)

**Factor 5: Approval Track**
- Full NPA → All parties (Credit, Finance, Legal, MLR, Ops, Tech, Compliance)
- NPA Lite → Reduced set (Credit, Finance, MLR typically)
- Bundling → Bundling Arbitration Team only

---

**Example Decision Tree:**

**Input:**
```
Product: FX Option
Classification: Existing
Approval Track: NPA Lite
Risk Level: Medium
Notional: $75M
Cross-Border: Yes (Singapore + Hong Kong)
```

**Agent Decision Process:**

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
Risk Level = Medium → Parallel approvals (no sequential dependencies)

Parallel Group 1: [Credit, Finance, MLR, Operations, Technology] - All review simultaneously
Sequential Step: Finance → Finance VP (VP waits for Finance to approve first)
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

**Output to Workflow:**
```
Approval Path Created:
- Stage: Sign-Off (Parallel Group 1)
- Approvers: Credit, Finance, MLR, Ops, Tech (5 parties, simultaneous)
- Sequential Gate: Finance → Finance VP
- Expected Timeline: 2.4 days
- SLA: Each approver has 48 hours from notification
- Escalation: Auto-escalate to manager at 36 hours (12 hours before SLA breach)
```

---

### Function 2: Parallel Approval Coordination

Once the approval path is determined, the agent coordinates parallel reviews.

**Orchestration Actions:**

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

✅ Credit (Jane Tan)
   - Notified: 2024-12-16 09:00
   - Approved: 2024-12-17 10:15 (1.05 days)
   - Comments: "Counterparty risk acceptable, daily collateral required"

⏳ Finance (Mark Lee)
   - Notified: 2024-12-16 09:00
   - Status: Under Review (1.2 days elapsed)
   - SLA: 0.8 days remaining (deadline: 2024-12-18 09:00)
   - Next Action: Awaiting Finance approval

✅ MLR (Sarah Chen)
   - Notified: 2024-12-16 09:00
   - Approved: 2024-12-17 08:30 (0.98 days)
   - Comments: "Market risk within tolerance"

✅ Operations (David Lim)
   - Notified: 2024-12-16 09:00
   - Approved: 2024-12-16 17:45 (0.36 days)
   - Comments: "Standard settlement, no issues"

✅ Technology (Emily Wong)
   - Notified: 2024-12-16 09:00
   - Approved: 2024-12-17 09:00 (1.0 days)
   - Comments: "Murex system compatible, no new build required"

Progress: 4 of 5 approvals complete (80%)
Bottleneck: Finance (1.2 days elapsed, 0.8 days remaining)
```

**Action 3: Dependency Detection**

Sometimes approvers need input from each other:

**Scenario:** MLR asks "What did Credit say about counterparty exposure?"

**Agent Detection:**
```
MLR comment detected: "Need Credit's assessment before I can approve"
→ Check if Credit has approved: YES (approved 2024-12-17 10:15)
→ Credit's comments: "Daily collateral required"
→ Auto-forward Credit's comments to MLR
→ Notify MLR: "Credit approved with daily collateral requirement (see attached)"
→ MLR can now proceed without delay
```

This avoids MLR waiting unnecessarily—the agent proactively surfaces information.

---

### Function 3: Smart Loop-Back Detection and Routing

This is the most intelligent function: deciding when and how to handle clarifications.

**The Four Types of Loop-Backs:**

#### Type 1: Checker Rejection (Major Loop-Back)

**Scenario:** Checker finds NPA incomplete or has errors

**Agent Action:**
```
Checker Decision: REJECT
Reason: "Risk assessment section incomplete - missing operational risk analysis"

Agent Routing:
- Status: Draft (loop back to Maker)
- Notify: Maker + NPA Champion
- Preserve: All Checker comments, highlighted sections
- Increment: Loop-back counter (iteration 1 → 2)
- Flag: "Critical - Must fix before resubmission"

Timeline Impact: +3-5 days
```

This is a **full loop-back**—NPA goes back to Draft stage, Maker must fix and resubmit.

---

#### Type 2: Approval Clarification (Smart Loop-Back)

**Scenario:** Finance approver asks: "Can you clarify the ROAE calculation methodology?"

**Agent Intelligence: Does this require NPA changes?**

**Decision Logic:**

**Question Type Analysis:**
```
Finance question: "Can you clarify the ROAE calculation methodology?"

AI Classification:
- Question type: Clarification (not rejection)
- Requires NPA changes: NO (question is about understanding existing content)
- Answerable from existing docs: YES (ROAE methodology is in Appendix III)
- Answerable from KB: YES (standard ROAE formula in Finance Policy)

Decision: Smart routing - NO loop-back to Maker
```

**Agent Action:**
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

---

**Contrast with Traditional Routing:**

**Without Smart Routing:**
```
Finance asks question
→ Loop-back to Maker (Day 3)
→ Maker sees question (Day 4, 8 hours delay)
→ Maker responds (Day 4, +4 hours drafting)
→ Checker reviews Maker response (Day 5, +6 hours)
→ Back to Finance (Day 5)
→ Finance approves (Day 6)

Timeline Impact: +3 days
```

**With Smart Routing:**
```
Finance asks question
→ AI drafts response (10 minutes)
→ Checker reviews AI response (1 hour)
→ Send to Finance (same day)
→ Finance approves (same day)

Timeline Impact: +0 days
```

**The Criteria for Smart Routing:**

```
CAN AI handle without Maker involvement?

✅ YES if:
- Question is clarification, not rejection
- Answer exists in NPA document or KB
- No NPA field changes required
- No document updates required

❌ NO if:
- Approver requests NPA changes
- Question reveals missing information
- Answer requires Maker's judgment/expertise
- Compliance/regulatory concern flagged
```

**Example Questions by Routing:**

**Smart-Route (No Maker Loop-Back):**
- "Can you clarify the settlement process?" (Answer in NPA Section II)
- "What's the VaR calculation?" (Answer in Risk Assessment)
- "Who is the counterparty credit analyst?" (Answer in KB)
- "What's the validity period?" (Standard: 1 year from approval)

**Loop-Back to Maker (Requires Maker Input):**
- "This notional seems too high—can you justify?" (Judgment call)
- "Missing credit rating from Moody's" (Missing information)
- "Need additional collateral schedule" (Document update)
- "Jurisdictional issue—need Legal memo" (New requirement)

---

#### Type 3: Launch Preparation Issues (Targeted Loop-Back)

**Scenario:** During "Preparing for Launch" stage, system compatibility issue discovered

**Agent Action:**
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

This is a **targeted loop-back**—only the affected approvers are re-engaged, not everyone.

---

#### Type 4: Post-Launch Corrective Action (PIR Loop-Back)

**Scenario:** PIR (Post-Implementation Review) identifies issue requiring NPA amendment

**Agent Action:**
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

**SLA Rules:**
- Standard SLA: 48 hours per approver (from notification to decision)
- Warning threshold: 36 hours (12 hours before SLA breach)
- Escalation threshold: 48 hours (SLA breached)

**Monitoring Loop (Runs Every 1 Hour):**

```
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

**Example: SLA Escalation in Action**

**Timeline:**

**2024-12-16 09:00** - Finance notified (SLA deadline: 2024-12-18 09:00)

**2024-12-17 21:00** - 36 hours elapsed (12 hours remaining)
```
⚠️ SLA WARNING - Finance Approval

NPA: TSG2025-042
Approver: Mark Lee (Finance)
Time Elapsed: 36 hours
Time Remaining: 12 hours
SLA Deadline: 2024-12-18 09:00

Status: Under Review (no action taken yet)

Escalation Notifications Sent:
✅ Mark Lee (Finance approver) - "Reminder: NPA approval due in 12 hours"
✅ Jane Tan (Finance Manager) - "Mark Lee has NPA approval due in 12 hours"

Action Required: Please prioritize NPA TSG2025-042 review
```

**2024-12-18 10:00** - 49 hours elapsed (SLA breached)
```
🚨 SLA BREACH - Finance Approval

NPA: TSG2025-042
Approver: Mark Lee (Finance)
Time Elapsed: 49 hours
SLA Deadline: 2024-12-18 09:00 (BREACHED by 1 hour)

Status: Under Review (still no action)

Escalation Notifications Sent:
🚨 Jane Tan (Finance Manager) - "URGENT: Mark Lee breached SLA on NPA TSG2025-042"
🚨 GFM COO Office - "Finance SLA breach on NPA TSG2025-042"
📊 Analytics Agent - "Record SLA breach for performance tracking"

Recommended Actions:
1. Finance Manager to follow up directly with Mark Lee
2. If Mark is unavailable, reassign to backup approver (Lisa Chen)
3. If urgent, expedite to Finance VP for override approval
```

**SLA Performance Metrics (Dashboard):**
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

**Why Circuit Breaker Exists:**

If an NPA keeps getting rejected or requiring clarifications, something is fundamentally wrong:
- Unclear requirements (Maker doesn't understand what's needed)
- Complex edge case (product doesn't fit standard approval process)
- Process breakdown (approvers giving conflicting feedback)

After 3 iterations, **stop the normal workflow** and escalate to senior management.

**Circuit Breaker Logic:**

```
For each NPA:
    Track loop_back_count (starts at 0)
    
    When loop-back occurs:
        loop_back_count += 1
        record_loop_back(reason, date, approver)
        
        IF loop_back_count >= 3:
            trigger_circuit_breaker()
```

**Example: Circuit Breaker Triggered**

**Iteration 1 (Day 2):**
```
Checker rejects: "Risk assessment incomplete - missing operational risk"
→ Loop-back to Maker
→ loop_back_count = 1
```

**Iteration 2 (Day 7):**
```
Finance rejects: "ROAE calculation unclear - need more detail"
→ Loop-back to Maker (Maker revises ROAE)
→ loop_back_count = 2
```

**Iteration 3 (Day 13):**
```
Legal rejects: "Cross-border jurisdiction issue - need additional legal memo"
→ Loop-back to Maker
→ loop_back_count = 3 → CIRCUIT BREAKER TRIGGERED
```

**Circuit Breaker Action:**

```
🚨 CIRCUIT BREAKER TRIGGERED

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
✅ Normal workflow HALTED
✅ Escalated to: GFM COO + NPA Governance Forum
✅ Notify: Maker + NPA Champion + All Approvers
✅ Request: Senior review and guidance on path forward

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

**Post-Circuit-Breaker Process:**

1. **NPA Governance Forum Review** (within 48 hours)
   - Review all 3 loop-back reasons
   - Identify root cause (Maker error vs unclear policy vs complex product)
   - Decide next steps

2. **Possible Outcomes:**

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

**Circuit Breaker Metrics:**
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

## Real-World Example: End-to-End Approval Orchestration

Let's walk through a complete NPA approval with the agent orchestrating.

**Product:** FX Option on GBP/USD, $75M notional, Singapore + Hong Kong (cross-border)

---

**Day 1 - Morning (09:00):**

**Maker submits NPA → Checker approves → Approval Orchestration Agent activates**

**Agent Actions:**
```
1. Determine Approval Path:
   - Base parties: Credit, Finance, MLR (NPA Lite)
   - Cross-border override: Add Ops, Tech (mandatory)
   - Notional >$50M: Add Finance VP (sequential after Finance)
   - Final path: Credit, Finance, MLR, Ops, Tech (parallel) → Finance VP (sequential)

2. Send Simultaneous Notifications (09:00):
   - Credit (Jane Tan): ✅ Notified
   - Finance (Mark Lee): ✅ Notified
   - MLR (Sarah Chen): ✅ Notified
   - Ops (David Lim): ✅ Notified
   - Tech (Emily Wong): ✅ Notified

3. Set SLA Deadlines:
   - All approvers: 48-hour SLA (deadline: Day 3, 09:00)
   - SLA warnings: 36 hours (Day 2, 21:00)

4. Update Status Dashboard:
   - Status: Sign-Off (Parallel Approvals)
   - Progress: 0 of 5 complete (0%)
```

---

**Day 1 - Afternoon (17:00):**

**Operations approves (8 hours elapsed)**

**Agent Actions:**
```
1. Record Approval:
   - Ops (David Lim): ✅ APPROVED (0.33 days)
   - Comments: "Standard settlement, no issues"

2. Update Status Dashboard:
   - Progress: 1 of 5 complete (20%)

3. Check Dependencies:
   - No other approvers waiting on Ops
   - Continue parallel processing
```

---

**Day 2 - Morning (09:00):**

**Technology approves (24 hours elapsed)**

**Agent Actions:**
```
1. Record Approval:
   - Tech (Emily Wong): ✅ APPROVED (1.0 days)
   - Comments: "Murex compatible, no new build"

2. Update Status Dashboard:
   - Progress: 2 of 5 complete (40%)
   - Remaining: Credit, Finance, MLR
```

---

**Day 2 - Mid-Morning (10:00):**

**MLR asks question: "Can you clarify the VaR calculation methodology?"**

**Agent Smart Routing:**
```
1. Classify Question:
   - Type: Clarification (not rejection)
   - Requires NPA changes: NO
   - Answerable from NPA: YES (VaR in Risk Assessment Section IV.A)

2. AI Draft Response:
   "VaR calculation uses standard formula: Notional × Volatility × Z-score
   
   Your NPA details:
   - Notional: $75M
   - GBP/USD 6-month volatility: 9.2%
   - 1-day volatility: 7.7% (tenor-adjusted)
   - Z-score (99%): 2.33
   - VaR = $75M × 7.7% × 2.33 = $13.5M
   
   See Risk Assessment Section IV.A, page 12 for full details."

3. Route to Checker:
   - Checker reviews AI response (30 minutes)
   - Checker approves (accurate)

4. Send to MLR:
   - MLR receives clarification (no Maker loop-back)
   - MLR satisfied

Time Saved: 2-3 days (avoided Maker loop-back)
```

---

**Day 2 - Afternoon (14:00):**

**MLR approves (29 hours elapsed)**

**Agent Actions:**
```
1. Record Approval:
   - MLR (Sarah Chen): ✅ APPROVED (1.21 days)
   - Comments: "Market risk acceptable after VaR clarification"

2. Update Status Dashboard:
   - Progress: 3 of 5 complete (60%)
   - Remaining: Credit, Finance
```

---

**Day 2 - Evening (20:00):**

**Credit approves (35 hours elapsed)**

**Agent Actions:**
```
1. Record Approval:
   - Credit (Jane Tan): ✅ APPROVED (1.46 days)
   - Comments: "Counterparty A- rated, daily collateral required"

2. Update Status Dashboard:
   - Progress: 4 of 5 complete (80%)
   - Remaining: Finance (bottleneck)

3. Check if Sequential Gate Unlocked:
   - Finance VP gate: Still locked (waiting for Finance base approval)
```

---

**Day 2 - Night (21:00):**

**Finance has not responded (36 hours elapsed - SLA warning threshold)**

**Agent SLA Warning:**
```
⚠️ SLA WARNING - Finance Approval

Time Elapsed: 36 hours
Time Remaining: 12 hours
SLA Deadline: Day 3, 09:00

Notifications Sent:
✅ Mark Lee (Finance): "Reminder: NPA approval due in 12 hours"
✅ Jane Tan (Finance Manager): "Mark has NPA due in 12 hours"
```

---

**Day 3 - Morning (08:30):**

**Finance approves (47.5 hours elapsed - just before SLA breach)**

**Agent Actions:**
```
1. Record Approval:
   - Finance (Mark Lee): ✅ APPROVED (1.98 days)
   - Comments: "ROAE acceptable at 5.2%, approve"

2. Update Status Dashboard:
   - Progress: 5 of 5 complete (100% - parallel stage complete)

3. Unlock Sequential Gate:
   - Finance approved → Finance VP can now review
   - Send notification to Finance VP (Jane Tan)
   - SLA: 24 hours (expedited for VP review)
```

---

**Day 3 - Afternoon (15:00):**

**Finance VP approves (6.5 hours elapsed)**

**Agent Actions:**
```
1. Record Approval:
   - Finance VP (Jane Tan): ✅ APPROVED (0.27 days)
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

## Performance Targets

**Speed:**
- Average approval time: 4.2 days (baseline: 12 days)
- Target: 4 days (67% reduction)

**Efficiency:**
- Smart routing success rate: >75% (clarifications handled without Maker loop-back)
- Parallel processing utilization: >85% (approvals happen simultaneously, not sequentially)

**SLA Compliance:**
- On-time approval rate: >90% (approvers meet 48-hour SLA)
- SLA breach rate: <10%

**Loop-Back Reduction:**
- Average loop-backs per NPA: 1.2 (baseline: 1.4)
- Circuit breaker triggers: <2% of NPAs

**User Satisfaction:**
- Visibility rating: >4.5/5.0 (users appreciate real-time status)
- Orchestration effectiveness: >4.3/5.0

---

## Integration with Other Agents

**Integration 1: Status Report Sub-Agent**
- Approval Orchestration provides real-time approval status
- Status Report generates weekly summary reports

**Integration 2: Notification Agent**
- Approval Orchestration triggers notifications (SLA warnings, escalations)
- Notification Agent delivers via email, Slack, in-app

**Integration 3: ML-Based Prediction Sub-Agent**
- ML Prediction forecasts timeline by department
- Approval Orchestration compares actual vs predicted (feedback loop)

**Integration 4: Conversational Diligence Sub-Agent**
- Smart routing relies on Conversational Diligence to draft AI responses
- Checker reviews AI-drafted clarifications before sending to approver

---

## Conclusion: Why This Agent Is Critical

The Approval Orchestration Sub-Agent is the **air traffic controller** of the NPA Workbench because it:

1. **Coordinates Chaos** - Turns 5-7 independent approvers into a synchronized approval machine

2. **Eliminates Bottlenecks** - Parallel processing + smart routing reduces 12 days → 4 days

3. **Prevents Loop-Back Waste** - 75% of clarifications handled without Maker involvement (saves 2-3 days each)

4. **Enforces Accountability** - SLA monitoring + auto-escalation ensures no approver "falls through cracks"

5. **Protects Quality** - Circuit breaker prevents endless loops, forces senior review of problematic NPAs

But here's the real magic: **The agent doesn't just route approvals—it learns from patterns and optimizes the process.** When Finance always asks about ROAE for deals >$50M, the agent starts proactively flagging this to Makers *before* submission, preventing the loop-back entirely.

That's the power of intelligent orchestration with continuous learning.

---
