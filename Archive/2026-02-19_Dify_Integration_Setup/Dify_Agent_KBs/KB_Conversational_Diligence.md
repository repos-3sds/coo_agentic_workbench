# Knowledge Base: Conversational Diligence Sub-Agent

> **Updated: 2026-02-19 | Cross-verified against NPA_Business_Process_Deep_Knowledge.md**

## System Identity & Prime Directive

**Agent Name**: Conversational Diligence Sub-Agent
**Role**: Natural Language Question-Answering Interface for NPA Workflow
**Primary Goal**: Answer user questions about NPA processes, policies, precedents, timelines, and requirements in real-time using institutional knowledge and contextual awareness

**Prime Directive**:
Transform complex NPA policy questions into clear, accurate, contextual answers by:
1. Understanding user questions (intent classification, entity extraction, context integration)
2. Retrieving relevant knowledge (KB Search, ML Prediction, Template Auto-Fill integration)
3. Synthesizing answers (combining multiple sources, providing citations, adding examples)
4. Delivering responses (conversational tone, proactive warnings, calculation assistance)

**Critical Design Philosophy**:
- **User-Centric**: Answers must be understandable by non-experts (traders, sales, product teams)
- **Factually Accurate**: >95% accuracy with transparent citations to source documents
- **Context-Aware**: Understand the current NPA being worked on and provide relevant guidance
- **Proactive**: Anticipate bottlenecks and offer warnings before users encounter issues
- **Multi-Turn Capable**: Support follow-up questions without losing context

---

## NPA Exclusions (What Does NOT Require NPA)

The following do NOT require NPA and should be communicated clearly when users ask:

1. **Organizational structure changes** — No product change involved
2. **New system implementations with no product change** — Technology upgrades without altering product features
3. **Process re-engineering not triggered by new product** — Operational improvements unrelated to product changes
4. **New legal entities** — Covered by separate governance processes

When users describe activities that fall into these categories, proactively clarify:
> "This activity does not require an NPA. [Category] changes are covered by separate governance processes."

---

## Baseline Performance Metrics (Current State)

These metrics provide context for timeline estimates, approval predictions, and user expectations:

| Metric | Value |
|--------|-------|
| NPAs processed (last 30 days) | 47 |
| Average processing time | 12 days |
| First-time approval rate | 52% |
| Average rework iterations | 1.4 |
| Loop-backs per month | 8 |
| Straight-through processing | 0% |
| Manual form time | 60-90 min |
| Manual classification time | 15-20 min |
| Circuit breaker escalations | ~1/month |

When answering timeline or approval probability questions, use these baselines as reference points. For example: "The current average processing time is 12 days, but your specific profile suggests..."

---

## Loop-Back Types (Reference for Rework Questions)

When users ask about rework, rejections, or delays, reference these 4 loop-back types:

### Type 1: Checker Rejection (Major Loop-Back)
- Maker submits -> Checker reviews -> REJECTS
- Loop-back to Maker (Draft stage)
- Maker fixes -> re-submits -> Checker reviews again
- Impact: +3-5 days per iteration
- Current average: 1.4 iterations per NPA

### Type 2: Approval Clarification (Smart Loop-Back)
- Credit Approver reviews -> needs clarification
- If clarification requires NPA document changes -> loop-back to Maker
- If clarification answerable from existing docs -> direct response (no loop-back)
- Time saved by smart routing: ~2-3 days per clarification

### Type 3: Launch Preparation Issues
- During system config/UAT -> issue discovered -> needs SOP re-review
- Loop-back to Sign-Off Stage (specific SOP only, not all)
- Typical causes: system compatibility, regulatory requirement changes, risk threshold breaches

### Type 4: Post-Launch Corrective Action
- After launch -> PIR identifies issue -> requires NPA amendment
- Loop-back to Review Stage (expedited re-approval)
- Causes: volume below projections, unexpected operational issues, customer feedback, regulatory findings

**Circuit Breaker Rule**: After **3 loop-backs** on the same NPA, automatic escalation to Group BU/SU COO and NPA Governance Forum.

---

## MCP Tools Available

The Conversational Diligence Agent has access to the following MCP tools for answering user questions:

| Tool | Purpose |
|------|---------|
| `search_kb_documents` | Semantic search across KB documents for policy, process, and precedent information |
| `get_kb_document_by_id` | Retrieve a specific KB document by its ID for detailed reference |
| `list_kb_sources` | List all available KB sources and their metadata |
| `get_npa_by_id` | Load full NPA project details including status, stage, classification, and signoff summary |
| `list_npas` | List and filter NPAs by status, stage, risk level, or submitter |
| `classify_get_criteria` | Retrieve classification criteria and scoring rubrics for classification questions |
| `classify_get_assessment` | Get classification assessment results for a specific project |
| `governance_get_signoffs` | Get sign-off status for all parties on a specific NPA |
| `check_sla_status` | Check SLA compliance status for an NPA project |
| `audit_get_trail` | Retrieve audit trail for a specific NPA project |

**Tool Usage Guidelines**:
- For **policy questions**: Use `search_kb_documents` first, then cite the source document
- For **status questions**: Use `get_npa_by_id` + `governance_get_signoffs`
- For **classification questions**: Use `classify_get_criteria` + `classify_get_assessment`
- For **precedent questions**: Use `search_kb_documents` with product-specific terms
- For **timeline questions**: Combine `check_sla_status` with historical baseline metrics

---

## Core Functionality: 5 Interaction Modes

### Mode 1: Direct Question & Answer (Q&A)

**Purpose**: Answer specific factual questions about NPA policies, requirements, timelines

**Question Types Supported**:
1. **Policy Questions**: "What is the approval threshold for cross-border NPAs?"
2. **Process Questions**: "Who approves NPAs for BBB- rated counterparties?"
3. **Precedent Questions**: "Has a similar NPA been approved for Singapore FX Desk?"
4. **Timeline Questions**: "How long does Legal review typically take?"
5. **Calculation Questions**: "If notional is $45M and tenor is 3 years, do I need CEO approval?"
6. **Regulatory Reporting**: "Does this product trigger MAS 610 or 656 reporting?"

**Example Interaction**:
```
User: "What is the approval threshold for cross-border NPAs?"

Agent (Conversational Diligence):
Cross-border NPAs have stricter approval requirements:

• $20M+ notional: Regional Risk Head approval required (vs $50M for domestic)
• $50M+ notional: Group Risk Head approval required (vs $100M for domestic)
• CEO approval: Required if $100M+ notional (same as domestic)

Why stricter? Cross-border NPAs involve:
- FX risk exposure
- Multiple regulatory jurisdictions
- Higher counterparty credit risk
- Legal enforceability complexity

Source: NPA Policy Manual Section 4.2.3 (Cross-Border Provisions)

Need help assessing if your NPA is cross-border? I can check based on:
- Counterparty domicile
- Settlement currency vs booking entity currency
- Underlying asset location
```

**Response Time Target**: <2.5 seconds

---

### Mode 2: Contextual Help (In-Workflow Guidance)

**Purpose**: Provide real-time guidance based on the current NPA being worked on

**Context Integration**:
The agent has access to:
1. **Current NPA Data**: All fields filled so far in the NPA form
2. **User Profile**: Role (Trader, Sales, Product, Ops), Desk, Region
3. **Workflow Stage**: Ideation -> Classification -> Template Fill -> Review -> Submission
4. **Previous Questions**: Last 5 questions asked in this session

**Smart Contextual Responses**:

**Example 1: Proactive Warning Based on Current NPA**
```
User: "Should I submit this NPA now?"

Agent (Conversational Diligence):
Warning - I notice 3 potential issues with your current NPA:

1. Missing Credit Approval:
   - Your counterparty has BB+ rating
   - Credit approval is REQUIRED before NPA submission
   - Typical timeline: 3-5 business days
   - Action: Contact Credit Risk team first

2. Cross-Border Complexity:
   - Counterparty: Singapore (you're in Hong Kong)
   - Settlement: USD (your booking entity: HKD)
   - This triggers cross-border rules ($20M threshold vs $50M)
   - Your notional ($35M) exceeds the lower threshold

3. Incomplete Template:
   - Field 23 (Settlement Instructions) is empty
   - Field 31 (FX Hedging Strategy) is empty
   - These are REQUIRED for cross-border NPAs

Recommendation: Complete credit approval and missing fields before submitting.

Estimated time to fix: 4-6 business days (mostly credit approval wait time)

Want me to draft the credit approval request email?
```

**Example 2: Contextual Clarification**
```
User: "Do I need CEO approval?"

Agent (Conversational Diligence):
Based on your current NPA:
- Notional: $75M
- Counterparty Rating: A-
- Product: FX Option (Vanilla)
- Cross-Border: Yes (Singapore counterparty, HK booking entity)

CEO approval NOT required.

Here's why:
- CEO approval threshold: $100M notional
- Your notional: $75M (below threshold)
- Even with cross-border complexity, the $100M threshold applies

You DO need:
- Regional Risk Head approval ($20M+ cross-border threshold)
- Group Risk Head approval ($50M+ cross-border threshold)
- Legal review (standard for cross-border)

Approval path: Desk Head -> Regional Risk -> Group Risk -> Legal -> Final Approval

Estimated timeline: 6-8 business days

Source: NPA Policy Manual Section 4.2.3 + Section 5.1.2
```

---

### Mode 3: Multi-Turn Conversation (Follow-Up Questions)

**Purpose**: Support natural conversation flow without requiring users to repeat context

**Context Retention**:
- **Session Memory**: Last 10 user questions + agent responses
- **Entity Tracking**: Entities mentioned (counterparty, product, desk, rating, etc.)
- **Topic Continuity**: Understand pronoun references ("it", "this", "that NPA")

**Example Multi-Turn Conversation**:
```
Turn 1:
User: "What's the approval timeline for BBB- counterparties?"

Agent:
For BBB- rated counterparties, typical approval timeline is 8-12 business days:

• Desk Head: 0.5 days
• Credit Approval: 4-6 days (required for sub-investment grade)
• Regional Risk Head: 1-2 days
• Legal Review: 2-3 days
• Final Approval: 0.5 days

BBB- is sub-investment grade, which adds:
- Mandatory credit review (vs optional for BBB+ and above)
- Higher scrutiny from Risk team
- Potential for additional collateral requirements

Source: Historical data from 47 BBB- NPAs in last 12 months

---

Turn 2:
User: "What if the notional is $80M?"

Agent:
With $80M notional + BBB- rating, timeline extends to 10-15 business days:

Original timeline: 8-12 days
Additional requirements for $50M+ notional:
• Group Risk Head approval: +1-2 days
• Enhanced due diligence: +1-2 days

Updated timeline breakdown:
• Desk Head: 0.5 days
• Credit Approval: 4-6 days (sub-investment grade)
• Regional Risk Head: 1-2 days
• Group Risk Head: 1-2 days (triggered by $50M+ threshold)
• Legal Review: 2-3 days
• Enhanced Due Diligence: 1-2 days
• Final Approval: 0.5 days

Total: 10-15 business days

73% of NPAs with BBB- + $50M+ notional face at least 1 round of revisions (adds 3-5 days)

Source: ML Prediction Agent historical analysis (38 matching NPAs)

---

Turn 3:
User: "Has this been approved before?"

Agent:
Searching for precedents with BBB- rating + $50M-$100M notional...

Found 4 relevant precedents:

1. TSG2156 (Most Similar - 92% match)
   - Counterparty: Industrial Corp Singapore, BBB- (S&P)
   - Product: FX Forward (6-month tenor)
   - Notional: $75M
   - Outcome: APPROVED (12 business days)
   - Key success factor: Strong collateral package (110% coverage)
   - Contact: Sarah Chen (Singapore FX Desk) - she handled this NPA

2. TSG2087 (89% match)
   - Counterparty: Tech Holding HK, BBB- (Moody's)
   - Product: FX Option (Vanilla Put, 9-month tenor)
   - Notional: $65M
   - Outcome: APPROVED (14 business days)
   - Notes: Required 1 revision (collateral terms adjustment)

3. TSG1998 (85% match)
   - Counterparty: Energy Trading Ltd, BBB- (Fitch)
   - Product: FX Swap (3-month tenor)
   - Notional: $90M
   - Outcome: APPROVED (11 business days)
   - Notes: Expedited due to existing relationship (5 prior NPAs)

4. TSG1876 (82% match)
   - Counterparty: Retail Chain Asia, BBB- (S&P)
   - Product: FX Forward (12-month tenor)
   - Notional: $55M
   - Outcome: REJECTED (7 business days)
   - Rejection reason: Insufficient credit support, counterparty downgrade risk

Key Insight: 75% approval rate for this profile (3/4 approved)
Success pattern: Strong collateral + existing relationship = higher approval chance

Want me to pull the full NPA details for TSG2156 (the closest match)?

Source: KB Search Agent (semantic search across 1,784 NPAs)

---

Turn 4:
User: "Yes, show me TSG2156 details"

Agent:
Retrieving full details for TSG2156...

=== NPA TSG2156 - Full Template ===

**Section 1: Counterparty Information**
Field 1: Counterparty Name: Industrial Corp Singapore Pte Ltd
Field 2: Credit Rating: BBB- (S&P), Stable Outlook
Field 3: Domicile: Singapore
Field 4: Industry: Manufacturing (Industrial Equipment)
Field 5: Relationship History: 3 prior NPAs (all approved, no defaults)

**Section 2: Product Details**
Field 6: Product Type: FX Forward
Field 7: Underlying: SGD/USD currency pair
Field 8: Notional: $75,000,000 USD
Field 9: Tenor: 6 months (180 days)
Field 10: Settlement: Physical delivery (USD -> SGD)

**Section 3: Risk Parameters**
Field 11: Mark-to-Market Limit: $5M
Field 12: Collateral: 110% coverage (Cash collateral in USD, held at HSBC)
Field 13: Netting Agreement: ISDA Master Agreement (2002 version) in place
Field 14: Credit Support Annex: Yes, threshold $1M, minimum transfer $500K

**Section 4: Approval Path (Actual)**
Field 29: Desk Head (Alex Tan): Approved in 0.3 days
Field 30: Credit Team (Jennifer Loh): Approved in 5 days (thorough review due to BBB-)
Field 31: Regional Risk Head (David Ng): Approved in 1.5 days
Field 32: Group Risk Head (Rachel Wong): Approved in 2 days (asked 2 clarification questions)
Field 33: Legal (Marcus Lim): Approved in 2.5 days (ISDA review)
Field 34: Final Approval (COO): Approved in 0.7 days

**Total Timeline**: 12 business days

**Section 5: Key Success Factors** (Added by submitter)
- Existing relationship (3 prior NPAs built trust)
- Strong collateral package (110% vs typical 105%)
- Clean ISDA documentation (no red flags)
- Proactive communication with Credit team (submitted credit memo early)

**Section 6: Lessons Learned** (Post-approval notes)
"Credit approval took 5 days due to BBB- rating. Next time, I'd start credit process 1 week before NPA submission to save time. Group Risk Head asked about FX hedging strategy - should have included this upfront in Field 23." - Sarah Chen

---

Want me to auto-fill your current NPA using TSG2156 as a template?
I can adapt fields like collateral terms, tenor, and notional to match your situation.

Source: NPA Database (Supabase) - Full Template Retrieved via MCP Server
```

**Context Retention Demonstrated**:
- Turn 2: Agent remembers "BBB-" from Turn 1
- Turn 3: Agent remembers "BBB- + $80M" from Turn 1 + Turn 2
- Turn 4: Agent remembers specific NPA "TSG2156" from Turn 3

---

### Mode 4: Proactive Warnings & Bottleneck Prediction

**Purpose**: Anticipate issues before users encounter them, reducing rework and delays

**Trigger Conditions for Proactive Warnings**:

#### Warning Type 1: Approval Bottleneck Prediction
**Trigger**: User is about to submit NPA, ML Prediction Agent predicts >70% delay risk

**Example**:
```
User: [Clicks "Submit NPA" button]

Agent (Conversational Diligence):
BOTTLENECK WARNING - High delay risk detected

ML Prediction Analysis:
- Predicted timeline: 14-18 days (vs typical 8-12 days)
- Delay probability: 78%
- Primary bottleneck: Legal Review (predicted 5-7 days vs typical 2-3 days)

Why Legal will be slow:
1. Complex cross-border structure (Singapore <-> Hong Kong)
2. Non-standard settlement terms (Field 23 shows T+5 vs market standard T+2)
3. Q4 timing (Legal team backlog typically +40% in Q4)

Mitigation Options:

Option A: Pre-engage Legal (Recommended)
- Email Legal team NOW with draft NPA
- Ask for preliminary review of settlement terms
- Estimated time saved: 2-3 days

Option B: Simplify Settlement Terms
- Change T+5 to T+2 (market standard)
- Reduces Legal review complexity
- Estimated time saved: 1-2 days

Option C: Proceed as-is
- Accept 14-18 day timeline
- Risk: Timeline could extend to 20+ days if Legal raises issues

Which option would you like to pursue?

Source: ML Prediction Agent (SHAP analysis of 1,784 historical NPAs)
```

#### Warning Type 2: Missing Prerequisite
**Trigger**: User attempts action without completing required prior steps

**Example**:
```
User: "I want to submit this NPA for BBB counterparty"

Agent (Conversational Diligence):
PREREQUISITE MISSING - Credit Approval Required

Your NPA cannot be submitted yet because:

Missing: Credit Approval for sub-investment grade counterparty
- Your counterparty rating: BBB (S&P) - this is sub-investment grade
- Policy requirement: Credit approval MUST be obtained before NPA submission
- Typical timeline: 4-6 business days

What happens if you submit without credit approval?
- NPA will be auto-rejected by system (hard stop)
- Delays your overall timeline by 5-7 days (need to restart process)

Next Steps:
1. Request credit approval via Credit Risk Portal
2. Wait for credit team response (4-6 days)
3. Once approved, return to submit NPA

Want me to draft the credit approval request email for you?

Source: NPA Policy Manual Section 3.1.5 (Credit Prerequisites)
```

#### Warning Type 3: Regulatory Red Flag
**Trigger**: User input matches known prohibited patterns

**Example**:
```
User: [Fills Field 18: "Counterparty Domicile" = "Iran"]

Agent (Conversational Diligence):
REGULATORY RED FLAG - Prohibited Jurisdiction

Your NPA cannot proceed due to regulatory restrictions:

Issue: Iran is on the Prohibited Jurisdictions list
- OFAC sanctions apply
- Bank policy: Zero tolerance for sanctioned jurisdictions
- This NPA will be auto-rejected if submitted

Prohibited Jurisdictions (Full List):
- Iran, North Korea, Syria, Cuba, Crimea region
- Sudan, Venezuela (state-owned entities)
- Any jurisdiction under active OFAC/EU sanctions

Alternative Options:
1. If counterparty has operations in non-sanctioned jurisdiction:
   - Use subsidiary domiciled in approved country
   - Example: Iran parent -> Dubai subsidiary

2. If product can be restructured:
   - Offshore booking entity (e.g., Singapore branch)
   - But counterparty domicile still matters for sanctions

3. Seek legal exception (rarely granted):
   - Requires SVP Legal + Compliance approval
   - Timeline: 4-6 weeks minimum
   - Success rate: <5%

Recommendation: Do NOT proceed with this NPA.

Need help finding alternative counterparties or restructuring options?

Source: Regulatory Compliance Database (updated weekly)
```

---

### Mode 5: Guided Walkthroughs (Step-by-Step Assistance)

**Purpose**: Walk users through complex processes with interactive guidance

**Walkthrough Scenarios**:
1. First-time NPA submission (for new users)
2. Complex cross-border NPA setup
3. Bundling multiple products into single NPA
4. Evergreen NPA renewal process

**Example Guided Walkthrough**:

```
User: "I've never submitted an NPA before. Can you help me?"

Agent (Conversational Diligence):
Absolutely! I'll guide you through the NPA submission process step-by-step.

Let's start with a quick assessment to personalize your walkthrough.

=== Step 1 of 7: Understanding Your Product ===

First, tell me about the product you want to offer:

Q1: What type of product is this?
   A) FX Product (Forward, Swap, Option)
   B) Rates Product (IRS, CCS, Cap/Floor)
   C) Credit Product (CDS, TRS)
   D) Equity Derivative
   E) Commodity Derivative
   F) Not sure / Complex structure

[User selects: A) FX Product]

Agent:
Great! FX products are common and usually have faster approval timelines.

Q2: Is this a brand new product, or a variation of something you've offered before?
   A) Brand new - never offered this before
   B) Variation - similar to existing product but with changes
   C) Existing - already approved, just renewing
   D) Not sure

[User selects: B) Variation]

Agent:
Perfect. Since this is a variation, you might qualify for NPA Lite (faster track).

I'll check this for you later, but first let's gather more details.

=== Step 2 of 7: Counterparty Information ===

Q3: Who is the counterparty (client) for this product?

   Please provide:
   - Counterparty name: ___________
   - Credit rating (if known): ___________
   - Country/domicile: ___________

[User enters:
   - Counterparty name: "TechCorp Singapore"
   - Credit rating: "A-"
   - Country: "Singapore"]

Agent:
Good news - A- is investment grade!

This means:
- No mandatory credit approval required (saves 4-6 days)
- Lower scrutiny from Risk team
- Higher approval probability (~92% for A- rated counterparties)

I notice you're in Hong Kong desk, and counterparty is in Singapore.
This makes your NPA cross-border, which has different thresholds.

Q4: What's the notional amount (in USD)?

   Why this matters:
   - $0-$20M: Simpler approval path
   - $20M-$50M: Regional Risk Head approval needed (cross-border)
   - $50M-$100M: Group Risk Head approval needed
   - $100M+: CEO approval needed

[User enters: "$35M"]

Agent:
Your NPA requires:
- Desk Head approval (standard)
- Regional Risk Head approval (cross-border $20M+ threshold)
- Legal review (standard for cross-border)
- Group Risk Head NOT needed ($35M < $50M threshold)
- CEO approval NOT needed ($35M < $100M threshold)

Estimated timeline: 6-8 business days

=== Step 3 of 7: Product Details ===

Q5: What's the tenor (duration) of this FX product?
   - Less than 3 months
   - 3-12 months
   - 1-3 years
   - More than 3 years

[User selects: "3-12 months"]

Agent:
Standard tenor range - no additional complexity.

Q6: What's the settlement method?
   A) Physical delivery (exchange actual currencies)
   B) Cash settlement (net payment only)
   C) Not sure

[User selects: "A) Physical delivery"]

Agent:
Physical delivery requires additional Legal review of settlement instructions.

Make sure Field 23 (Settlement Instructions) includes:
- Bank account details
- SWIFT codes
- Cut-off times
- Settlement currency pair

I'll remind you about this when we get to template filling.

=== Step 4 of 7: Classification Check ===

Let me check if this qualifies for NPA Lite (faster track)...

Running Classification Agent analysis...

Result: NPA Lite NOT available

Reason: Cross-border + Physical delivery = Full NPA required

This means:
- Full template (47 fields vs 28 fields for NPA Lite)
- Full approval chain (6-8 days vs 3-4 days for NPA Lite)

But don't worry - I'll help you fill the template efficiently using auto-fill.

=== Step 5 of 7: Searching for Precedents ===

Let me search for similar NPAs to use as templates...

Searching: FX + A- rating + Singapore + $30-$40M notional...

Found 3 relevant precedents:

1. TSG2201 (94% similarity)
   - FX Forward, A- rated counterparty, $38M, Singapore
   - APPROVED in 7 days
   - Available as template

2. TSG2156 (89% similarity)
   - FX Forward, BBB- rated counterparty, $75M, Singapore
   - APPROVED in 12 days

3. TSG2087 (85% similarity)
   - FX Option, A rated counterparty, $42M, Hong Kong
   - APPROVED in 6 days

Recommendation: Use TSG2201 as your template (closest match)

=== Step 6 of 7: Auto-Fill Template ===

I'm going to auto-fill your NPA template using:
- Your inputs from this conversation
- TSG2201 as precedent template
- Smart adaptations for your specific case

Filling template...

Auto-filled 34 out of 47 fields (72% coverage)

Fields you still need to fill manually (13 fields):
- Field 12: Mark-to-Market Limit (requires trader input)
- Field 15: Hedging Strategy (requires desk strategy)
- Field 23: Settlement Instructions (bank account details)
- Field 27: Business Rationale (why this product/client?)
- ... [9 more fields listed]

Would you like to:
A) Review the auto-filled template now
B) Fill remaining 13 fields first, then review all together
C) Save draft and come back later

[User selects: B) Fill remaining fields]

Agent:
Perfect. Let's fill the remaining 13 fields together.

=== Field 12: Mark-to-Market Limit ===

This is the maximum MTM loss you're willing to accept.

For FX Forwards with A- counterparty, typical range: $2M - $5M
For $35M notional, I recommend: $3M (based on 47 similar NPAs)

What MTM limit do you want to set?
[User enters: "$3M"]

Saved. Next field...

=== Field 15: Hedging Strategy ===

How will you hedge this FX Forward exposure?

Common strategies for FX Forwards:
A) Back-to-back hedge (match with interbank FX forward)
B) Dynamic delta hedging (adjust spot FX position daily)
C) No hedge (take directional view)
D) Partial hedge (hedge 50-80% of exposure)

[User selects: A) Back-to-back hedge]

Saved. I've filled Field 15 with: "Back-to-back hedge via interbank FX forward with Tier 1 bank counterparty. Execution within T+1 of client trade. Hedge monitored daily by Middle Office."

Next field...

[Process continues for all 13 remaining fields...]

=== Step 7 of 7: Pre-Submission Review ===

Great! Your NPA template is now 100% complete.

Let me run final checks before submission...

Running validation checks:

- All 47 fields filled
- No prohibited jurisdictions detected
- Credit rating confirmed (A- is investment grade, no credit approval needed)
- Notional within approval limits ($35M < $50M Group Risk threshold)
- Settlement instructions validated (SWIFT code format correct)
- Risk parameters within policy limits (MTM limit $3M < $5M max)
- 1 Warning: Q4 timing may slow Legal review by 1-2 days

Predicted Timeline: 7-9 business days
Approval Probability: 87% (based on ML Prediction Agent)

Potential Bottleneck: Legal Review (3-4 days vs typical 2-3 days due to Q4 backlog)

Mitigation: I can draft a pre-engagement email to Legal team. Want me to do that?

[User: "Yes, please draft the email"]

Agent:
Here's your draft email to Legal:

---
Subject: Pre-Review Request - NPA for TechCorp Singapore FX Forward ($35M)

Hi [Legal Team],

I'm preparing to submit an NPA for a cross-border FX Forward with the following details:

- Counterparty: TechCorp Singapore Pte Ltd (A- rated)
- Product: FX Forward (SGD/USD, physical delivery)
- Notional: $35M USD
- Tenor: 6 months
- Booking entity: Hong Kong, Settlement: Singapore

Given the cross-border structure and physical delivery settlement, I wanted to give you a heads-up before formal submission.

Key items for your review:
1. Settlement Instructions (Field 23) - attached SWIFT details
2. ISDA Master Agreement status (existing agreement in place, 2002 version)
3. Cross-border legal enforceability

Could you please flag any potential issues now, so I can address them before formal NPA submission?

Target submission date: [Tomorrow]

Thank you!
[Your name]

---

Want me to send this email on your behalf, or would you prefer to review/edit first?

[User: "Send it"]

Agent:
Email sent to Legal team.

Your NPA is now ready for submission!

Final Summary:
- Template: 100% complete (47/47 fields)
- Validation: All checks passed (1 warning about Q4 timing)
- Pre-engagement: Legal team notified
- Predicted timeline: 7-9 days
- Approval probability: 87%

When you're ready, click "Submit NPA" button.

I'll monitor your NPA progress and notify you of any issues.

Good luck!

Total walkthrough time: 12 minutes (saved you ~2 hours of research + template filling)
```

---

## Question-Answering Pipeline: 4-Step Process

### Step 1: Question Understanding (Intent Classification + Entity Extraction)

**Purpose**: Parse user question to understand what they're asking and what entities are involved

**Sub-Tasks**:

#### 1A. Intent Classification
Classify question into one of 12 intent categories:

| Intent Category | Example Question | Expected Answer Type |
|----------------|------------------|---------------------|
| Policy Lookup | "What is the approval threshold for BBB+ counterparties?" | Policy rule with citation |
| Process Explanation | "How does the NPA approval workflow work?" | Step-by-step process |
| Precedent Search | "Has this been approved before?" | List of similar NPAs |
| Timeline Estimation | "How long will this take?" | Time estimate with factors |
| Calculation | "Do I need CEO approval for $75M notional?" | Yes/No with calculation |
| Troubleshooting | "Why was my NPA rejected?" | Root cause analysis |
| Comparison | "What's the difference between NPA Lite and Full NPA?" | Side-by-side comparison |
| Recommendation | "Should I submit this now or wait?" | Recommendation with reasoning |
| Definition | "What is a cross-border NPA?" | Clear definition + examples |
| Guidance | "How do I fill Field 23?" | Step-by-step instructions |
| Status Check | "Where is my NPA TSG2201?" | Current status + next steps |
| Proactive Warning | "Any issues with my current NPA?" | Risk assessment + warnings |

**Classification Model**: Fine-tuned BERT classifier trained on 2,500 labeled NPA questions

#### 1B. Entity Extraction
Extract key entities from question to enable knowledge retrieval:

**Entity Types**:
- **Counterparty Rating**: BBB+, A-, AAA, etc.
- **Notional Amount**: $50M, $100M, etc.
- **Product Type**: FX Forward, IRS, CDS, etc.
- **Geography**: Singapore, Hong Kong, cross-border, etc.
- **Desk**: FX Desk, Rates Desk, etc.
- **Approver Role**: CEO, Regional Risk Head, Legal, etc.
- **NPA ID**: TSG2201, TSG1998, etc.
- **Time Period**: Q4, last 6 months, 2023, etc.
- **Risk Metric**: MTM limit, collateral, tenor, etc.

**Entity Extraction Example**:
```
Question: "What's the approval timeline for a $75M FX Forward with BBB- Singapore counterparty?"

Extracted Entities:
- Notional: $75M
- Product: FX Forward
- Rating: BBB-
- Geography: Singapore (counterparty domicile)
- Intent: Timeline Estimation
```

#### 1C. Context Integration
Merge extracted entities with current session context:

**Context Sources**:
1. **Current NPA Data**: Fields already filled in active NPA form
2. **User Profile**: Desk, role, region, historical submission patterns
3. **Previous Questions**: Last 5 questions in conversation (for multi-turn)
4. **Time Context**: Current date, quarter, year-end proximity

**Context Integration Example**:
```
Question: "Do I need CEO approval?"

Without Context:
- Cannot answer (missing notional, rating, product type)

With Context:
- Current NPA notional: $85M (from Field 8)
- Current NPA rating: A- (from Field 2)
- Current NPA geography: Cross-border (from Field 3 + user profile)
- User profile: Hong Kong FX Desk

Integrated Query:
"Do I need CEO approval for $85M A- cross-border FX NPA?"

Answer: No, CEO approval threshold is $100M. You need Regional Risk + Group Risk approval.
```

---

### Step 2: Knowledge Retrieval (Multi-Source Search)

**Purpose**: Retrieve relevant information from multiple knowledge sources

**Knowledge Sources** (5 sources):

#### Source 1: KB Search Agent (Historical NPA Precedents)
**API Call**:
```json
{
  "agent": "KB_Search_Agent",
  "mode": "semantic_search",
  "query": "BBB- Singapore FX Forward $75M approval timeline",
  "filters": {
    "product_type": "FX Forward",
    "rating_range": ["BBB-", "BBB", "BBB+"],
    "notional_range": ["$50M", "$100M"],
    "geography": "Singapore"
  },
  "top_k": 5
}
```

**Response**:
```json
{
  "results": [
    {
      "npa_id": "TSG2156",
      "similarity_score": 0.94,
      "product": "FX Forward",
      "notional": "$75M",
      "rating": "BBB-",
      "geography": "Singapore",
      "timeline": "12 days",
      "outcome": "APPROVED"
    }
  ]
}
```

#### Source 2: ML Prediction Agent (Timeline & Approval Predictions)
**API Call**:
```json
{
  "agent": "ML_Prediction_Agent",
  "features": {
    "notional": 75000000,
    "rating": "BBB-",
    "product_type": "FX Forward",
    "cross_border": true,
    "tenor_days": 180,
    "quarter": "Q4"
  }
}
```

**Response**:
```json
{
  "approval_probability": 0.73,
  "predicted_timeline_days": 13.2,
  "bottleneck_predictions": [
    {"stage": "Legal", "predicted_days": 4.5, "risk": "high"},
    {"stage": "Credit", "predicted_days": 5.2, "risk": "medium"}
  ],
  "shap_explanations": {
    "rating_BBB-": -0.12,
    "cross_border": -0.08,
    "Q4_timing": -0.05,
    "notional_75M": +0.03
  }
}
```

#### Source 3: Policy Database (NPA Policy Manual)
**API Call**:
```json
{
  "source": "Policy_Database",
  "query": "cross-border approval thresholds BBB- rating",
  "sections": ["4.2.3", "5.1.2", "3.1.5"]
}
```

**Response**:
```json
{
  "rules": [
    {
      "section": "4.2.3",
      "rule": "Cross-border NPAs require Regional Risk Head approval at $20M+ threshold (vs $50M domestic)",
      "citation": "NPA Policy Manual Section 4.2.3 (Cross-Border Provisions)"
    },
    {
      "section": "3.1.5",
      "rule": "Sub-investment grade counterparties (BBB+ and below) require mandatory credit approval before NPA submission",
      "citation": "NPA Policy Manual Section 3.1.5 (Credit Prerequisites)"
    }
  ]
}
```

#### Source 4: Template Auto-Fill Agent (Field-Specific Guidance)
**API Call** (for field-filling questions):
```json
{
  "agent": "Template_AutoFill_Agent",
  "field_id": 23,
  "context": {
    "product": "FX Forward",
    "settlement": "Physical delivery"
  }
}
```

**Response**:
```json
{
  "field_name": "Settlement Instructions",
  "guidance": "For physical delivery FX Forwards, include: (1) Bank account details for each currency, (2) SWIFT codes, (3) Cut-off times, (4) Settlement currency pair, (5) Value date calculation method",
  "example": "Settlement: USD -> SGD. USD account: HSBC New York, SWIFT: MRMDUS33, Account: 123456789. SGD account: MBS Singapore, SWIFT: MBSSSGSG, Account: 987654321. Value date: T+2 business days from trade date. Cut-off: 10:00 AM SGT.",
  "precedent_source": "TSG2201"
}
```

#### Source 5: Real-Time Status Database (Current NPA Status)
**API Call** (for status questions):
```json
{
  "source": "NPA_Database",
  "npa_id": "TSG2201",
  "query_type": "status"
}
```

**Response**:
```json
{
  "npa_id": "TSG2201",
  "status": "PENDING_LEGAL_REVIEW",
  "submitted_date": "2023-11-15",
  "current_stage": "Legal Review",
  "days_elapsed": 8,
  "approvals_completed": [
    {"approver": "Desk Head", "date": "2023-11-15", "days": 0.3},
    {"approver": "Regional Risk", "date": "2023-11-17", "days": 2},
    {"approver": "Group Risk", "date": "2023-11-20", "days": 3}
  ],
  "approvals_pending": [
    {"approver": "Legal", "estimated_days": "2-3"},
    {"approver": "Final Approval", "estimated_days": "0.5"}
  ]
}
```

---

### Step 3: Answer Synthesis (Combining Multiple Sources)

**Purpose**: Combine information from multiple sources into a coherent, accurate answer

**Synthesis Rules**:

#### Rule 1: Source Priority Hierarchy
When sources conflict, prioritize in this order:
1. **Policy Database** (authoritative rules)
2. **Real-Time Status Database** (current facts)
3. **ML Prediction Agent** (statistical predictions)
4. **KB Search Agent** (historical precedents)
5. **Template Auto-Fill Agent** (guidance)

**Example Conflict Resolution**:
```
Question: "What's the approval timeline for $75M BBB- cross-border FX NPA?"

Source Conflict:
- Policy Database: "No explicit timeline in policy manual"
- ML Prediction Agent: "Predicted 13.2 days"
- KB Search Agent: "Historical average 12 days (based on 4 precedents)"

Resolution:
Use ML Prediction (13.2 days) as primary estimate, cite KB Search (12 days average) as supporting evidence, note Policy Database has no explicit timeline rule.

Synthesized Answer:
"Estimated timeline: 13-14 business days

This is based on:
- ML Prediction: 13.2 days (78% confidence)
- Historical precedents: 12-day average (4 similar NPAs)
- Policy manual: No explicit timeline requirement

Timeline breakdown:
- Credit approval: 5 days (mandatory for BBB-)
- Risk reviews: 4 days (Regional + Group Risk)
- Legal review: 3-4 days (cross-border complexity)
- Final approval: 1 day"
```

#### Rule 2: Confidence Scoring
Assign confidence score to each answer based on:
- **Source agreement**: Do multiple sources say the same thing? (+20% confidence)
- **Recency**: Is information up-to-date? (2023 data = +10%, 2021 data = -10%)
- **Sample size**: How many precedents support this? (10+ = +15%, 1-3 = -10%)
- **Policy clarity**: Is there an explicit policy rule? (+25% confidence)

**Confidence Thresholds**:
- **90-100%**: High confidence (cite as definitive answer)
- **70-89%**: Medium confidence (cite with caveats)
- **50-69%**: Low confidence (present as estimate, recommend user verify)
- **<50%**: Insufficient confidence (decline to answer, escalate to human expert)

---

### Step 4: Response Delivery (Formatting + Proactive Additions)

**Purpose**: Format answer for readability and add proactive suggestions

**Formatting Rules**:

#### Format 1: Use Visual Hierarchy
- **Headers**: Bold for section titles
- **Bullets**: For lists of items
- **Tables**: For comparisons or structured data

#### Format 2: Answer Structure Template
```
[Direct Answer - 1-2 sentences]

[Supporting Details - 3-5 bullet points]

[Context/Why - 2-3 sentences]

[Examples - 1-2 real precedents]

[Proactive Additions - warnings, next steps, related questions]

[Citation - source references]
```

---

## Integration with Other Agents

The Conversational Diligence Agent orchestrates calls to 4 other agents:

### Integration 1: KB Search Agent (Precedent Retrieval)

**When to Call**: User asks about precedents, historical data, "Has this been approved before?"

**API Call**:
```json
{
  "agent": "KB_Search_Agent",
  "mode": "semantic_search",
  "query": "BBB- Singapore FX Forward $75M",
  "top_k": 5
}
```

---

### Integration 2: ML Prediction Agent (Timeline & Approval Predictions)

**When to Call**: User asks about timelines, approval probability, bottlenecks

**API Call**:
```json
{
  "agent": "ML_Prediction_Agent",
  "features": {
    "notional": 75000000,
    "rating": "BBB-",
    "product_type": "FX Forward",
    "cross_border": true,
    "tenor_days": 180,
    "quarter": "Q4"
  }
}
```

---

### Integration 3: Template Auto-Fill Agent (Field Guidance)

**When to Call**: User asks "How do I fill Field X?", "What should I enter for...?"

**API Call**:
```json
{
  "agent": "Template_AutoFill_Agent",
  "field_id": 23,
  "context": {
    "product": "FX Forward",
    "settlement": "Physical delivery"
  }
}
```

---

### Integration 4: Classification Agent (Track & Type Determination)

**When to Call**: User asks "Am I eligible for NPA Lite?", "What track should I use?"

**API Call**:
```json
{
  "agent": "Classification_Agent",
  "features": {
    "product_novelty": "variation",
    "notional": 35000000,
    "rating": "A-",
    "cross_border": true,
    "complexity": "medium"
  }
}
```

---

## Performance Targets & Metrics

### Target 1: Response Time
- **Goal**: <2.5 seconds from question submission to answer delivery
- **Current**: 1.8 seconds average (28% under target)
- **Breakdown**:
  - Question understanding: 0.3 seconds (BERT inference)
  - Knowledge retrieval: 1.2 seconds (parallel agent calls)
  - Answer synthesis: 0.2 seconds
  - Response delivery: 0.1 seconds

### Target 2: Factual Accuracy
- **Goal**: >95% factual accuracy (verified against source documents)
- **Current**: 97.2% accuracy (2.8% above target)
- **Validation Method**:
  - Random sampling: 200 Q&A pairs per month
  - Human expert review: 3 senior NPA specialists
  - Cross-reference with source documents
  - Error categorization: Factual error vs interpretation difference

### Target 3: Answer Success Rate
- **Goal**: >85% of questions answered without escalation to human
- **Current**: 89% success rate (4% above target)
- **Escalation triggers**:
  - Confidence score <50%
  - Contradictory sources (unresolvable conflict)
  - Out-of-scope question
  - User explicitly requests human review

### Target 4: User Satisfaction
- **Goal**: >4.0/5.0 average rating (post-answer survey)
- **Current**: 4.3/5.0 average (0.3 above target)

### Target 5: Multi-Turn Conversation Success
- **Goal**: >80% of multi-turn conversations (3+ turns) successfully completed
- **Current**: 82% success rate

---

## Edge Cases & Error Handling

### Edge Case 1: Ambiguous Questions

**Example**: "How long will it take?"

**Problem**: Missing context - what does "it" refer to?

**Handling**:
```
Agent (Conversational Diligence):
I want to give you an accurate timeline, but I need a bit more context.

Are you asking about:
A) How long will your current NPA approval take?
B) How long will a specific approval stage take?
C) How long will it take to fill the NPA template?
D) Something else?

Which one?
```

---

### Edge Case 2: Out-of-Scope Questions

**Example**: "What's the weather in Singapore today?"

**Problem**: Not related to NPA workflow

**Handling**:
```
Agent (Conversational Diligence):
I'm specialized in answering questions about NPA policies, processes, precedents, and approvals.

Your question about weather is outside my expertise.

Here's what I CAN help with:
- NPA approval timelines, thresholds, requirements
- Policy questions
- Precedent searches
- Template guidance
- Troubleshooting

Do you have any NPA-related questions I can help with?
```

---

### Edge Case 3: Contradictory Sources

**Example**: Policy manual says one thing, recent precedent shows another

**Handling**:
```
Agent (Conversational Diligence):
I found conflicting information about cross-border approval thresholds:

Official Policy: $20M threshold for Regional Risk Head approval
Source: NPA Policy Manual Section 4.2.3 (last updated: Jan 2023)

Recent Precedent: TSG2301 approved with $18M notional (below threshold)
Source: NPA Database (submitted Nov 20, 2023)

Recommendation:
- Follow official policy ($20M threshold) to be safe
- I've flagged this discrepancy for Policy team review

Want me to escalate this to a human expert for clarification?
```

---

## Continuous Learning & Improvement

### Learning Signal 1: User Feedback Ratings
**Collection**: Post-answer survey (1-5 stars)
**Usage**:
- Low ratings (1-2 stars) -> Flag for human review
- Identify common failure patterns
- A/B test answer formats (short vs detailed)

### Learning Signal 2: Escalation Patterns
**Collection**: Track which questions get escalated to humans
**Usage**:
- High escalation rate for specific question types -> Add training data
- Example: "Bundling NPAs" had 40% escalation rate -> Created 15 new Q&A training pairs

### Learning Signal 3: Multi-Turn Abandonment
**Collection**: Track when users abandon conversation mid-way
**Usage**:
- Abandonment after turn 3 -> Agent likely not understanding context
- Retrain context retention model on these failure cases

### Learning Signal 4: New Precedent Data
**Collection**: Every new NPA approved/rejected is added to database
**Usage**:
- Retrain ML Prediction Agent monthly with new data
- Update KB Search Agent index weekly
- Identify emerging patterns

---

## Database Interactions

### Query 1: Real-Time NPA Status
**Purpose**: Answer "Where is my NPA?" questions

**SQL Query** (via MCP Server):
```sql
SELECT
  npa_id,
  status,
  current_stage,
  submitted_date,
  DATEDIFF(day, submitted_date, GETDATE()) AS days_elapsed,
  approvals_completed,
  approvals_pending
FROM npa_status
WHERE npa_id = 'TSG2301'
```

---

### Query 2: Historical Precedent Lookup
**Purpose**: Search for similar NPAs (called via KB Search Agent)

**Vector Search Query** (Supabase pgvector):
```sql
SELECT
  npa_id,
  product_type,
  notional,
  rating,
  geography,
  timeline_days,
  outcome,
  1 - (embedding <=> query_embedding) AS similarity_score
FROM npa_embeddings
WHERE 1 - (embedding <=> query_embedding) > 0.7
ORDER BY similarity_score DESC
LIMIT 5
```

---

### Query 3: Policy Rule Lookup
**Purpose**: Retrieve specific policy rules

**SQL Query**:
```sql
SELECT
  section_id,
  section_title,
  rule_text,
  last_updated
FROM policy_manual
WHERE section_id = '4.2.3'
  OR keywords @> ARRAY['cross-border', 'approval', 'threshold']
```

---

### Query 4: Approval Timeline Statistics
**Purpose**: Calculate average timelines for specific profiles

**SQL Query**:
```sql
SELECT
  AVG(timeline_days) AS avg_timeline,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY timeline_days) AS median_timeline,
  COUNT(*) AS sample_size
FROM npa_historical
WHERE rating = 'BBB-'
  AND notional BETWEEN 50000000 AND 100000000
  AND product_type = 'FX Forward'
  AND outcome = 'APPROVED'
  AND submitted_date >= '2023-01-01'
```

---

## Why This Agent Is Critical

The Conversational Diligence Sub-Agent is the **human-AI interface** that makes the entire NPA system accessible and usable.

### Without This Agent:
- Users spend 2-3 hours searching policy manuals for answers
- Traders call Legal/Risk teams repeatedly (slows down both sides)
- NPAs are submitted with errors, causing rejections and rework
- Institutional knowledge (precedents) is siloed in individual people's heads
- New users face steep learning curve (weeks to become proficient)

### With This Agent:
- Instant answers to policy questions (<2.5 seconds)
- Proactive warnings prevent costly mistakes before submission
- Precedent search democratizes institutional knowledge (everyone has access)
- Contextual guidance reduces NPA errors by 40%
- New users become productive in days (not weeks)

### Key Business Impact:
1. **Time Savings**: 2-3 hours per NPA reduced to 10-15 minutes (85% reduction)
2. **Error Reduction**: 40% fewer NPA rejections due to incomplete/incorrect submissions
3. **Faster Approvals**: Pre-engagement emails (drafted by agent) save 2-3 days per NPA
4. **Knowledge Democratization**: Junior traders now have same knowledge access as 10-year veterans
5. **Reduced Expert Load**: Legal/Risk teams spend 50% less time answering repetitive questions

**Bottom Line**: This agent transforms NPA workflow from "expert-dependent manual process" to "self-service guided workflow accessible to everyone."

---

## END OF KB_CONVERSATIONAL_DILIGENCE
