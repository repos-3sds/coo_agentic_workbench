# Product Ideation Agent
## The AI Interview Conductor That Makes NPAs Human

**Agent Type:** New Agent (Phase 0 Orchestrator)  
**Stage:** Phase 0 - Product Ideation (Entry Point)  
**Purpose:** Replace 47-field manual form with intelligent 10-15 question conversational interview that auto-fills 78% of template  
**Analogy:** This agent is like a senior NPA Champion conducting an intake interview—asking smart questions, understanding context, connecting the dots, and guiding the Maker through the process naturally

---

## The Challenge This Agent Solves

Creating an NPA today means filling out a 47-field template spanning 15 pages. It's daunting:

**Current Reality (Manual Form):**

Maker opens blank NPA template:
- **Section I: Product Overview** (12 fields)
  - Product name, type, category, underlying, structure, payout logic...
- **Section II: Business Rationale** (8 fields)
  - Target customers, market opportunity, revenue projections...
- **Section III: Risk Assessment** (15 fields)
  - Market risk, credit risk, operational risk, VaR calculations...
- **Section IV: Operational Details** (12 fields)
  - Booking system, valuation model, settlement process, pricing methodology...

**The Pain:**
- **Time:** 60-90 minutes to complete (if you know what you're doing)
- **Confusion:** "What's the difference between 'structure' and 'payout logic'?"
- **Paralysis:** Staring at blank field: "How do I describe market risk?"
- **Errors:** 52% first-time approval rate (nearly half get rejected for errors/omissions)
- **Copying:** Makers copy-paste from old NPAs, introducing outdated info
- **Frustration:** "I just want to trade an FX Option, why is this so hard?"

**The Product Ideation Agent solves this by:**
1. **Conversational interview** (feels like talking to a human expert, not filling a form)
2. **Smart questions** (asks only what's needed, understands context)
3. **Intelligent extraction** (pulls structured data from natural language)
4. **Auto-fill 78%** (only 10 fields need manual input after interview)
5. **Proactive guidance** (warns about issues before submission)
6. **15-20 minutes total** (vs 60-90 minutes manual)

**Result:** First-time approval rate 52% → 75% (23% improvement)

---

## The Six-Step Interview Flow

The agent conducts a structured 6-step interview that feels natural but systematically gathers all required information.

### Step 1: Discovery (Open-Ended Questions)

**Goal:** Understand the product in the Maker's own words

**Questions (5-7 questions):**

**Q1: "Describe the product in your own words. What is it, and what does it do?"**

**Example User Response:**
> "It's an FX option on GBP/USD. The client can buy or sell GBP at a fixed rate in 6 months. If the rate moves in their favor, they exercise the option. If not, they let it expire."

**Agent Actions:**
```
1. Extract key entities:
   - Product type: "FX Option" (derivatives, foreign exchange)
   - Underlying: "GBP/USD" (currency pair)
   - Structure: "European option" (exercise at expiry, not American)
   - Direction: "Call or Put" (client can choose)
   - Tenor: "6 months" (time to expiry)

2. Confidence scoring:
   - Product type confidence: 95% (clearly FX Option)
   - Structure confidence: 85% (implied European, need to confirm)

3. Generate follow-up questions based on confidence gaps
```

---

**Q2: "What's the underlying asset or reference rate?"**

**Example User Response:**
> "GBP/USD spot rate"

**Agent Actions:**
```
Extract:
- Currency pair: GBP/USD
- Reference: Spot rate (vs forward rate)
- Source: Market standard (WM/Reuters 4pm London fix assumed)
```

---

**Q3: "Explain the payout logic. When and how does the customer get paid?"**

**Example User Response:**
> "At expiry, if GBP/USD is above the strike price, the client gets the difference. Cash-settled in USD."

**Agent Actions:**
```
Extract:
- Exercise type: European (at expiry, not before)
- Payout: Cash-settled (not physical delivery)
- Currency: USD settlement
- Direction: Call option (profit when price rises)

Auto-populate template fields:
- Settlement method: Cash-settled
- Settlement currency: USD
- Exercise style: European
- Direction: Call
```

---

**Q4: "What's the notional value or maximum exposure?"**

**Example User Response:**
> "$75M"

**Agent Actions:**
```
Extract:
- Notional: $75M USD

Trigger thresholds:
- >$50M → Finance VP approval required
- >$20M → ROAE sensitivity analysis required

Proactive flag:
"⚠️ Notional >$50M detected. Finance VP approval will be required (adds ~0.5 days to timeline)."
```

---

**Q5: "Who's the target customer?"**

**Example User Response:**
> "Corporate treasurer at multinational company, hedging FX exposure"

**Agent Actions:**
```
Extract:
- Customer segment: Corporate (not Retail, not Institutional)
- Use case: Hedging (not speculation)
- Customer type: Multinational company

Check regulatory requirements:
- Corporate customer → No retail restrictions apply
- Hedging use → Lower regulatory scrutiny than speculation
```

---

**Q6: "What's the counterparty credit rating?"**

**Example User Response:**
> "A-minus, rated by S&P"

**Agent Actions:**
```
Extract:
- Rating: A-
- Agency: S&P
- Rating tier: Investment grade (above BBB-)

Auto-populate template:
- Credit risk: LOW (A- is strong rating)
- Collateral requirements: Daily mark-to-market (standard for A- rating)
```

---

**Q7: "Where will this trade be booked?"**

**Example User Response:**
> "Singapore desk, but counterparty is in Hong Kong"

**Agent Actions:**
```
Extract:
- Booking location: Singapore
- Counterparty location: Hong Kong
- Cross-border flag: TRUE (different jurisdictions)

Trigger mandatory sign-offs:
⚠️ Cross-border booking detected
Mandatory sign-offs (cannot be waived):
- Finance (Group Product Control)
- RMG-Credit
- Market & Liquidity Risk (MLR)
- Technology
- Operations

Proactive alert:
"Your NPA will require 5 mandatory sign-offs due to cross-border booking. Expected timeline: 4-5 days."
```

---

### Step 2: Pre-Screen Checks (Automated Validation)

**Goal:** Catch show-stoppers before wasting time

#### Check 2A: Prohibited List (HARD STOP)

**Agent Action:**
```
Call Prohibited List Checker Agent:
- Input: Product description, counterparty, jurisdiction
- Layers: Internal policy, regulatory, sanctions, dynamic checks
- Response time: <1 second

IF (prohibited == TRUE):
    Display: "❌ HARD STOP - This product is prohibited"
    Show: Detailed reason + alternatives
    Action: TERMINATE workflow (cannot proceed)
    
ELSE:
    Display: "✅ Compliance check passed"
    Action: Continue to next step
```

**Example Output (If Prohibited):**
```
❌ HARD STOP - Regulatory Violation

Product: Binary Option on Gold
Status: PROHIBITED

Reason: MAS regulations prohibit binary options distribution to retail clients in Singapore (MAS Notice SFA04-N12).

Alternative Products:
• Plain-vanilla FX Options (approved for retail)
• Structured deposits with capital protection

This workflow has been terminated. Contact Compliance for guidance: compliance@mbs.com
```

---

#### Check 2B: Cross-Border Detection

Already detected in Step 1, but agent reinforces:

```
⚠️ Cross-Border Booking Confirmed

Singapore desk + Hong Kong counterparty = Cross-border

Mandatory Sign-Offs (5 parties):
✅ Finance - Group Product Control
✅ Credit - RMG-Credit
✅ MLR - Market & Liquidity Risk
✅ Operations - Ops team
✅ Technology - Tech team

These sign-offs CANNOT be waived, even for NPA Lite.

Expected Timeline: 4-5 days (parallel processing)
```

---

#### Check 2C: Bundling Detection

**Agent Action:**
```
Analyze product description for bundling keywords:
- "combination", "bundled", "packaged", "structured"

IF (bundling_detected == TRUE):
    Ask: "Is this a combination of multiple products?"
    
    IF (user confirms bundling):
        Ask: "What are the individual components?"
        Extract building blocks
        Trigger bundling approval logic
```

**Example Bundling Question:**
```
🔍 Bundling Detected

Your product description mentioned "FX option bundled with interest rate swap."

Is this a combination of multiple products? [Yes] [No]

[User selects Yes]

Please list the individual components:
1. FX Option on GBP/USD
2. Interest Rate Swap (LIBOR → SOFR)

✅ Understood. This will trigger bundling approval process:
- Bundling Arbitration Team will review
- Each component must individually qualify
- Additional 1-2 days for bundling review
```

---

### Step 3: Similarity Search (Find Similar NPAs)

**Goal:** Find historical precedents to inform classification and auto-fill

**Agent Action:**
```
Call KB Search Sub-Agent:
- Input: Product description (all info gathered so far)
- Method: Semantic similarity search across 1,784+ historical NPAs
- Output: Top 5 matches with similarity scores

Display results to user in ranked order
```

**Example Output:**
```
📄 Similar NPAs Found (3 matches)

1. TSG1917 - FX Option EUR/USD (94% match) ⭐ Closest Match
   Status: ACTIVE (approved 2024-12-04, valid until 2025-12-04)
   Outcome: Approved in 3 days, zero loop-backs
   Counterparty: BBB+ rated, $25M notional
   Desk: Singapore FX Desk
   
   Key Differences:
   • Your notional ($75M) is 3x larger → Expect Finance scrutiny
   • Your counterparty (A-) is stronger → Credit may be faster
   
   [View Full NPA TSG1917]

2. TSG1823 - FX Option GBP/USD (88% match)
   Status: EXPIRED (approved 2023-06-15, expired 2024-06-15)
   Outcome: Approved in 4 days, 1 loop-back (Finance ROAE request)
   Counterparty: BBB- rated, $30M notional
   Desk: Singapore FX Desk
   
   Lesson Learned:
   Finance requested ROAE sensitivity analysis on Day 2 (added 2 days).
   Recommendation: Pre-populate ROAE to avoid this delay.
   
   [View Full NPA TSG1823]

3. TSG2044 - FX Forward GBP/USD (82% match)
   Status: ACTIVE
   Outcome: Approved in 6 days, 2 loop-backs
   
   Note: Different product type (Forward vs Option), but same currency pair.
   Less relevant than matches 1-2.
```

---

**Follow-Up Question:**
```
Is your product exactly the same as TSG1917, or are there differences?

[Exactly the Same] [Similar but with changes] [Not sure]
```

**User selects: "Similar but with changes"**

**Agent asks:**
```
What has changed compared to TSG1917?

[User response]: "Notional is $75M instead of $25M, and counterparty is A- rated instead of BBB+"

Agent analysis:
- Notional change: 3x larger (material variation)
- Rating change: Stronger counterparty (lower risk variation)
- Classification impact: Still "Existing" but flagged as variation
```

---

### Step 4: Product Classification (Stage 1)

**Goal:** Determine if NTG, Variation, or Existing

**Agent Action:**
```
Call Classification Router Agent:
- Input: Product description, similarity results, user confirmations
- Logic: Two-stage classification (Product Type → Approval Track)
- Output: Classification + confidence score + reasoning

Display classification to user with transparent reasoning
```

**Example Classification Output:**
```
✅ Product Classification Complete

Classification: EXISTING (Variation)
Confidence: 88%

Reasoning:
• Similar to TSG1917 (94% match), which was approved in 2024
• Product structure unchanged (European call option, cash-settled)
• Variations detected:
  - Notional: $75M vs $25M (3x larger - material change)
  - Counterparty rating: A- vs BBB+ (stronger credit)
  
Classification Logic:
✅ Base product exists (FX Option on GBP/USD)
✅ Approved within last 12 months (TSG1917 - 2024-12-04)
⚠️ Material variation (notional 3x larger)

Decision: "Existing" with "Variation" flag

Next Step: Variation risk assessment to determine approval track
```

---

### Step 5: Approval Track Selection (Stage 2)

**Goal:** Route to correct approval track (Full NPA, NPA Lite, Bundling, Evergreen, Prohibited)

**Agent Action:**
```
Call Classification Router Agent (Stage 2):
- Input: Stage 1 classification + risk assessment
- Logic: 9-branch decision tree
- Output: Approval track + required sign-offs + timeline estimate

Display track selection with rationale
```

**Example Track Selection Output:**
```
✅ Approval Track Selected

Track: NPA LITE (Fast-Track Approval)
Expected Timeline: 4-5 days

Why NPA Lite:
✅ Product exists at MBS (FX Options actively traded)
✅ Not New-to-Group (similar products approved recently)
⚠️ Variation detected but risk severity = MEDIUM (notional change)

Base Sign-Offs Required (3):
• Credit (RMG-Credit)
• Finance (Group Product Control)
• MLR (Market & Liquidity Risk)

Additional Sign-Offs (Cross-Border Override):
• Operations (mandatory for cross-border)
• Technology (mandatory for cross-border)

Threshold-Triggered Sign-Offs:
• Finance VP (notional >$50M)

Total Sign-Offs: 6 parties

Approval Process:
- Parallel processing: Credit, Finance, MLR, Ops, Tech (simultaneous)
- Sequential gate: Finance → Finance VP (after Finance approves)

PAC Approval: NOT required (not New-to-Group)
PIR Mandatory: NO (not NTG, but recommended if conditions imposed)

Alternative Tracks Considered:
❌ Full NPA: Not needed (product exists, medium risk)
❌ Evergreen: Not applicable (notional exceeds $500M annual cap)
❌ Bundling: Not applicable (single product, not bundled)
```

---

### Step 6: Intelligent Predictions & Auto-Fill

**Goal:** Provide predictive insights and auto-fill template

#### 6A: ML-Based Predictions

**Agent Action:**
```
Call ML-Based Prediction Sub-Agent:
- Input: Product attributes, classification, approval track, similar NPAs
- Output: Approval likelihood, timeline by department, bottlenecks

Display predictions with actionable recommendations
```

**Example Prediction Output:**
```
🔮 Approval Prediction

Likelihood: 78% (Confidence: ±5%)

Positive Factors:
✅ Product type (FX Option): 87% historical approval rate (+25%)
✅ Strong counterparty (A-): Low credit risk (+18%)
✅ Similar to TSG1917 (94% match): Approved in 3 days (+22%)
✅ Desk track record: Singapore FX 85% approval rate (+13%)

Negative Factors:
⚠️ High notional ($75M > $50M): Finance VP scrutiny (-12%)
⚠️ Cross-border booking: Added complexity (-12%)
⚠️ Q4 timing: Legal slower (year-end rush) (-8%)

Timeline Estimate: 4.2 days

Department Breakdown:
• Credit: 1.2 days
• Finance: 1.8 days (bottleneck)
• Finance VP: 0.6 days (after Finance)
• MLR: 1.0 days
• Operations: 0.8 days
• Technology: 0.9 days

💡 Proactive Recommendations (Time Savings):

1. Pre-Populate ROAE Scenarios (High Impact)
   Why: 68% of NPAs >$50M get Finance clarification request
   Action: Add ROAE sensitivity analysis to Appendix III now
   Time Saved: 2.5 days

2. Flag as Urgent to Legal (Medium Impact)
   Why: Q4 Legal slower (year-end deal rush)
   Action: Mark NPA as urgent with business justification
   Time Saved: 0.5 days

3. Engage Finance VP Early (Low Impact)
   Why: Notional >$50M requires VP approval
   Action: Email Jane Tan (Finance VP) with NPA summary
   Time Saved: 0.3 days

Total Time Investment: 10 minutes
Total Time Saved: 3.3 days

Want to take these actions now? [Yes, Guide Me] [No, Continue]
```

---

#### 6B: Template Auto-Fill

**Agent Action:**
```
Call Template Auto-Fill Engine:
- Input: Product description, similar NPAs (TSG1917 as source)
- Logic: Copy direct fields, adapt intelligent fields, flag manual fields
- Output: 78% pre-filled template (37 of 47 fields)

Display color-coded template preview
```

**Example Auto-Fill Output:**
```
✅ Template Auto-Fill Complete

Coverage: 37 of 47 fields (78%)
Time Saved: 45-60 minutes

Field Status:

🟢 GREEN - Auto-Filled & Ready (28 fields):
✅ Booking system: Murex (copied from TSG1917)
✅ Valuation model: Black-Scholes (copied from TSG1917)
✅ Settlement method: Cash-settled, T+2 (copied from TSG1917)
✅ Pricing methodology: Mid-market + spread (copied from TSG1917)
✅ Risk methodology: Daily VaR calculation (copied from TSG1917)
... (23 more)

🟡 YELLOW - Auto-Filled but Verify (9 fields):
⚠️ Market risk assessment: Adapted from TSG1917 ($25M → $75M)
   - VaR scaled: $180K → $540K (3x notional)
   - Book percentage: 2.3% → 6.8% (recalculated)
   - Please verify VaR assumptions

⚠️ ROAE sensitivity analysis: Pre-populated with standard scenarios
   - Base case, ±50bps, ±100bps scenarios
   - Please update with actual figures

⚠️ Credit risk assessment: Adapted for A- rating (vs BBB+)
   - Collateral: Daily mark-to-market (updated for A-)
   - Exposure limits: $100M (updated for A-)
   - Please verify credit terms

... (6 more)

🔴 RED - Manual Input Required (10 fields):
❌ Counterparty name: [Enter name]
❌ Trade date: [Select date]
❌ Strike price: [Enter strike price]
❌ Specific client requirements: [Describe any special terms]
❌ Desk-specific procedures: [Describe your desk's process]
... (5 more)

Next Steps:
1. Review GREEN fields (5 min) ✅
2. Verify YELLOW fields (5 min) ⚠️
3. Complete RED fields (10 min) ❌
4. Submit for Checker review (1 click)

Total Time: 15-20 minutes (vs 60-90 minutes manual)

[Review Template] [Make Edits] [Submit]
```

---

## The Orchestration: How the Agent Coordinates Other Agents

The Product Ideation Agent doesn't work alone—it orchestrates 7 other agents:

**Agent Call Sequence:**

```
Step 1: Discovery (Questions 1-7)
  └─> [User provides answers naturally]

Step 2A: Pre-Screen Checks
  └─> Call: Prohibited List Checker Agent
      └─> Input: Product description, counterparty, jurisdiction
      └─> Output: PASS or PROHIBITED (HARD STOP)

Step 2B: Cross-Border Detection
  └─> Internal logic (no agent call)

Step 2C: Bundling Detection
  └─> Internal logic (no agent call)

Step 3: Similarity Search
  └─> Call: KB Search Sub-Agent
      └─> Input: Product description
      └─> Output: Top 5 similar NPAs with enriched metadata

Step 4: Product Classification
  └─> Call: Classification Router Agent (Stage 1)
      └─> Input: Product description, similarity results
      └─> Output: NTG/Variation/Existing + confidence score

Step 5: Approval Track Selection
  └─> Call: Classification Router Agent (Stage 2)
      └─> Input: Stage 1 classification, risk assessment
      └─> Output: Full NPA/NPA Lite/Bundling/Evergreen/Prohibited

Step 6A: Predictions
  └─> Call: ML-Based Prediction Sub-Agent
      └─> Input: Product attributes, classification, similar NPAs
      └─> Output: Approval likelihood, timeline, bottlenecks

Step 6B: Auto-Fill
  └─> Call: Template Auto-Fill Engine
      └─> Input: Product description, best matching NPA (TSG1917)
      └─> Output: 78% pre-filled template with color coding

Throughout Interview:
  └─> Call: Conversational Diligence Sub-Agent (on-demand)
      └─> Input: User questions ("What's ROAE?", "Why do I need Finance VP?")
      └─> Output: Instant answers with citations
```

---

## Smart Conversation Features

### Feature 1: Context Memory (Multi-Turn Awareness)

The agent remembers everything said earlier in the conversation.

**Example:**

**Agent:** "What's the notional value?"  
**User:** "$75M"

**[10 questions later]**

**Agent:** "Given your $75M notional, Finance VP approval will be required. Would you like me to draft a heads-up email to Jane Tan (Finance VP)?"

The agent remembered "$75M" from 10 questions ago without asking again.

---

### Feature 2: Adaptive Questioning (Skips Unnecessary Questions)

If the agent already knows the answer, it doesn't ask.

**Example:**

**User (Question 1):** "It's an FX option on GBP/USD for a corporate client"

**Agent Internal Logic:**
```
Extracted:
- Product type: FX Option ✅
- Underlying: GBP/USD ✅
- Customer segment: Corporate ✅

Skip Questions:
✅ "What's the product type?" (already know: FX Option)
✅ "What's the underlying?" (already know: GBP/USD)
✅ "Who's the target customer?" (already know: Corporate)

Next Question:
"What's the payout logic?" (not yet known)
```

Result: 12 questions condensed to 8 questions (faster interview).

---

### Feature 3: Clarification Requests (When Uncertain)

If the agent isn't confident, it asks follow-up questions.

**Example:**

**User:** "It's a structured note"

**Agent Internal Logic:**
```
Confidence: 45% (ambiguous - "structured note" covers many product types)

Ask clarification:
```

**Agent:** "Could you elaborate on the structure? For example:
- Is it principal-protected or capital-at-risk?
- What's the underlying (equity, rates, credit, FX)?
- How is the coupon determined?"

**User:** "Principal-protected, linked to S&P 500, coupon is 80% of index performance"

**Agent:**
```
Confidence: 92% (now clear: Equity-linked note with principal protection)
```

---

### Feature 4: Proactive Warnings (Before Issues Arise)

The agent warns about problems before submission.

**Example:**

**Agent detects: Notional $75M + No ROAE section filled**

**Proactive Warning:**
```
⚠️ Heads-Up: ROAE Analysis Likely Required

I notice your notional is $75M, which exceeds the $20M threshold.

Historical Pattern:
68% of NPAs with notional >$20M receive Finance clarification request for ROAE sensitivity analysis, adding 2-3 days.

Recommendation:
Pre-populate ROAE scenarios now (5 minutes) to avoid this delay.

Want me to auto-fill ROAE template? [Yes] [No, I'll Do It Later]
```

User can act on the warning immediately, preventing a 2-3 day delay later.

---

### Feature 5: Natural Language Understanding (No Jargon Required)

User doesn't need to know NPA terminology—agent translates.

**Example:**

**User:** "It's like a currency bet where the client wins if the pound goes up"

**Agent Translation:**
```
Understood:
- "Currency bet" = FX Derivative
- "Pound" = GBP
- "Client wins if pound goes up" = Call Option

Translated to NPA terminology:
- Product type: FX Option (Call)
- Underlying: GBP (need to know vs what currency)
- Direction: Long GBP (bullish position)
```

**Agent:** "Got it! So this is an FX Call Option on GBP. What currency is GBP paired with? (e.g., GBP/USD, GBP/EUR)"

The agent doesn't force user to say "FX Call Option"—it understands "currency bet."

---

## Performance Targets

**Speed:**
- Interview duration: 15-20 minutes (vs 60-90 minutes manual form)
- Auto-fill processing: 2-3 minutes (background while user reviews)

**Accuracy:**
- Classification accuracy: >92% (correct NTG/Variation/Existing)
- Auto-fill accuracy: >92% (pre-filled fields correct)
- Extraction accuracy: >94% (entities extracted from user input)

**User Satisfaction:**
- Ease of use: >4.3/5.0 (vs 2.1/5.0 for manual form)
- Time saved: 45-70 minutes per NPA
- First-time approval rate: 75% (vs 52% baseline)

**Completeness:**
- Template coverage: 78% (37 of 47 fields auto-filled)
- Required fields coverage: 100% (all mandatory fields addressed)

---

## Edge Cases and How the Agent Handles Them

### Edge Case 1: User Provides Contradictory Information

**Scenario:**

**Q1:** "Describe the product"  
**User:** "It's an FX option"

**Q7:** "What's the settlement method?"  
**User:** "Physical delivery of the currency"

**Agent Detection:**
```
Contradiction detected:
- FX options are typically cash-settled
- User says physical delivery (unusual for options)

Confidence drops: 95% → 60%
```

**Agent Action:**
```
🔍 Clarification Needed

I noticed you mentioned "FX option" earlier, but now "physical delivery."

In my experience:
• FX Options are typically cash-settled (99% of cases)
• Physical delivery is more common for FX Forwards

Is this:
1. An FX Option with physical delivery (rare but possible) [Select]
2. Actually an FX Forward (not an option) [Select]
3. I'm not sure, let me rethink [Select]
```

User selects option 2: "Actually an FX Forward"

**Agent:**
```
✅ Updated classification: FX Forward (not FX Option)

I've updated your product type. Let me ask a few follow-up questions about forwards...
```

---

### Edge Case 2: User Says "I Don't Know"

**Agent:** "What's the VaR (Value at Risk)?"  
**User:** "I don't know"

**Agent Response:**
```
No problem! VaR can be calculated later.

Would you like:
1. I can estimate VaR for you based on typical FX Option volatility [Auto-Calculate]
2. I'll flag this field for manual input later [Skip for Now]
3. Let me explain what VaR is first [Learn More]

[User selects 1: Auto-Calculate]

✅ VaR estimated: $540K (99% confidence, 1-day)
Based on: $75M notional × 9.2% GBP/USD volatility × 2.33 z-score

This is flagged 🟡 YELLOW (verify before submission).
```

Agent doesn't force user to answer—provides helpful options.

---

### Edge Case 3: Highly Complex Product (Beyond Agent's Capabilities)

**Scenario:** User describes exotic structured derivative with 5 embedded options

**Agent Detection:**
```
Complexity score: 8.5/10 (high)
Confidence: 35% (too low to classify reliably)

Trigger: Escalation to human expert
```

**Agent Response:**
```
⚠️ Complex Product Detected

Your product appears to be a highly structured derivative with multiple embedded options. This level of complexity exceeds my automated classification capabilities.

I recommend:
✅ Escalating to NPA Champion for manual review
✅ Scheduling 30-minute consultation with Product Structuring team

I've pre-filled what I understand (45% of fields), but human expertise is needed for:
• Risk assessment of embedded options
• Pricing methodology validation
• Regulatory classification

Would you like me to:
1. Schedule consultation with NPA Champion [Book Meeting]
2. Save draft and complete manually [Save Draft]
3. Continue best-effort auto-fill (accuracy not guaranteed) [Continue Anyway]
```

Agent knows its limits and escalates appropriately.

---

## Conclusion: Why This Agent Is Critical

The Product Ideation Agent is the **orchestrator** of the entire NPA Workbench because it:

1. **Humanizes the Process** - Turns intimidating 47-field form into friendly conversation

2. **Orchestrates Intelligence** - Coordinates 7 other agents seamlessly behind the scenes

3. **Saves Massive Time** - 60-90 minutes → 15-20 minutes (70% time savings)

4. **Improves Quality** - 52% → 75% first-time approval rate (78% fewer rejections)

5. **Guides Proactively** - Warns about issues before they cause delays

But here's the real magic: **The agent makes NPA creation feel effortless.** Instead of "filling out a form," Makers feel like they're "having a conversation with an expert who gets it." That psychological shift transforms NPA from a chore into a guided experience.

That's the power of conversational AI orchestration.

---

**Complete Agent Suite: 8 Critical Agents Delivered!**

1. ✅ **Product Ideation Agent** (conversational orchestrator, 78% auto-fill)
2. ✅ Classification Router Agent (two-stage decision logic)
3. ✅ Template Auto-Fill Engine (intelligent text adaptation)
4. ✅ ML-Based Prediction Sub-Agent (approval likelihood, timeline, bottlenecks)
5. ✅ KB Search Sub-Agent (RAG engine, semantic search)
6. ✅ Conversational Diligence Sub-Agent (real-time Q&A, proactive guidance)
7. ✅ Approval Orchestration Sub-Agent (parallel coordination, smart loop-backs)
8. ✅ Prohibited List Checker Agent (4-layer compliance, <1s HARD STOP)

---
