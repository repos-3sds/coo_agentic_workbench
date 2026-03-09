# Conversational Diligence Sub-Agent
## The Expert Advisor Who's Always Available

**Agent Type:** Sub-Agent (Diligence Stage)  
**Stage:** Active throughout entire workflow, especially critical in Phase 0 and during NPA creation  
**Purpose:** Answer user questions in natural language, provide contextual help, offer proactive guidance, and flag potential issues before they become problems  
**Analogy:** This agent is like having a senior NPA Champion sitting next to you, instantly answering every question as you work: "What sign-offs do I need?" "What's the ROAE formula?" "Why did TSG1917 get approved so fast?"

---

## The Challenge This Agent Solves

Creating an NPA is complex. At every step, Makers have questions:
- "What information do I need to include in the risk assessment?"
- "Do I need Finance sign-off for a $30M deal?"
- "What's the difference between NPA Lite and Full NPA?"
- "How do I calculate VaR for this product?"
- "Why was my similar NPA rejected last time?"

**Current Reality:**

A Maker is filling out the NPA template at 11 PM (deadline tomorrow morning). They have a question:

**"Do I need cross-border sign-offs for this deal?"**

**Option 1: Email NPA Champion**
- Send email, wait for response
- Response time: 8-12 hours (next business day)
- Problem: Deadline is in 9 hours, can't wait

**Option 2: Search NPA SOP Document**
- Open 449-line PDF
- Ctrl+F "cross-border" → 23 matches
- Read through all 23 mentions to find answer
- Time spent: 25 minutes
- Result: Still not 100% sure of the answer

**Option 3: Ask Colleague**
- Message on Slack: "Anyone know if cross-border requires mandatory sign-offs?"
- Response: "I think so, but not sure. Check with Jane."
- Message Jane: No response (11 PM)
- Give up, make best guess

**The Conversational Diligence Sub-Agent solves this by:**
1. **Instant answers** (<3 seconds response time)
2. **Natural language** (ask questions like you would ask a human)
3. **Contextual understanding** (knows what you're working on, adapts answer accordingly)
4. **Multi-turn conversations** (can ask follow-up questions)
5. **Proactive guidance** (surfaces relevant info before you ask)
6. **Always cited** (shows sources so you can verify)

**Example Interaction:**

**User:** "Do I need cross-border sign-offs?"

**Agent (2.1 seconds later):**
> Yes, cross-border booking requires **mandatory sign-offs** from 5 parties:
> - Finance (Group Product Control)
> - RMG-Credit
> - RMG-Market & Liquidity Risk (MLR)
> - Technology
> - Operations
> 
> These sign-offs **cannot be waived**, even for NPA Lite.
> 
> **Source:** GFM NPA SOP Section 2.3.2 (Page 8)
> 
> **Related:** I see your NPA involves Singapore + Hong Kong booking. This qualifies as cross-border, so all 5 sign-offs will be auto-added to your approval matrix.

---

## How the Agent Works: The Question-Answering Pipeline

### Step 1: Question Understanding (Natural Language Processing)

When a user asks a question, the agent first needs to **understand** what they're asking.

**Example Question:** "What sign-offs do I need for a $50M FX Option?"

**Agent Processing:**
1. **Intent Classification:** What type of question is this?
   - Intent: "sign-off_requirements" (asking about approval parties)
   - Not "product_definition" (what is FX Option)
   - Not "timeline_prediction" (how long will it take)

2. **Entity Extraction:** What key information is in the question?
   - Product type: FX Option
   - Notional: $50M
   - Implicit: User is creating an NPA (context from workflow state)

3. **Context Awareness:** What else do we know?
   - User is currently in Phase 0 (Product Ideation)
   - User's previous question: "What's the difference between Full NPA and NPA Lite?"
   - User's current NPA: Classification = "Existing", Approval Track = "NPA Lite"
   - User's desk: Singapore FX Desk

4. **Search Query Generation:** What to search for in knowledge base?
   - Primary search: "sign-off requirements NPA Lite $50M notional"
   - Secondary search: "approval matrix FX Option"
   - Tertiary search: "Finance sign-off threshold notional"

---

### Step 2: Knowledge Retrieval (RAG Search)

The agent calls the KB Search Sub-Agent to find relevant information:

**Search 1: Sign-Off Requirements**
```
KB Search Query: "sign-off requirements NPA Lite"
Results:
1. GFM NPA SOP Section 5.020 (Relevance: 94%)
   "NPA Lite typically requires: Credit, Finance, MLR"
   
2. Sign-Off Matrix Document (Relevance: 91%)
   "Product Type: FX Derivative → Credit, Finance, MLR, Ops, Tech"
   
3. TSG1917 (Similar NPA) (Relevance: 88%)
   "Sign-offs: Credit, Finance, Legal, MLR, Ops, Tech (6 parties)"
```

**Search 2: Notional Threshold Rules**
```
KB Search Query: "Finance sign-off $50M notional threshold"
Results:
1. Finance Approval Policy (Relevance: 96%)
   "Notional >$50M requires Finance VP approval"
   
2. TSG2134 (Similar NPA, $75M notional) (Relevance: 89%)
   "Finance VP (Jane Tan) approved on Day 2"
```

**Search 3: Cross-Border Detection**
```
User's NPA Data: Location = Singapore + Hong Kong
Rule Engine: Cross-border = TRUE
KB Search Query: "cross-border mandatory sign-offs"
Results:
1. GFM NPA SOP Section 2.3.2 (Relevance: 99%)
   "Cross-border: Finance, Credit, MLR, Tech, Ops are MANDATORY"
```

---

### Step 3: Answer Synthesis (Natural Language Generation)

The agent combines search results into a coherent answer:

**Synthesis Logic:**

1. **Start with direct answer:**
   "For a $50M FX Option, you need the following sign-offs..."

2. **List required parties:**
   - Base requirements (from Sign-Off Matrix): Credit, Finance, MLR, Ops, Tech
   - Additional requirement (from Notional Threshold): Finance VP approval
   - Override (from Cross-Border Rule): Finance, Credit, MLR, Tech, Ops MANDATORY

3. **Explain reasoning:**
   "Because your notional exceeds $50M, Finance VP approval is required in addition to standard Finance sign-off."

4. **Add context:**
   "I also notice your NPA involves Singapore + Hong Kong booking (cross-border). This means Finance, Credit, MLR, Tech, and Ops sign-offs are MANDATORY and cannot be waived."

5. **Cite sources:**
   "Source: GFM NPA SOP Section 2.3.2, Finance Approval Policy Section 4.1"

6. **Proactive suggestion:**
   "Pro tip: Engage Finance VP early (email Jane Tan before formal submission) to smooth approval process."

---

### Step 4: Response Delivery with Citations

**Final Response to User:**

> **Sign-Off Requirements for Your $50M FX Option:**
> 
> **Required Parties (6 total):**
> 1. ✅ Credit (RMG-Credit)
> 2. ✅ Finance (Group Product Control)
> 3. ✅ Finance VP (Jane Tan) - *Required due to notional >$50M*
> 4. ✅ Market & Liquidity Risk (MLR)
> 5. ✅ Operations
> 6. ✅ Technology
> 
> **Why These Sign-Offs?**
> - **Base requirement:** FX Options require Credit, Finance, MLR, Ops, Tech (standard for FX derivatives)
> - **Notional threshold:** $50M exceeds $50M threshold → Finance VP approval required
> - **Cross-border booking:** Singapore + Hong Kong = Mandatory Finance, Credit, MLR, Tech, Ops (cannot be waived)
> 
> **Timeline Estimate:**
> - Credit: 1.2 days
> - Finance: 1.8 days (includes VP review)
> - MLR: 1.0 days
> - Ops: 0.8 days
> - Tech: 0.9 days
> - **Total: ~4.5 days** (parallel processing)
> 
> **Sources:**
> - GFM NPA SOP Section 5.020 (Sign-Off Matrix)
> - GFM NPA SOP Section 2.3.2 (Cross-Border Requirements)
> - Finance Approval Policy Section 4.1 (Notional Thresholds)
> - Similar NPA: TSG1917 (FX Option, 6 sign-offs, approved in 3 days)
> 
> **Pro Tip:** 💡 Proactively email Finance VP (Jane Tan) with NPA summary before formal submission to expedite VP review.
> 
> **Related Questions You Might Have:**
> - "What information does Finance VP typically review?"
> - "Can I request expedited sign-offs if time-sensitive?"
> - "What happens if one approver delays?"

---

## The Five Interaction Modes

The Conversational Diligence Sub-Agent operates in five distinct modes depending on how the user engages:

### Mode 1: Direct Question-Answer (Reactive)

**Trigger:** User explicitly asks a question

**Example User Questions:**
- "What's the difference between NPA Lite and Full NPA?"
- "How do I calculate VaR for an FX Option?"
- "Why was TSG1917 approved so quickly?"
- "What does 'Evergreen' mean?"

**Agent Response Pattern:**
1. Direct answer (concise, 2-3 sentences)
2. Detailed explanation (if complex)
3. Examples or analogies (if helpful)
4. Citations (always)
5. Related questions (optional, to guide user)

**Example:**

**User:** "What's the difference between NPA Lite and Full NPA?"

**Agent:**
> **Quick Answer:**
> NPA Lite is a fast-track approval process for low-risk products that already exist in the bank. Full NPA is the comprehensive approval process for new-to-group products or high-risk variations.
> 
> **Key Differences:**
> 
> | Aspect | Full NPA | NPA Lite |
> |--------|----------|----------|
> | **Use Case** | New-to-Group, high-risk variations | Existing products, low-risk variations |
> | **Timeline** | 12 days avg (target 4 days with AI) | 5-10 days |
> | **Sign-Offs** | All parties (Credit, Finance, Legal, MLR, Ops, Tech, Compliance) | Reduced set (typically Credit, Finance, MLR) |
> | **PAC Approval** | Required for NTG | Not required |
> | **PIR Mandatory** | Yes (within 6 months) | Only if conditions imposed |
> | **Examples** | First time trading CDS, new distribution channel | FX Option in new location, dormant product reactivation |
> 
> **How to Decide:**
> Your NPA is classified as "Existing" (FX Option already approved in Singapore). This qualifies for **NPA Lite**, which will be faster than Full NPA.
> 
> **Source:** GFM NPA SOP Section 4.0, NPA Classification Decision Tree
> 
> **Related:** "What are the 4 types of NPA Lite?" or "Can NPA Lite be rejected?"

---

### Mode 2: Contextual Help (Proactive During Form Filling)

**Trigger:** User cursor hovers over field or clicks help icon

**Example:** User clicks help icon next to "Market Risk Assessment" field

**Agent Proactive Display (Before User Asks):**

> **💡 Market Risk Assessment - What to Include**
> 
> This section should cover:
> 1. **Notional as % of Desk Book** - Calculate: Your notional / Total desk FX book
>    - Example: "$50M / $1.1B = 4.5% of desk book"
> 2. **Value at Risk (VaR)** - Estimate 1-day VaR at 99% confidence
>    - Formula: Notional × Volatility × 2.33 (99% z-score)
>    - Typical FX Option VaR: 0.5-1.0% of notional
> 3. **Volatility Analysis** - Historical volatility of currency pair
>    - Use Bloomberg: HVT <currency pair> <tenor>
>    - Example: "EUR/USD 30-day vol: 8.5%"
> 4. **Duration/Tenor Risk** - How long until expiry?
>    - Longer tenor = higher risk
> 
> **Example from Similar NPA (TSG1917):**
> "The $25M notional represents 2.3% of the desk's total FX book ($1.1B). Daily VaR is estimated at $180K (99% confidence, 1-day holding period). The EUR/USD currency pair has moderate volatility (historical 30-day vol: 8.5%), and the 3-month tenor limits duration risk."
> 
> **Auto-Fill Available:** I can pre-populate this section using TSG1917 as template. Want me to do that?
> [Yes, Auto-Fill] [No, I'll Write It]

---

### Mode 3: Multi-Turn Conversation (Follow-Up Questions)

**Trigger:** User asks follow-up question after initial answer

**Example Conversation:**

**User:** "What sign-offs do I need?"

**Agent:** "For your $50M FX Option, you need Credit, Finance, Finance VP, MLR, Ops, Tech (6 total)..."

**User:** "Why is Finance VP required?"

**Agent (Understands Context - "Finance VP" refers to previous answer):**
> Finance VP approval is required because your notional ($50M) exceeds the $50M threshold defined in Finance Approval Policy Section 4.1.
> 
> **Threshold Rules:**
> - Notional <$20M: Standard Finance approval only
> - Notional $20M-$50M: Finance approval + ROAE sensitivity analysis
> - **Notional >$50M: Finance approval + Finance VP approval** ← You're here
> - Notional >$100M: Finance approval + Finance VP + CFO approval
> 
> In your case, Finance VP (Jane Tan) will review the ROAE impact and capital efficiency of this $50M deal.
> 
> **Historical Pattern:** 82% of deals >$50M received Finance VP approval within 1 day (rarely a bottleneck).

**User:** "How do I contact Jane?"

**Agent (Maintains Conversation Context):**
> **Jane Tan (Finance VP)**
> - Email: jane.tan@mbs.com
> - Office: Tower 1, Level 15
> - Availability: Mon-Fri 9am-6pm SGT
> - Current Workload: Moderate (12 NPAs in queue vs typical 8)
> 
> **Email Template:**
> ```
> Subject: Heads-up: $50M FX Option NPA Submission Tomorrow
> 
> Hi Jane,
> 
> I'm submitting an NPA tomorrow for a $50M FX Option on GBP/USD (BBB+ counterparty, 6-month tenor). 
> 
> Since notional exceeds $50M, I understand VP approval is required. Just wanted to give you advance notice and happy to discuss any questions.
> 
> Key metrics:
> - ROAE: [insert estimate]
> - VaR: $360K
> - Desk book impact: 4.5%
> 
> Thanks,
> [Your Name]
> ```
> 
> **Pro Tip:** Sending this proactive email typically saves 0.5-1.0 days on Finance approval timeline.

---

### Mode 4: Proactive Warnings (Before User Asks)

**Trigger:** Agent detects potential issue during NPA creation

**Example Scenario:** User sets notional to $75M but hasn't filled ROAE section

**Agent Proactive Alert (Interrupts User):**

> ⚠️ **Potential Bottleneck Detected**
> 
> I notice your notional is $75M, which exceeds the $20M threshold for ROAE sensitivity analysis.
> 
> **Historical Pattern:** 68% of NPAs with notional >$20M receive Finance clarification request for ROAE scenarios, adding 2-3 days to timeline.
> 
> **Recommendation:** Pre-populate ROAE section (Appendix III) now to avoid this delay.
> 
> **Would you like me to:**
> 1. ✅ Auto-fill ROAE template with standard scenarios (5 min)
> 2. ❌ Skip for now (I'll fill it manually later)
> 
> [Auto-Fill ROAE] [Skip]

---

### Mode 5: Guided Walkthroughs (Step-by-Step Help)

**Trigger:** User asks "How do I..." question

**Example User Question:** "How do I submit an NPA?"

**Agent Response (Step-by-Step Guide):**

> **📋 NPA Submission Process - Complete Guide**
> 
> **Step 1: Complete Product Ideation (Phase 0)** ⬅️ You are here
> - Chat with Product Ideation Agent (10-15 questions)
> - Agent auto-classifies product and selects approval track
> - Agent auto-fills 78% of template fields
> - **Estimated Time:** 15-20 minutes
> 
> **Step 2: Review Auto-Filled Template**
> - Check green fields (auto-filled, ready to go)
> - Verify yellow fields (auto-filled but flagged for confirmation)
> - Complete red fields (manual input required)
> - **Estimated Time:** 10-15 minutes
> 
> **Step 3: Submit for Checker Review**
> - Click "Submit for Checker Review" button
> - Checker validates completeness and accuracy
> - If approved → Proceeds to Sign-Off stage
> - If rejected → Returns to you with comments
> - **Estimated Time:** Checker review takes 4-6 hours
> 
> **Step 4: Parallel Sign-Offs**
> - Credit, Finance, Legal, MLR, Ops, Tech review simultaneously
> - Each approver has 48-hour SLA
> - You'll receive notifications when each approves
> - **Estimated Time:** 3-5 days (parallel processing)
> 
> **Step 5: Launch Preparation**
> - Once all sign-offs complete, prepare for launch
> - System configuration, UAT, regulatory clearance
> - **Estimated Time:** 1-2 days
> 
> **Step 6: Launched + PIR**
> - Product goes live
> - PIR scheduled automatically (Launch + 6 months)
> - **Ongoing:** Monitoring and reporting
> 
> **Total Timeline:** 4-6 days (with AI assistance vs 12 days baseline)
> 
> **Want detailed help with any specific step?** Just ask!

---

## Smart Features: What Makes This Agent Intelligent

### Feature 1: Context Awareness (Understands Your Workflow State)

The agent knows where you are in the workflow and tailors responses accordingly.

**Example: Same Question, Different Context**

**Scenario 1: User in Phase 0 (Product Ideation)**

**User:** "What sign-offs do I need?"

**Agent:**
> Based on your product (FX Option, $50M, Singapore + Hong Kong), you'll need:
> - Credit, Finance, Finance VP, MLR, Ops, Tech (6 parties)
> 
> These will be **auto-assigned** when you complete Product Ideation. No action needed from you right now.

---

**Scenario 2: User in Sign-Off Stage (Already Submitted)**

**User:** "What sign-offs do I need?"

**Agent:**
> Your NPA (TSG2025-042) is currently in Sign-Off stage. Here's the status:
> 
> ✅ **Approved:** Credit (Jane Tan, 2024-12-16, 1.2 days)
> ⏳ **In Progress:** Finance (Mark Lee, submitted 2024-12-16, 0.8 days elapsed)
> ⏳ **Pending:** MLR, Ops, Tech (waiting for Finance)
> 
> **Expected Completion:** 2024-12-19 (2.5 days remaining)
> 
> **Next Action:** Monitor Finance approval (due by 2024-12-18 per 48-hour SLA)

The same question gets different answers based on workflow context.

---

### Feature 2: Proactive Bottleneck Prediction

The agent doesn't just answer questions—it warns about issues before they happen.

**Example: Agent Detects Upcoming Issue**

**Scenario:** User finishes Product Ideation, about to submit for Checker review

**Agent Proactive Message (Before User Asks):**

> 💡 **Optimization Opportunity**
> 
> Before you submit, I noticed a few things that could speed up approval:
> 
> **1. Missing ROAE Scenarios (High Impact)**
> - Your notional ($75M) exceeds $20M threshold
> - 68% probability Finance will request ROAE sensitivity analysis
> - **Action:** Pre-fill ROAE section now (saves 2.5 days)
> - **Time Required:** 5 minutes
> 
> **2. Q4 Legal Delay (Medium Impact)**
> - Current date is December 15 (Q4 year-end rush)
> - Legal approvals +0.5 days slower in Q4
> - **Action:** Flag NPA as "Urgent" with business justification
> - **Time Required:** 2 minutes
> 
> **3. Finance VP Contact (Low Impact)**
> - Finance VP approval required (notional >$50M)
> - **Action:** Send proactive email to Jane Tan
> - **Time Required:** 3 minutes
> 
> **Total Time Investment:** 10 minutes  
> **Potential Time Saved:** 3.0 days
> 
> Want to take these actions now?
> [Yes, Guide Me] [No, Submit As-Is]

---

### Feature 3: Analogies and Examples (Makes Concepts Understandable)

For complex concepts, the agent uses analogies and real-world examples.

**Example: Explaining "Evergreen" Concept**

**User:** "What does 'Evergreen' mean?"

**Agent:**
> **Evergreen Products: The "Season Pass" Analogy**
> 
> Think of Evergreen like a **season pass at a theme park**:
> 
> **Regular NPA = Buy Ticket Each Time**
> - Every time you want to trade an FX Option, submit new NPA
> - Go through full approval process (4-12 days)
> - Tedious for products you trade frequently
> 
> **Evergreen = Season Pass (3 Years)**
> - Get approved once for 3 years
> - Trade anytime within limits (no new NPA needed)
> - Just log the transaction (same-day execution)
> 
> **How Evergreen Works:**
> 1. Product approved as "Evergreen" (one-time NPA)
> 2. Set limits: $500M notional cap, 10 deals max (per product)
> 3. Trade anytime: Just log usage, don't need new approval
> 4. When limits hit: Either get COO approval for increase, or submit NPA Lite
> 
> **Evergreen Products at MBS:**
> - Vanilla FX Options
> - Standard FX Forwards
> - Plain-vanilla Interest Rate Swaps
> - Dual Currency Deposits
> - (28 total approved Evergreen products)
> 
> **Your Product:** Your FX Option **is on the Evergreen list!** If similar NPA exists and is active, you can trade immediately (just log transaction).
> 
> **Next Step:** Let me check if there's an active Evergreen NPA for your product...
> 
> [Search Evergreen List]

---

### Feature 4: Citation Transparency (Always Show Sources)

Every answer includes source citations so users can verify information.

**Example: Answer with Multiple Sources**

**User:** "What are the cross-border sign-off requirements?"

**Agent:**
> Cross-border booking requires **5 mandatory sign-offs:**
> 1. Finance (Group Product Control)
> 2. RMG-Credit
> 3. RMG-Market & Liquidity Risk (MLR)
> 4. Technology
> 5. Operations
> 
> These sign-offs **cannot be waived**, even for NPA Lite or Evergreen products.
> 
> **Sources:**
> 
> 📄 **GFM NPA SOP Section 2.3.2** (Primary Policy)
> ```
> "Cross-border booking mandatory sign-offs:
> Product Unit must engage Finance, Credit, MLR, 
> Technology, and Operations for all cross-border 
> transactions. These sign-offs are non-negotiable 
> and supersede standard approval matrices."
> ```
> [View Full Section]
> 
> 📄 **Finance Cross-Border Policy** (Supporting Policy)
> "Inter-company transactions require Finance sign-off for transfer pricing validation and P&L allocation across legal entities."
> [View Document]
> 
> 📄 **Historical Example: TSG2089** (Precedent)
> FX Option, Singapore + Hong Kong, All 5 mandatory sign-offs applied, Approved in 4.5 days
> [View NPA TSG2089]
> 
> **Why These 5 Sign-Offs?**
> - **Finance:** Transfer pricing, P&L allocation across entities
> - **Credit:** Counterparty exposure across jurisdictions
> - **MLR:** Market risk aggregation across books
> - **Technology:** System connectivity between locations
> - **Operations:** Settlement coordination between ops teams

---

### Feature 5: Calculation Assistance (Built-In Formulas)

For financial/risk calculations, the agent can compute results on the fly.

**Example: VaR Calculation**

**User:** "How do I calculate VaR for my $50M FX Option?"

**Agent:**
> **Value at Risk (VaR) Calculation for FX Options**
> 
> **Formula:**
> VaR = Notional × Volatility × Z-score (confidence level)
> 
> **Your Inputs:**
> - Notional: $50M
> - Currency Pair: GBP/USD
> - Tenor: 6 months
> - Confidence Level: 99% (standard)
> 
> **Step 1: Get Volatility**
> - GBP/USD 6-month historical volatility: 9.2% (from Bloomberg)
> - Adjust for tenor: √(180/252) × 9.2% = 7.7% (1-day equivalent)
> 
> **Step 2: Z-Score for 99% Confidence**
> - Z-score = 2.33 (statistical constant for 99%)
> 
> **Step 3: Calculate VaR**
> - VaR = $50M × 7.7% × 2.33
> - VaR = $50M × 0.179
> - **VaR = $8.97M** (1-day, 99% confidence)
> 
> **Interpretation:**
> There's a 1% chance your loss could exceed $8.97M in a single day.
> 
> **As % of Notional:** 8.97 / 50 = **17.9%** (typical for FX Options)
> 
> **What to Include in NPA:**
> "Daily VaR is estimated at $9.0M (99% confidence, 1-day holding period), representing 18% of notional. This is consistent with typical FX Option volatility for a 6-month tenor on GBP/USD (historical vol: 9.2%)."
> 
> **Want me to auto-fill this into your Market Risk Assessment section?**
> [Yes, Auto-Fill] [No, I'll Write It]

---

## Integration with Other Agents

The Conversational Diligence Sub-Agent works closely with other agents:

### Integration 1: KB Search Sub-Agent

**When:** User asks question requiring factual information

**Data Flow:**
```
User: "What's the Finance approval threshold?"
       ↓
Conversational Diligence: "Search KB for Finance approval threshold"
       ↓
KB Search: Return [Finance Policy Section 4.1, TSG1917 example, Approval matrix]
       ↓
Conversational Diligence: Synthesize answer with citations
       ↓
User: Receives answer in 2.1 seconds
```

---

### Integration 2: ML-Based Prediction Sub-Agent

**When:** User asks about expected timeline or approval likelihood

**Data Flow:**
```
User: "How long will Finance approval take?"
       ↓
Conversational Diligence: "Get Finance timeline prediction"
       ↓
ML Prediction: Calculate based on current workload, notional, historical patterns
       ↓
ML Prediction: Return [Finance: 1.8 days, range 1-3 days, confidence 82%]
       ↓
Conversational Diligence: "Finance approval typically takes 1.8 days for your product type..."
```

---

### Integration 3: Template Auto-Fill Engine

**When:** User asks for help filling a specific section

**Data Flow:**
```
User: "Can you help me write the Market Risk Assessment?"
       ↓
Conversational Diligence: "Trigger Template Auto-Fill for Market Risk section"
       ↓
Template Auto-Fill: Find similar NPA (TSG1917), adapt content for user's notional
       ↓
Conversational Diligence: Display preview with option to accept/edit
```

---

## Performance Targets

**Speed:**
- Response time: <2.5 seconds average (user perceives as "instant")
- Complex questions: <5 seconds (calculations, multi-source synthesis)

**Accuracy:**
- Factual accuracy: >95% (answers match ground truth in policy documents)
- Relevance: >90% (user rates answer as "helpful" for their question)

**Coverage:**
- Answer success rate: >85% (can answer 85% of user questions without escalation)
- Citation rate: 100% (every answer includes source citation)

**User Satisfaction:**
- Helpfulness rating: >4.3/5.0
- Time saved vs manual search: 22 minutes per question (25 min manual → 3 min with agent)

---

## Edge Cases and How the Agent Handles Them

### Edge Case 1: Ambiguous Question

**User:** "What do I need?"

**Challenge:** Too vague—need what? Sign-offs? Documents? Information?

**Agent Handling:**
- Detect ambiguity (low confidence in intent classification)
- Ask clarifying question:

> I'd be happy to help! To give you the most accurate answer, could you clarify what you're asking about?
> 
> Are you asking about:
> 1. **Sign-off requirements** (who needs to approve this NPA)
> 2. **Document requirements** (what attachments to include)
> 3. **Information requirements** (what fields to fill in template)
> 4. **Something else** (please specify)
> 
> Or feel free to rephrase your question, and I'll do my best to understand!

---

### Edge Case 2: Question Outside Agent's Knowledge

**User:** "What's the Fed's next interest rate decision?"

**Challenge:** Question about external macroeconomic events, not NPA process

**Agent Handling:**
- Detect out-of-scope question
- Politely redirect:

> I specialize in helping with the NPA approval process at MBS. Questions about Federal Reserve policy decisions are outside my area of expertise.
> 
> However, I can help you with:
> - **How interest rate changes affect your NPA:** If rates rise, how does that impact your FX Option valuation?
> - **Historical NPAs during rate cycles:** How did similar NPAs perform during the 2022 rate hike cycle?
> - **Rate risk assessment:** What to include in your NPA's interest rate sensitivity analysis
> 
> Would any of these be helpful?

---

### Edge Case 3: Contradictory Information in Sources

**User:** "How many sign-offs do I need for NPA Lite?"

**Challenge:** Different sources give different answers
- GFM SOP: "NPA Lite typically requires Credit, Finance, MLR"
- Sign-Off Matrix: "FX Derivatives require Credit, Finance, MLR, Ops, Tech"

**Agent Handling:**
- Flag contradiction explicitly:

> I found somewhat conflicting information in our policy documents. Let me clarify:
> 
> **General Rule (GFM NPA SOP):**
> NPA Lite typically requires: Credit, Finance, MLR (3 parties)
> 
> **Product-Specific Rule (Sign-Off Matrix):**
> FX Derivatives require: Credit, Finance, MLR, Ops, Tech (5 parties)
> 
> **Resolution:**
> The **product-specific rule takes precedence**. For your FX Option, you need all 5 parties (Credit, Finance, MLR, Ops, Tech).
> 
> The general NPA Lite rule (3 parties) applies to simpler products like plain-vanilla loans or standard deposits.
> 
> **Sources:**
> - GFM NPA SOP Section 5.020 (General Rule)
> - Sign-Off Matrix Document v3.2 (Product-Specific Rule)
> 
> **Precedent:** TSG1917 (similar FX Option) had 5 sign-offs

---

## Conclusion: Why This Agent Is Critical

The Conversational Diligence Sub-Agent is the **expert advisor** of the NPA Workbench because it:

1. **Eliminates Wait Time** - Instant answers vs 8-12 hours for email response

2. **Reduces Errors** - Correct, cited answers vs guessing or misinterpreting policy documents

3. **Accelerates Learning** - New Makers ramp up 3x faster with on-demand guidance

4. **Prevents Bottlenecks** - Proactive warnings stop issues before they cause delays

5. **Improves Quality** - Higher-quality NPAs with fewer mistakes and omissions

But here's the real magic: **The agent doesn't just answer the question you asked—it anticipates the questions you should ask but didn't know to ask.** Like a great mentor who says "By the way, you should also know about X..." before you even realize X is important.

That's the power of conversational AI with contextual awareness and proactive guidance.

---

**Next Deliverable:** Approval Orchestration Sub-Agent - How to coordinate parallel sign-offs, detect loop-backs, and manage escalations

---
