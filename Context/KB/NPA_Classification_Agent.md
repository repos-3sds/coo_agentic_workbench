# Classification Router Agent
## The Brain of the NPA Workbench

**Agent Type:** Task Agent (Critical Path)  
**Stage:** Phase 0 - Product Ideation  
**Purpose:** Execute two-stage classification logic to determine WHAT the product is and HOW to approve it  
**Analogy:** This agent is like a highly experienced NPA Champion who can instantly recognize product patterns and know exactly which approval path to take

---

## The Challenge This Agent Solves

When someone walks up to the NPA system and says "I want to trade a dual currency deposit with an FX option embedded," the system needs to answer two fundamental questions:

**Question 1: What IS this?**
- Is this something completely new to MBS (New-to-Group)?
- Is this a twist on something we already do (Variation)?
- Is this something we've approved before (Existing)?

**Question 2: How should we approve it?**
- Does it need the full heavyweight process (Full NPA)?
- Can we fast-track it (NPA Lite)?
- Is it a combination of approved building blocks (Bundling)?
- Is it on our "always approved" list (Evergreen)?
- Is it banned (Prohibited)?

The Classification Router Agent is the decision-maker that answers both questions with precision, speed, and transparency.

---

## The Two-Stage Classification Model

### Why Two Stages Matter

Think of it like diagnosing a patient in a hospital:

**Stage 1 (Product Classification)** is like the initial triage:
- "Is this patient a new admission, a returning patient, or a transfer from another ward?"
- This determines their medical record status and baseline risk

**Stage 2 (Approval Track Selection)** is like the treatment protocol:
- "Given what we know about this patient, should they go to ICU, general ward, outpatient care, or can they be discharged with a prescription?"
- This determines the actual workflow and resources needed

You can't skip Stage 1 and go straight to Stage 2 because **the treatment protocol depends on knowing the patient's history**.

Similarly in NPA, you can't decide "Full NPA vs NPA Lite" until you know whether it's New-to-Group, Variation, or Existing.

---

## Stage 1: Product Classification Logic

This stage answers: **"What IS this product, relative to MBS Group's history?"**

### Classification Category 1: New-to-Group (NTG)

**The Simple Test:**
Has MBS Group **EVER** done this before, anywhere in the world, in any entity, in any form?

If the answer is NO → It's New-to-Group.

**Real-World Examples:**

**Example 1: Credit Default Swaps**
- MBS has never traded CDS before
- Singapore desk wants to start offering CDS to corporate clients
- **Classification:** New-to-Group
- **Why:** Brand new product type to entire Group

**Example 2: FX Options as Principal**
- MBS has distributed FX Options (acting as broker for clients)
- Now Hong Kong desk wants to trade FX Options as principal (taking market risk)
- **Classification:** New-to-Group
- **Why:** New ROLE within product group (principal vs distributor is massive risk shift)

**Example 3: Retail Mobile App Channel**
- MBS offers structured deposits to institutional clients via relationship managers
- Now wants to offer same deposits to retail via mobile app
- **Classification:** New-to-Group
- **Why:** New distribution channel + new customer segment (retail via self-service)

**What Triggers NTG Classification:**

The agent looks for these signals in the Product Ideation interview:
- Keywords like "first time," "never done before," "new business line"
- No similar historical NPAs found in RAG search (zero semantic matches)
- Product type not in existing product taxonomy
- Distribution channel/geography never used before
- Role description that doesn't match any prior roles

**Mandatory Consequences of NTG:**
- PAC (Product Approval Committee) approval required BEFORE NPA starts
- MUST use Full NPA track (never NPA Lite, never Bundling)
- ALL sign-off parties engaged (Credit, Finance, Legal, MLR, Ops, Tech, Compliance)
- PIR mandatory within 6 months of launch
- 1-year validity (extendable once for +6 months)

---

### Classification Category 2: Variation

**The Simple Test:**
We've done something SIMILAR before, but this version has meaningful changes that alter the risk profile.

**Real-World Examples:**

**Example 1: Dual Currency Deposit (Bundling)**
- We've approved FX Options (building block 1)
- We've approved Deposits (building block 2)
- Now we want to combine them into Dual Currency Deposit
- **Classification:** Variation
- **Why:** Bundling creates new risk dynamics (optionality embedded in deposit)

**Example 2: Structured Loan with ESG Label**
- We've approved structured corporate loans
- Now we want to add "Green Loan" certification (sustainability feature)
- **Classification:** Variation
- **Why:** Sustainability features trigger new compliance/reputational risk

**Example 3: Mark-to-Market Accounting Change**
- We've booked Interest Rate Swaps using accrual accounting
- Now Finance wants to move to mark-to-market accounting
- **Classification:** Variation
- **Why:** Accounting treatment changes capital requirements and risk reporting

**What Triggers Variation Classification:**

The agent detects these patterns:
- High semantic similarity to historical NPA (70-90% match) BUT key differences
- User explicitly mentions "modification," "enhancement," "bundling," "combining"
- Risk assessment shows NEW risk types vs original product
- System requirements show manual workarounds needed
- Compliance flags (ESG, cross-book, third-party tech)

**The Critical Follow-Up Question:**
Once "Variation" is identified, the agent must assess **risk severity**:

**High-Risk Variations** → Full NPA
- Accounting treatment changes
- Cross-book structures (banking + trading books)
- Fintech partnerships (new technology risk)
- New collateral structures

**Medium-Risk Variations** → NPA Lite
- Minor bundling (both blocks already approved)
- Adding settlement option to existing product
- Extending tenor within risk tolerance

**Low-Risk Variations** → NPA Lite Addendum
- Typo corrections in product documentation
- Clarifications of existing terms
- Administrative updates

---

### Classification Category 3: Existing

**The Simple Test:**
We've approved this exact product before, and now someone else in the Group wants to use it.

**Real-World Examples:**

**Example 1: Active NPA in Another Location**
- Singapore desk approved FX Forward 8 months ago (TSG1917)
- Hong Kong desk wants to trade same FX Forward
- **Classification:** Existing (New to Location)
- **Sub-Classification:** Reference Existing
- **Why:** Same product, different desk, original NPA still valid

**Example 2: Dormant Product (<3 years)**
- Credit Default Swap approved in Singapore in 2022
- Last trade was February 2024 (10 months dormant)
- Singapore desk wants to reactivate
- **Classification:** Existing (Dormant)
- **Sub-Classification:** Dormant Reactivation
- **Why:** Already approved, just needs reactivation

**Example 3: Expired NPA (No Changes)**
- Interest Rate Swap approved January 2024
- Never launched (validity expired January 2025)
- London desk wants to trade it now
- **Classification:** Existing (Expired)
- **Sub-Classification:** Expired Reactivation
- **Why:** Previously approved, just needs renewal

**What Triggers Existing Classification:**

The agent detects these patterns:
- RAG search finds EXACT match (>90% semantic similarity)
- Same product structure, same risk profile, same operational model
- User confirms "no changes" when asked
- Original NPA found with "Approved" or "Dormant" or "Expired" status

**The Critical Decision Tree for Existing Products:**

Once "Existing" is identified, the agent checks:

**Is the original NPA still ACTIVE?**
- YES + Product on Evergreen list → Route to Evergreen (trade same day)
- YES + Product not on Evergreen list → NPA Lite - Reference Existing (fast-track)
- NO → Check dormancy/expiration

**Is the original NPA DORMANT?**
- Dormant <3 years + PIR completed + No variations → Fast-Track Reactivation (48 hours)
- Dormant <3 years + Variations detected → NPA Lite
- Dormant ≥3 years → Escalate to GFM COO (may need Full NPA)

**Is the original NPA EXPIRED?**
- Expired + No variations → NPA Lite - Reactivation
- Expired + Variations detected → Full NPA (treat as New-to-Group)

---

## Stage 2: Approval Track Selection

This stage answers: **"HOW should we approve this product?"**

The agent now has the product classification (NTG/Variation/Existing) and must route to the correct approval workflow.

### Decision Tree: From Classification to Track

**Branch 1: If New-to-Group →**
- **Track:** Full NPA (ALWAYS, no exceptions)
- **Reasoning:** Brand new to Group requires maximum scrutiny
- **Requirements:** PAC approval first, all sign-offs, mandatory PIR
- **Timeline:** 12 days baseline (target 4 days with AI)

**Branch 2: If Variation + High Risk →**
- **Track:** Full NPA
- **Reasoning:** Significant risk profile changes require full governance
- **Examples:** Accounting changes, cross-book structures, fintech partnerships
- **Requirements:** All relevant sign-offs based on risk areas

**Branch 3: If Variation + Medium/Low Risk →**
- **Track:** NPA Lite
- **Reasoning:** Controlled changes within existing risk appetite
- **Examples:** Minor bundling, settlement options, administrative updates
- **Requirements:** Reduced sign-off parties (Credit, Finance, MLR typically)

**Branch 4: If Existing + Original NPA Active + On Evergreen List →**
- **Track:** Evergreen
- **Reasoning:** Pre-approved for 3 years, just need to log transaction
- **Requirements:** Check limits (notional, deal count), log usage, notify NPA team
- **Timeline:** Same day (trade immediately)

**Branch 5: If Existing + Original NPA Active + NOT on Evergreen List →**
- **Track:** NPA Lite - Reference Existing
- **Reasoning:** Already approved, just confirming no changes
- **Requirements:** Minimal sign-offs, quick validation
- **Timeline:** 2-5 days

**Branch 6: If Existing + Dormant <3 years + Fast-Track Criteria Met →**
- **Track:** NPA Lite - Fast-Track Dormant Reactivation
- **Reasoning:** Low-risk reactivation with safety checks
- **Requirements:** 48-hour no-objection notice to sign-off parties
- **Timeline:** 48 hours

**Branch 7: If Existing + Expired + No Variations →**
- **Track:** NPA Lite - Reactivation
- **Reasoning:** Previously approved, just renewing
- **Requirements:** Standard NPA Lite sign-offs, PIR required
- **Timeline:** 5-10 days

**Branch 8: If Bundling Detected →**
- **Track:** Depends on bundling conditions
- **Sub-Decision:** Check 8 bundling conditions
  - ALL conditions pass → Bundling Approval (Arbitration Team)
  - ANY condition fails → Route to Full NPA or NPA Lite
- **Special Case:** If bundle on Evergreen list → No approval needed (trade immediately)

**Branch 9: If Prohibited →**
- **Track:** Hard Stop
- **Reasoning:** Explicitly banned by policy or regulation
- **Action:** Display prohibition reason, suggest Compliance contact
- **No workflow initiated**

---

## The Confidence Scoring Mechanism

Here's the critical insight: **The agent doesn't just make a classification decision—it measures how confident it is in that decision.**

### Why Confidence Matters

Imagine the agent classifies a product as "Variation" with 65% confidence. That's essentially saying:
- "I think this is a variation, but I'm not really sure"
- "There's a 35% chance I'm wrong"

Would you want the NPA to proceed through a potentially wrong approval track? Of course not.

That's why the agent has a **confidence threshold of 75%**. Below that, it escalates to humans.

### How Confidence Is Calculated

The agent combines multiple signals to compute confidence:

**Signal 1: Semantic Similarity Score**
- RAG search returns similarity scores for historical NPAs
- High similarity (>90%) → High confidence in "Existing" classification
- Low similarity (<50%) → High confidence in "New-to-Group" classification
- Medium similarity (50-80%) → Lower confidence, needs more analysis

**Signal 2: Rule Match Strength**
- Hard rules (must/never conditions) matched → High confidence
- Soft rules (typically/usually conditions) matched → Medium confidence
- Ambiguous patterns detected → Low confidence

**Signal 3: User Response Clarity**
- User answers clearly and consistently → High confidence
- User gives vague or contradictory answers → Low confidence
- User explicitly says "I'm not sure" → Very low confidence

**Signal 4: Cross-Validation**
- Multiple independent signals point to same classification → High confidence
- Signals point to different classifications → Low confidence
- Borderline between two categories → Low confidence

**Signal 5: Historical Pattern Recognition**
- Product matches known patterns (e.g., all ESG loans = Variation) → High confidence
- Product doesn't match any known patterns → Low confidence

### Confidence Thresholds in Practice

**Confidence ≥ 90%:** "I'm very confident"
- Proceed automatically with classification
- Display reasoning with green checkmark
- Example: Exact match found (95% semantic similarity), all criteria met, user confirmed

**Confidence 75-89%:** "I'm fairly confident"
- Proceed with classification
- Flag for Checker extra scrutiny
- Display reasoning with yellow warning
- Example: High similarity found (82%), most criteria met, minor ambiguity

**Confidence 60-74%:** "I'm somewhat uncertain"
- Escalate to human decision-maker (GFM COO + Head of RMG-MLR)
- Display reasoning with orange alert
- Provide recommendation but require human override
- Example: Medium similarity (68%), conflicting signals, user unsure

**Confidence <60%:** "I don't know"
- Mandatory escalation
- Display reasoning with red alert
- Do not proceed automatically
- Example: No clear match, multiple classifications possible, high ambiguity

---

## The Escalation Framework

When confidence is below 75%, the agent doesn't fail—it escalates intelligently.

### Escalation Decision Authority

**First-Level Escalation (Confidence 60-74%):**
- **Who:** GFM COO Office + Head of RMG-MLR (jointly)
- **Why:** They have ultimate authority on NPA eligibility and track selection
- **Process:** Agent presents analysis, flags ambiguities, recommends classification, awaits human decision

**Second-Level Escalation (Confidence <60%):**
- **Who:** NPA Governance Forum
- **Why:** Fundamental ambiguity requires policy clarification
- **Process:** Elevate to forum for case-by-case ruling, potentially update classification rules

### What the Agent Provides During Escalation

When escalating, the agent generates a comprehensive analysis package:

**Escalation Package Contents:**

1. **The Ambiguity Statement**
   - "I cannot confidently classify this product because [specific reasons]"
   - "My confidence is only 62% due to [conflicting signals]"

2. **The Evidence Summary**
   - Similar NPAs found (with similarity scores)
   - Criteria matched vs not matched
   - User responses (with direct quotes)
   - Risk indicators flagged

3. **The Competing Classifications**
   - "This could be Variation (62% confidence) OR Existing (38% confidence)"
   - Reasoning for each possibility
   - Pros/cons of each classification

4. **The Recommended Decision**
   - "I recommend treating this as Variation → NPA Lite because..."
   - Risk mitigation if recommendation is wrong
   - Alternative routing if decision-maker disagrees

5. **The Impact Analysis**
   - What happens if we classify it as Variation?
   - What happens if we classify it as Existing?
   - Timeline, sign-off, and resource implications

---

## Cross-Cutting Logic: Overrides and Special Cases

Certain rules override the normal classification logic regardless of product type.

### Override 1: Cross-Border Mandatory Sign-Offs

**Trigger:** Product involves booking across multiple locations

**Example:**
- Singapore desk trades with Hong Kong entity
- London desk books deal in Singapore books

**Effect:**
- Regardless of track (Full NPA, NPA Lite, Bundling), the following sign-offs become MANDATORY:
  - Finance (Group Product Control)
  - RMG-Credit
  - RMG-Market & Liquidity Risk (MLR)
  - Technology
  - Operations

**Agent Action:**
- Detect cross-border in Phase 0 interview ("Will this involve cross-border booking?")
- If YES → Auto-add 5 mandatory sign-offs
- Display alert: "Cross-border booking detected: Finance, Credit, MLR, Tech, Ops are MANDATORY"
- Cannot be waived even for NPA Lite

---

### Override 2: Prohibited List (Hard Stop)

**Trigger:** Product or jurisdiction on prohibited list

**Effect:**
- Immediate workflow halt
- No classification or routing happens
- Display prohibition reason

**Agent Action:**
- Check prohibited list BEFORE any processing (even before Stage 1)
- If match found → Display error, log attempt, suggest Compliance contact
- Common prohibition reasons:
  - Regulatory ban (e.g., MAS restricted this product type)
  - Sanctions/embargoes (e.g., OFAC banned this jurisdiction)
  - Internal risk appetite (e.g., bank policy prohibits leveraged retail products)

---

### Override 3: Bundling Detection

**Trigger:** Product is combination of multiple building blocks

**Effect:**
- Even if individual blocks are "Existing," the bundle may be "Variation"
- Special routing to Bundling Arbitration Team

**Agent Action:**
- Detect bundling keywords ("combination," "packaged," "structured")
- Extract building blocks (e.g., FX Option + Deposit)
- Check if bundle already approved (Evergreen bundles, approved bundle list)
- If new bundle → Check 8 bundling conditions
- Route appropriately based on conditions

**Decision Logic:**
- All blocks approved + All 8 conditions pass → Bundling Approval
- Any block not approved OR Any condition fails → Full NPA or NPA Lite
- Bundle on Evergreen list → No approval needed (trade immediately)

---

### Override 4: Evergreen Limit Checks

**Trigger:** Product on Evergreen list

**Effect:**
- Can trade immediately IF limits not exceeded
- If limits exceeded → Must get COO approval OR route to NPA Lite

**Agent Action:**
- Check current Evergreen usage (notional, deal count)
- Calculate remaining capacity
- If sufficient capacity → Allow trade, log usage, initiate parallel NPA Lite reactivation
- If insufficient capacity → Block trade, escalate to COO for limit increase approval

**Evergreen Limits (GFM-Wide):**
- Total notional: $500M USD
- Long tenor (>10Y) notional: $250M USD (sub-limit)
- Deal count: 10 deals per non-retail NPA, 20 deals per retail NPA
- Retail transaction size: $25M USD max per trade
- Retail aggregate: $100M USD (sub-limit)

**Special Exemption:**
- Liquidity management products: Notional and deal count caps WAIVED

---

## The Human-Readable Reasoning Output

One of the most important features of this agent is **explainability**. Users need to understand WHY the agent made a classification decision.

### Example Reasoning Output 1: New-to-Group

**Classification Result:**
- **Product Type:** New-to-Group (NTG)
- **Confidence:** 92%
- **Approval Track:** Full NPA
- **Timeline Estimate:** 4 days

**Reasoning:**
"I classified this as New-to-Group because:

1. **No historical precedent found** → I searched 1,784 historical NPAs and found zero matches for 'Credit Default Swap.' This indicates MBS has never traded CDS before.

2. **New product type** → CDS is not in our existing product taxonomy. This is a new asset class for the bank.

3. **High regulatory impact** → CDS trading requires CFTC registration, which MBS does not currently have. This confirms it's genuinely new to Group.

4. **Your confirmation** → You stated 'This is the first time MBS is considering CDS.' This corroborates my analysis.

Because this is New-to-Group, the following requirements are mandatory:
- PAC approval required BEFORE NPA starts
- Full NPA process (cannot use NPA Lite)
- All sign-off parties: Credit, Finance, Legal, MLR, Ops, Tech, Compliance
- PIR mandatory within 6 months of launch
- 1-year validity from approval"

---

### Example Reasoning Output 2: Existing (Evergreen)

**Classification Result:**
- **Product Type:** Existing
- **Approval Track:** Evergreen
- **Action Required:** Trade immediately, log transaction
- **Confidence:** 96%

**Reasoning:**
"I classified this as Existing (Evergreen) because:

1. **Exact match found** → I found NPA TSG1917 (FX Option on EUR/USD, approved Dec 2024). Your product is 95% identical in structure.

2. **Original NPA still active** → TSG1917 was approved 8 months ago and has 4 months remaining validity. No reactivation needed.

3. **On Evergreen list** → FX Options are on the approved Evergreen product list with 3-year validity.

4. **Limits not exceeded** → Current usage is 3 of 10 deals ($80M of $500M notional). Your $50M trade will bring total to $130M, still within limits.

5. **No variations detected** → You confirmed 'same structure, same counterparty rating (BBB+), same settlement method.' No changes from TSG1917.

You can trade this immediately. Here's what happens next:
- Execute the deal with your client
- Email GFM COD SG – COE NPA with deal details (within 30 minutes)
- NPA team logs Evergreen usage and updates limits
- Parallel NPA Lite reactivation initiated (will restore limits when approved)"

---

### Example Reasoning Output 3: Escalation (Low Confidence)

**Classification Result:**
- **Product Type:** UNCERTAIN (Variation vs Existing)
- **Confidence:** 68%
- **Action Required:** Escalate to GFM COO + Head of RMG-MLR
- **Status:** Awaiting human decision

**Reasoning:**
"I cannot confidently classify this product (confidence only 68%). Here's why:

**Evidence for 'Variation' (62% confidence):**
1. **Accounting treatment change** → You mentioned switching from accrual to mark-to-market accounting. This is flagged as a high-risk variation in our rules.
2. **Capital impact** → Mark-to-market requires daily P&L recognition, affecting capital requirements. This is a material change.
3. **Historical pattern** → 87% of accounting treatment changes were routed to Full NPA in the past.

**Evidence for 'Existing' (38% confidence):**
1. **Similar NPA found** → TSG2134 (Interest Rate Swap, approved 2023) has identical product structure.
2. **Same operational model** → Your description matches TSG2134 exactly except for accounting.
3. **You said 'no product changes'** → You confirmed the swap mechanics are unchanged, only the accounting treatment differs.

**The Ambiguity:**
Accounting changes typically trigger Variation → Full NPA, but if Finance confirms this is just a booking reclassification with no product changes, it might qualify as Existing → NPA Lite.

**My Recommendation:**
Treat as Variation → Full NPA (conservative approach, ensures proper Finance review of capital impact).

**Alternative:**
If Finance confirms this is administrative reclassification with no material impact, could route to NPA Lite → Addendum.

**Decision Required From:**
- GFM COO Office
- Head of RMG-MLR
- Group Finance (for capital impact assessment)

This escalation has been logged. Expected response: 1-2 business days."

---

## Integration with Other Agents

The Classification Router Agent doesn't work in isolation. It receives inputs from and sends outputs to other agents in the Phase 0 pipeline.

### Upstream Dependencies (Inputs)

**From Product Ideation Agent:**
- User's product description (natural language)
- Responses to 10-15 interview questions
- Cross-border confirmation (yes/no)
- Bundling detection flag

**From Prohibited List Checker Agent:**
- Prohibited status (pass/fail)
- If fail → Prohibition reason and contact info

**From KB Search Sub-Agent (RAG):**
- Top 5 similar historical NPAs
- Semantic similarity scores (0-100%)
- Status of similar NPAs (Active/Dormant/Expired/Launched)
- Validity status (how many days since approval)

**From Template Auto-Fill Engine:**
- Extracted product attributes (notional, tenor, counterparty rating, etc.)
- Risk indicators (market risk, credit risk, operational risk)
- Compliance flags (ESG, cross-book, third-party)

---

### Downstream Outputs (What Happens After Classification)

**To Approval Orchestration Sub-Agent:**
- Approval track selected (Full NPA, NPA Lite, Bundling, Evergreen, Hard Stop)
- Sign-off parties assigned (Credit, Finance, Legal, MLR, Ops, Tech, Compliance)
- Mandatory sign-offs flagged (if cross-border)
- PAC approval requirement (if NTG)

**To Status Report Sub-Agent:**
- Classification result (NTG/Variation/Existing)
- Confidence score
- Reasoning summary
- Escalation status (if applicable)

**To ML-Based Prediction Sub-Agent:**
- Product classification (as feature for prediction model)
- Historical NPA matches (for timeline prediction)
- Risk severity assessment (for approval likelihood prediction)

**To Workflow State Manager:**
- Initial state assignment (Draft, Awaiting PAC, Awaiting NPA, etc.)
- Valid next states (based on approval track)
- Circuit breaker initialization (loop-back count = 0)

**To Notification Agent:**
- If escalation needed → Notify GFM COO, Head of RMG-MLR
- If PAC required → Notify PAC secretariat
- If Evergreen → Notify GFM COD SG – COE NPA team

---

## Performance Targets

The Classification Router Agent must operate at enterprise-grade performance:

**Speed:**
- Processing time: <3 seconds per classification
- Rationale: Users expect instant feedback in conversational interface

**Accuracy:**
- Classification accuracy: >95% (measured against human expert review)
- False positive rate: <3% (incorrectly routing to higher track)
- False negative rate: <2% (incorrectly routing to lower track)

**Explainability:**
- Reasoning clarity: >4.5/5.0 (user satisfaction with explanation quality)
- Reasoning completeness: 100% (always provide rationale, never "black box")

**Reliability:**
- Uptime: 99.9% (max 43 minutes downtime per month)
- Error handling: 100% graceful degradation (never crash, always escalate when uncertain)

**Confidence Calibration:**
- When agent says 90% confident → Should be correct 90% of the time (calibration accuracy)
- Escalation appropriateness: >85% of escalations confirmed as genuinely ambiguous by humans

---

## Training Data Requirements

To achieve >95% accuracy, the agent needs comprehensive training data:

**Historical NPAs (1,784 cases from 2020-2025):**
- Each NPA labeled with:
  - Product classification (NTG/Variation/Existing)
  - Approval track actually used (Full NPA/NPA Lite/Bundling/Evergreen)
  - Outcome (Approved/Rejected/Withdrawn)
  - Sign-off parties involved
  - Timeline (days to approval)
  
**Edge Cases (200+ curated examples):**
- Borderline NTG/Variation cases
- Dormant products at 2.9 years vs 3.1 years
- Cross-border + Evergreen combinations
- Bundling with partial approvals

**Validation Set (300 cases held out):**
- Never used in training
- Used to measure accuracy before production deployment
- Representative of real-world distribution

**Expert Feedback Loop:**
- Every escalation decision reviewed by GFM COO
- Feedback incorporated into model retraining
- Quarterly model updates based on new patterns

---

## Success Metrics

**Primary KPIs:**

1. **Classification Accuracy**
   - Baseline: N/A (no automated classification today)
   - Target Year 1: >92%
   - Target Year 2: >95%
   - Measured by: Expert review of random sample (n=100 per month)

2. **Escalation Rate**
   - Target: <15% of classifications require escalation
   - Acceptable: 10-20% (indicates healthy uncertainty handling)
   - Concerning: >25% (indicates model underconfidence)

3. **Time Savings**
   - Baseline: 15-20 minutes per NPA (manual classification by Maker + NPA Champion discussion)
   - Target: <3 seconds (automated classification)
   - Impact: 99.7% time reduction on classification step

4. **User Trust**
   - Measured by: User satisfaction with reasoning explanations
   - Target: >4.3/5.0
   - Method: In-app feedback after classification result displayed

**Secondary KPIs:**

5. **Mis-Routing Rate**
   - Definition: Product routed to wrong approval track
   - Target: <3%
   - Impact: If mis-routed, causes delays and rework

6. **Over-Routing Rate**
   - Definition: Product routed to higher track than necessary (e.g., Full NPA when NPA Lite sufficient)
   - Target: <2%
   - Impact: Wastes approver time, delays processing

7. **Under-Routing Rate**
   - Definition: Product routed to lower track than necessary (compliance risk)
   - Target: <1% (CRITICAL for regulatory compliance)
   - Impact: Regulatory breach, audit findings

---

## Edge Cases and How the Agent Handles Them

### Edge Case 1: Dormant Product at Exactly 3 Years

**Scenario:** Last trade was exactly 1,095 days ago (3 years to the day)

**Challenge:** Rules say <3 years = Fast-Track, ≥3 years = Escalate

**Agent Handling:**
- Apply conservative interpretation: ≥3 years = Escalate
- Reasoning: "Product is at the 3-year boundary. To ensure appropriate risk review, I'm escalating to GFM COO for assessment."
- Confidence: 70% (borderline case, flag for human decision)

---

### Edge Case 2: Bundling with One Approved Block, One Pending

**Scenario:** FX Option (approved) + New exotic option (pending NPA)

**Challenge:** Bundling requires "all blocks approved"

**Agent Handling:**
- Detect that one block is not yet approved
- Route to Full NPA (cannot use Bundling Approval)
- Reasoning: "This bundle includes a New exotic option that doesn't have NPA approval yet. All building blocks must be individually approved before bundling."
- Suggestion: "Consider getting the exotic option approved first, then submit the bundle."

---

### Edge Case 3: Evergreen Product with Limits Exceeded Mid-Day

**Scenario:** At 9 AM, Evergreen usage was $480M (within $500M limit). User tries to trade $50M at 2 PM, but another desk traded $30M at 11 AM, bringing total to $510M.

**Challenge:** Real-time limit tracking

**Agent Handling:**
- Check limits against real-time data (not cached)
- Detect limit breach: $510M + $50M = $560M > $500M limit
- Block trade, display message: "Evergreen limit exceeded. Current usage: $510M/$500M. Your $50M trade cannot proceed under Evergreen."
- Offer alternatives: 
  - "Option 1: Request COO approval for limit increase"
  - "Option 2: Submit as NPA Lite (standard approval process)"

---

### Edge Case 4: Cross-Border + Evergreen Combination

**Scenario:** Singapore desk wants to trade Evergreen-eligible product with Hong Kong entity (cross-border)

**Challenge:** Evergreen typically allows same-day trading, but cross-border requires additional sign-offs

**Agent Handling:**
- Detect both Evergreen eligibility AND cross-border booking
- Apply override: Cross-border mandatory sign-offs take precedence
- Route to: NPA Lite (cannot use pure Evergreen fast-track)
- Reasoning: "This product is on the Evergreen list, but cross-border booking requires mandatory Finance, Credit, MLR, Tech, and Ops sign-offs. Using NPA Lite with Evergreen reference for expedited processing."
- Timeline: 2-5 days (faster than Full NPA, slower than Evergreen)

---

### Edge Case 5: User Contradicts Their Own Answers

**Scenario:** User initially says "no variations," but later mentions "we're adding a new settlement option"

**Challenge:** Inconsistent information

**Agent Handling:**
- Detect contradiction in conversation history
- Flag inconsistency to user: "You mentioned 'no variations' earlier, but just mentioned adding a new settlement option. Adding settlement options is typically considered a variation."
- Ask clarifying question: "Can you confirm: Is the settlement option entirely new, or just enabling an existing option?"
- Lower confidence score: Start at 85%, reduce to 70% due to inconsistency
- If user confirms contradiction → Likely escalate due to low confidence

---

## The Agent's "Thinking Process" (Explainability)

When the agent makes a decision, it follows a structured thinking process that mirrors how a human NPA Champion would reason:

**Step 1: Pattern Recognition**
- "I recognize this as an FX Option based on keywords: currency pair, strike price, expiry, optionality"
- "FX Options are one of our most common products"

**Step 2: Historical Search**
- "I found 47 similar FX Options approved in the past 3 years"
- "Closest match is TSG1917 (95% similarity)"

**Step 3: Differentiation**
- "TSG1917 was Singapore desk only"
- "Your product involves Hong Kong entity (cross-border)"
- "This is the key difference"

**Step 4: Rule Application**
- "Since this is cross-border, Finance + Credit + MLR + Tech + Ops sign-offs become mandatory"
- "Original product was 'Existing,' but cross-border changes routing"

**Step 5: Track Selection**
- "Classification: Existing (New to Location)"
- "Track: NPA Lite with cross-border override"
- "Cannot use Evergreen due to mandatory sign-offs"

**Step 6: Confidence Assessment**
- "I'm 88% confident because:"
- "✓ Clear historical match (TSG1917)"
- "✓ Cross-border rule is unambiguous"
- "✓ User confirmed no product structure changes"
- "⚠ Slight uncertainty: Does cross-border override Evergreen eligibility? (Yes, per GFM SOP Section 2.3.2)"

**Step 7: Output Generation**
- "Classification: Existing (New to Location)"
- "Track: NPA Lite"
- "Special Requirements: Cross-border mandatory sign-offs"
- "Timeline: 4-6 days"
- "Confidence: 88%"

This step-by-step reasoning is what the agent displays to the user, making the "black box" transparent.

---

## Continuous Learning and Model Updates

The Classification Router Agent is not static—it learns and improves over time.

**Learning Mechanism 1: Expert Feedback**
- Every escalation reviewed by GFM COO + Head of RMG-MLR
- Expert's decision logged: "Agreed with agent recommendation" vs "Disagreed, here's why"
- Disagreements analyzed to identify rule gaps or model biases

**Learning Mechanism 2: Outcome Validation**
- Track what happened after classification (Was NPA approved? Rejected? Rerouted?)
- If NPA routed to Full NPA was approved in 2 days (unusually fast) → Might have been over-routed
- If NPA routed to NPA Lite was rejected due to insufficient sign-offs → Under-routed

**Learning Mechanism 3: New Patterns**
- New product types emerge (e.g., first crypto derivative, first carbon credit swap)
- Agent flags: "I've never seen this product type before"
- Expert classifies it, adds to training data
- Agent learns: "Carbon credit swaps are treated as New-to-Group"

**Retraining Cadence:**
- **Monthly:** Update prohibited list, Evergreen list, bundling list (rule updates, no model retrain)
- **Quarterly:** Retrain classification model with last 3 months of new NPAs + expert feedback
- **Annually:** Major model architecture review, add new features, optimize hyperparameters

**Version Control:**
- Every model version tagged (e.g., v1.0, v1.1, v1.2)
- Every classification decision logs which model version made it
- If model v1.3 has worse performance than v1.2 → Rollback
- A/B testing: 10% of users get new model, 90% get stable model, compare accuracy

---

## Conclusion: Why This Agent Is Critical

The Classification Router Agent is the **brain** of the NPA Workbench because it makes the fundamental decision that determines everything else:
- Which approval track (affects timeline and resources)
- Which sign-off parties (affects stakeholder engagement)
- What requirements apply (affects compliance)
- What the outcome will likely be (affects user expectations)

Without accurate classification, the entire system fails—products get routed to wrong tracks, approvals get delayed, compliance risks emerge.

**But here's the magic:** This agent makes decisions in 3 seconds that would take a human NPA Champion 15-20 minutes of research and deliberation—and it does so with >95% accuracy and complete explainability.

That's the power of combining rule-based logic (hard constraints) with machine learning (pattern recognition) and uncertainty quantification (confidence scoring).

---

**Next Deliverable:** Template Auto-Fill Engine - How to copy/adapt content from historical NPAs to auto-populate 78% of fields

---
