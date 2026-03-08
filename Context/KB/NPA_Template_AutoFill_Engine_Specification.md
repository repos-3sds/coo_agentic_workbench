# Template Auto-Fill Engine
## The Time Machine That Learns from History

**Agent Type:** Task Agent (Critical Path)  
**Stage:** Phase 0 - Product Ideation  
**Purpose:** Auto-populate 78% of NPA template fields by intelligently copying and adapting content from similar approved NPAs  
**Analogy:** This agent is like an experienced Maker who remembers every NPA ever submitted and can instantly pull the best sections from past approvals to jumpstart a new submission

---

## The Challenge This Agent Solves

Filling out an NPA template manually is **painful**. The form has 47 fields across multiple sections:
- Product specifications (name, type, structure, mechanics)
- Operational information (booking system, settlement, valuation model)
- Technology requirements (system compatibility, new builds, UAT)
- Risk assessments (market risk, credit risk, operational risk, liquidity risk)
- Regulatory requirements (MAS 656, MAS 643, CFTC, local rules)
- Legal considerations (documentation, jurisdiction, enforceability)
- Pricing methodologies (valuation approach, market data sources)
- Sign-off matrices (who needs to approve, in what order)

**Current Reality:**
- A Maker sits down with a blank form
- Spends 60-90 minutes researching and writing from scratch
- Copies text from old NPAs manually (if they can find them)
- Makes mistakes because they don't know which past NPA is most relevant
- Produces inconsistent quality (some sections detailed, others vague)

**The Template Auto-Fill Engine solves this by:**
1. Finding the most similar approved NPA in seconds (from 1,784+ historical cases)
2. Copying content that can be reused verbatim (booking system, sign-off matrix)
3. Adapting content that needs customization (risk assessments, notional amounts)
4. Flagging fields that genuinely require manual input (counterparty name, trade date)
5. Reducing manual work from 60-90 minutes to 15-20 minutes (78% time savings)

---

## How the Agent Works: The Four-Step Process

### Step 1: Find the Best Historical Match

The agent receives inputs from the Product Ideation Agent and KB Search Sub-Agent:
- User's product description (natural language)
- Product classification (NTG/Variation/Existing)
- Approval track (Full NPA/NPA Lite/Bundling/Evergreen)
- Top 5 similar NPAs from RAG search (with similarity scores)

**Selection Logic:**

The agent picks the "best match" based on multiple criteria:

**Primary Criterion: Semantic Similarity**
- The NPA with the highest similarity score (typically 85-95% for "Existing" products)
- Example: User describes "FX Forward on GBP/USD, 3-month tenor, $20M notional"
  - RAG returns TSG1917 (FX Forward on EUR/USD, 3-month tenor, $25M notional) - 94% match
  - This becomes the template source

**Secondary Criterion: Approval Outcome**
- Prioritize NPAs that were **approved** (not rejected)
- Rejected NPAs might have flawed content that led to rejection
- Example: Two similar NPAs found:
  - TSG1917 (FX Forward) - Approved in 3 days - 92% match
  - TSG2044 (FX Forward) - Rejected due to incomplete risk assessment - 91% match
  - Agent picks TSG1917 even though similarity is only 1% higher

**Tertiary Criterion: Recency**
- Prefer more recent NPAs (approved within last 2 years)
- Older NPAs may have outdated regulatory language or deprecated systems
- Example: Two approved NPAs found:
  - TSG1917 (FX Forward) - Approved Dec 2024 - 92% match
  - TSG0845 (FX Forward) - Approved Jan 2021 - 93% match
  - Agent picks TSG1917 (more recent) even though similarity is 1% lower

**Edge Case Handling:**

What if no good match is found?

**Scenario 1: New-to-Group Product (No Match Expected)**
- Agent knows classification is NTG (from Classification Router)
- Agent uses **generic template** for product type (e.g., "Derivative Product Generic Template")
- Auto-fill coverage drops from 78% to ~45% (only structural fields filled)
- More manual input required, which is appropriate for NTG

**Scenario 2: Multiple Equally Good Matches**
- Example: Three FX Forward NPAs all with 90% similarity
- Agent picks the one with **shortest approval timeline** (best performer)
- Reasoning: Faster approval suggests clearer documentation and fewer issues

**Scenario 3: Best Match Has Red Flags**
- RAG returns TSG2134 (92% match) but it has 2 loop-backs (rework required)
- Agent checks next-best match TSG1917 (89% match) with 0 loop-backs
- Agent picks TSG1917 to avoid copying potentially problematic content

---

### Step 2: Categorize Fields (Copy vs Adapt vs Manual)

Not all 47 fields can be treated the same way. The agent categorizes each field into one of three buckets:

#### Bucket 1: Direct Copy (28 fields - 60% coverage)

These fields are **identical** across similar products and can be copied verbatim without any changes.

**Examples:**

**Booking System** (Section II)
- If source NPA says "Murex" and user's product is same type → Copy "Murex"
- Booking systems don't change between similar products on same desk

**Valuation Model** (Section II)
- If source NPA says "Black-Scholes for vanilla options" → Copy verbatim
- FX Options all use same valuation model

**Settlement Method** (Section II)
- If source NPA says "T+2 physical delivery via CLS" → Copy verbatim
- Settlement conventions are product-specific, not deal-specific

**Regulatory Requirements** (Section V)
- If source NPA says "Subject to MAS 656, CFTC Part 20" → Copy verbatim
- Regulations apply to product types, not individual deals

**Sign-Off Parties** (Section VI)
- If source NPA says "Credit, Finance, Legal, MLR, Ops, Tech" → Use as baseline
- May need adjustment for cross-border override, but starting point is same

**Pricing Methodology** (Section III)
- If source NPA says "Mid-market pricing using Reuters curves, adjusted for bid-offer spread" → Copy verbatim
- Pricing approach is product-specific

**Market Data Sources** (Section III)
- If source NPA says "Bloomberg BFIX for FX rates, Reuters for interest rates" → Copy verbatim
- Data sources standardized per product type

**Why Direct Copy Works:**

These fields describe **product characteristics** (how the product works) rather than **deal characteristics** (this specific trade). Product characteristics are reusable.

Think of it like building a house: If you built 100 houses using the same blueprint, the "foundation type" and "roofing material" would be identical across all houses. Only the "house number" and "owner name" would differ.

---

#### Bucket 2: Intelligent Adaptation (9 fields - 19% coverage)

These fields contain content from the source NPA that needs **customization** based on the new product's specifics.

**Examples:**

**Market Risk Assessment** (Section IV.A)

Source NPA (TSG1917, $25M notional):
> "The market risk for this FX Forward is moderate. The $25M notional exposure represents approximately 2.3% of the desk's total FX book ($1.1B). Daily VaR (Value at Risk) is estimated at $180K (99% confidence, 1-day holding period). The GBP/USD currency pair has moderate volatility (historical 30-day vol: 8.5%), and the 3-month tenor limits duration risk."

New Product ($50M notional):
> "The market risk for this FX Forward is **moderate-to-high**. The **$50M** notional exposure represents approximately **4.5%** of the desk's total FX book ($1.1B). Daily VaR is estimated at **$360K** (99% confidence, 1-day holding period). The GBP/USD currency pair has moderate volatility (historical 30-day vol: 8.5%), and the 3-month tenor limits duration risk."

**What Changed:**
- Notional: $25M → $50M (user input)
- Risk rating: "moderate" → "moderate-to-high" (algorithmic adjustment based on 2x notional)
- Book percentage: 2.3% → 4.5% (recalculated: $50M / $1.1B)
- VaR: $180K → $360K (linear scaling based on notional increase)
- Everything else: Copied verbatim (volatility, tenor, methodology)

**How Adaptation Works:**

The agent uses **intelligent text rewriting**:
1. Extract numerical values from source text ($25M, 2.3%, $180K)
2. Identify which numbers are deal-specific (notional) vs product-specific (volatility)
3. Replace deal-specific numbers with new values (from user input or calculation)
4. Recalculate derived metrics (VaR scales with notional)
5. Adjust qualitative ratings if thresholds crossed (moderate → moderate-to-high at 4% book threshold)

**Credit Risk Assessment** (Section IV.B)

Source NPA (BBB+ counterparty):
> "Counterparty is rated BBB+ by S&P, representing investment-grade credit quality. Expected loss is estimated at 15 basis points annually. We require daily collateral exchange per ISDA CSA (Credit Support Annex) to mitigate counterparty exposure."

New Product (A- counterparty):
> "Counterparty is rated **A-** by S&P, representing **strong** investment-grade credit quality. Expected loss is estimated at **8 basis points** annually. We require **weekly** collateral exchange per ISDA CSA to mitigate counterparty exposure."

**What Changed:**
- Rating: BBB+ → A- (user input)
- Credit quality descriptor: "investment-grade" → "strong investment-grade" (lookup table)
- Expected loss: 15 bps → 8 bps (lookup table based on rating)
- Collateral frequency: daily → weekly (policy table: A- allows weekly, BBB+ requires daily)

**Operational Risk Assessment** (Section IV.C)

Source NPA (Singapore desk only):
> "Operational risk is low. The product will be booked in Murex (existing system), settled via standard T+2 CLS process, and confirmed via SWIFT MT300. No manual interventions required. Operations team has processed 500+ similar FX Forwards in the past 12 months with zero settlement failures."

New Product (Singapore + Hong Kong, cross-border):
> "Operational risk is **moderate**. The product will be booked in Murex (existing system), settled via standard T+2 CLS process, and confirmed via SWIFT MT300. **Cross-border booking between Singapore and Hong Kong entities requires manual reconciliation at month-end per inter-company transfer pricing policy.** Operations team has processed 500+ similar FX Forwards in the past 12 months with zero settlement failures **for single-entity bookings**."

**What Changed:**
- Risk rating: low → moderate (cross-border flag detected by Product Ideation Agent)
- New paragraph inserted: Cross-border manual reconciliation requirement (templated text from cross-border rule library)
- Clarification added: "for single-entity bookings" (accuracy caveat)

**Why Intelligent Adaptation Works:**

The agent combines:
1. **Template-based text generation** (fill-in-the-blanks for structured paragraphs)
2. **Entity replacement** (swap specific values: $25M → $50M, BBB+ → A-)
3. **Rule-based adjustments** (if notional >$20M, add ROAE sensitivity requirement)
4. **Lookup tables** (rating → expected loss mapping, rating → collateral frequency)

This is NOT just find-and-replace. The agent understands the **semantic relationships** between fields (notional affects VaR, rating affects expected loss) and maintains **logical consistency** (if risk goes up, risk rating should reflect that).

---

#### Bucket 3: Manual Input Required (10 fields - 21% unfilled)

These fields are **deal-specific** and cannot be auto-filled because the information doesn't exist until the user provides it.

**Examples:**

**Specific Counterparty Name**
- Cannot be copied from historical NPA
- TSG1917 might have traded with "ABC Corporation"
- User's new deal might be with "XYZ Bank"
- Requires manual input

**Exact Trade Date**
- Historical NPA has old dates (e.g., "Trade Date: 15-Jan-2024")
- User's new deal hasn't been executed yet
- Requires manual input (or defaults to "TBD - subject to market conditions")

**Unique Product Features**
- If user mentioned special customizations during Product Ideation interview
- Example: "Customer requested knock-in barrier at 1.25 instead of standard 1.30"
- Cannot be auto-filled (no similar feature in historical NPAs)
- Requires manual input

**Custom Risk Mitigants**
- If user has non-standard risk controls
- Example: "Customer will provide cash collateral upfront due to weak credit rating"
- Cannot be auto-filled (deal-specific mitigation)
- Requires manual input

**Special Legal Provisions**
- If deal has unusual legal terms
- Example: "Governed by Hong Kong law instead of Singapore law due to customer request"
- Cannot be auto-filled
- Requires manual input

**Desk-Specific Operational Procedures**
- If desk has unique workflows not captured in standard NPA
- Example: "Tokyo desk requires additional FX hedging approval from Treasury before booking"
- Cannot be auto-filled
- Requires manual input

**Bespoke Pricing Adjustments**
- If pricing deviates from standard methodology
- Example: "Customer negotiated 2-pip discount on mid-market rate due to relationship"
- Cannot be auto-filled
- Requires manual input

**Why Manual Input Is Necessary:**

These fields contain **information that doesn't exist in historical data**. The agent can't invent counterparty names or trade dates. This is appropriate—we WANT the user to provide these details because they're deal-specific and critical.

**The 78% Coverage Target:**

- 28 fields direct copy = 60%
- 9 fields intelligent adaptation = 19%
- **Total auto-filled: 79%** (rounded to 78% in marketing materials)
- 10 fields manual input = 21%

This breakdown is optimized for **user efficiency** (minimize manual work) balanced with **accuracy** (don't auto-fill fields we can't know).

---

### Step 3: Quality Assurance Checks

Before presenting the auto-filled template to the user, the agent runs validation checks to ensure content quality.

#### Check 1: Internal Consistency

**What:** Verify that auto-filled fields don't contradict each other

**Example Problem:**
- Auto-filled risk rating: "Low"
- Auto-filled VaR: $500K (very high)
- **Contradiction detected:** Low risk shouldn't have $500K VaR

**Agent Action:**
- Detect inconsistency using rule engine
- Flag field for manual review
- Suggest correction: "Based on $500K VaR, risk rating should be High, not Low. Please review Section IV.A."

---

#### Check 2: Regulatory Compliance

**What:** Verify that auto-filled regulatory requirements are current

**Example Problem:**
- Source NPA from 2021 references "LIBOR as reference rate"
- LIBOR was discontinued in 2023
- **Outdated reference detected**

**Agent Action:**
- Check regulatory reference library (updated quarterly)
- Replace "LIBOR" with "SOFR (Secured Overnight Financing Rate)" automatically
- Flag change to user: "Updated reference rate from LIBOR to SOFR per regulatory transition"

---

#### Check 3: Completeness

**What:** Verify that all mandatory fields have values (auto-filled or manual)

**Example Problem:**
- Section IV.D (Liquidity Risk Assessment) is blank
- This is a mandatory field for all NPAs

**Agent Action:**
- Detect missing mandatory field
- Attempt to fill with generic template: "Liquidity risk is [low/moderate/high] based on..."
- If generic template unavailable, flag to user: "⚠️ Section IV.D requires your input"

---

#### Check 4: Cross-Border Override Check

**What:** If cross-border booking detected, verify mandatory sign-offs added

**Example Problem:**
- User confirmed cross-border booking in Product Ideation interview
- Auto-filled sign-off parties: "Credit, Finance, Legal" (missing MLR, Ops, Tech)

**Agent Action:**
- Detect cross-border flag (from Product Ideation Agent)
- Override auto-filled sign-off list
- Add mandatory parties: MLR, Operations, Technology
- Display alert: "⚠️ Cross-border booking requires Finance, Credit, MLR, Tech, Ops (5 mandatory sign-offs added)"

---

#### Check 5: Notional Threshold Rules

**What:** If notional exceeds certain thresholds, trigger additional requirements

**Example Rules:**
- Notional >$20M → Requires ROAE (Return on Average Equity) sensitivity analysis in Section III
- Notional >$50M → Requires Finance VP approval (add to sign-off matrix)
- Notional >$100M → Requires GFM COO pre-approval before NPA submission

**Example Problem:**
- User's notional is $75M
- Source NPA had $15M (below thresholds)
- Auto-filled template missing ROAE section

**Agent Action:**
- Detect notional threshold breach
- Auto-add ROAE section template: "Sensitivity Analysis: 10 bps rate move → $XXX P&L impact"
- Flag to user: "⚠️ Notional >$20M requires ROAE sensitivity analysis in Section III (template added, please populate scenarios)"
- Auto-add Finance VP to sign-off matrix
- Display alert: "⚠️ Notional >$50M requires Finance VP approval (added to sign-off parties)"

---

### Step 4: Present to User with Guided Next Steps

After auto-filling and validation, the agent presents the template to the user with clear guidance on what to do next.

#### The User Interface Display

**Visual Highlighting:**

The template uses color-coding to guide the user:

- **Green fields:** Auto-filled, ready to review (no action required unless user wants to edit)
- **Yellow fields:** Auto-filled but flagged for verification (e.g., adapted text that user should confirm)
- **Red fields:** Manual input required (cannot auto-fill)

**Section-by-Section Breakdown:**

**Section I: Product Specifications (90% auto-filled)**
- Product Name: ✅ Auto-filled from user input
- Product Type: ✅ Auto-filled from classification
- Desk: ✅ Auto-filled from user input
- Location: ✅ Auto-filled from user input
- Business Unit: ✅ Auto-filled from source NPA
- Underlying Asset: ✅ Auto-filled from user input (GBP/USD)
- Notional Amount: ✅ Auto-filled from user input ($50M)
- Tenor: ✅ Auto-filled from user input (3 months)
- Counterparty Name: ⚠️ **MANUAL INPUT REQUIRED**
- Trade Date: ⚠️ **MANUAL INPUT REQUIRED**

**Section II: Operational & Technology (100% auto-filled)**
- Booking System: ✅ Murex (copied from TSG1917)
- Valuation Model: ✅ Black-Scholes (copied from TSG1917)
- Settlement Method: ✅ T+2 CLS (copied from TSG1917)
- Confirmation Process: ✅ SWIFT MT300 (copied from TSG1917)

**Section III: Pricing Model (75% auto-filled)**
- Pricing Methodology: ✅ Mid-market + bid-offer (copied from TSG1917)
- Market Data Sources: ✅ Bloomberg/Reuters (copied from TSG1917)
- ROAE Sensitivity: ⚠️ **FLAGGED** - Template added due to $50M notional, please populate scenarios
- Bespoke Pricing Adjustments: ⚠️ **MANUAL INPUT REQUIRED** (if any)

**Section IV: Risk Assessments (80% auto-filled)**
- Market Risk: ✅ Auto-adapted from TSG1917 (notional scaled $25M → $50M, VaR recalculated)
- Credit Risk: ⚠️ **FLAGGED** - Auto-adapted for A- rating, please confirm counterparty rating is correct
- Operational Risk: ✅ Auto-adapted with cross-border caveat
- Liquidity Risk: ✅ Copied from TSG1917
- Custom Risk Mitigants: ⚠️ **MANUAL INPUT REQUIRED** (if any)

**Section V: Regulatory Requirements (100% auto-filled)**
- Applicable Regulations: ✅ MAS 656, CFTC Part 20 (copied from TSG1917, validated as current)
- Reporting Obligations: ✅ DTCC SDR reporting (copied from TSG1917)

**Section VI: Sign-Off Matrix (100% auto-filled)**
- Sign-Off Parties: ✅ Finance, Credit, MLR, Tech, Ops (cross-border mandatory set)
- Approval Timeline: ✅ Estimated 4-6 days (predicted by ML agent)

**Section VII: Legal Considerations (50% auto-filled)**
- Governing Law: ✅ Singapore law (copied from TSG1917)
- Documentation: ✅ ISDA Master Agreement (copied from TSG1917)
- Special Legal Provisions: ⚠️ **MANUAL INPUT REQUIRED** (if any)

---

#### Guided Next Steps for User

The agent provides actionable guidance:

**Step 1: Review Auto-Filled Content (5 minutes)**
- Scan green fields—are they accurate for your product?
- Example: "Booking System: Murex" - Correct? If not, change to correct system.

**Step 2: Verify Flagged Content (5 minutes)**
- Check yellow fields—confirm adapted values are correct
- Example: "Credit Risk: A- rating, 8 bps expected loss" - Is counterparty actually A-? If yes, approve. If no, update.

**Step 3: Fill Manual Fields (10 minutes)**
- Complete red fields with deal-specific information
- Example: "Counterparty Name: [Enter name]" - Type in actual counterparty

**Step 4: Submit for Review (1 click)**
- Once satisfied, click "Submit for Checker Review"
- Handoff to Stage 1 (Ingestion & Triage)

**Total Time:** 15-20 minutes (vs 60-90 minutes manual)

---

## The Intelligent Text Adaptation Engine

The most sophisticated part of the Template Auto-Fill Engine is the **text adaptation algorithm**. This is what enables the agent to rewrite content intelligently rather than just copy-paste.

### Adaptation Technique 1: Entity Replacement

**Input:** Risk assessment paragraph from source NPA  
**Action:** Replace specific entities (amounts, ratings, dates) with new values  
**Output:** Updated paragraph with new entities

**Example:**

Source NPA text:
> "The transaction involves a $25M notional FX Forward with XYZ Corporation (rated BBB+), expiring on 30-Jun-2024."

Entity extraction:
- Notional: $25M
- Counterparty: XYZ Corporation
- Rating: BBB+
- Expiry: 30-Jun-2024

Entity replacement (from user input):
- Notional: $25M → $50M
- Counterparty: XYZ Corporation → ABC Bank
- Rating: BBB+ → A-
- Expiry: 30-Jun-2024 → 30-Sep-2025

Output text:
> "The transaction involves a $50M notional FX Forward with ABC Bank (rated A-), expiring on 30-Sep-2025."

**Technical Approach:**
- Named Entity Recognition (NER) to identify entities
- Replacement map: {old_entity: new_entity}
- Simple string substitution

---

### Adaptation Technique 2: Numerical Scaling

**Input:** Risk metrics that scale with notional  
**Action:** Recalculate derived metrics proportionally  
**Output:** Updated metrics maintaining mathematical relationships

**Example:**

Source NPA text:
> "Daily VaR is $180K (99% confidence) based on $25M notional. This represents 0.72% of notional."

Scaling logic:
- VaR scales linearly with notional (VaR ∝ Notional)
- Percentage relationship: VaR / Notional = 0.72% (constant)

New notional: $50M (2x increase)

Calculation:
- New VaR = $180K × 2 = $360K
- Verify percentage: $360K / $50M = 0.72% ✓ (consistent)

Output text:
> "Daily VaR is $360K (99% confidence) based on $50M notional. This represents 0.72% of notional."

**Technical Approach:**
- Parse mathematical relationships in source text
- Identify scaling factors (linear, square root, logarithmic)
- Apply scaling formula based on relationship type

---

### Adaptation Technique 3: Threshold-Triggered Text Insertion

**Input:** Rule library of threshold-based requirements  
**Action:** Insert new paragraphs when thresholds crossed  
**Output:** Enhanced text with additional requirements

**Example:**

Source NPA (notional $15M):
> "Market risk is low. No additional approvals required."

Threshold rules:
- IF notional >$20M THEN insert: "Finance requires ROAE sensitivity analysis per Appendix 3"
- IF notional >$50M THEN insert: "Finance VP approval required before sign-off"

New notional: $75M (crosses both thresholds)

Output text:
> "Market risk is moderate-to-high due to increased notional. **Finance requires ROAE sensitivity analysis per Appendix 3.** Daily VaR impact must be stress-tested across 5 scenarios (±50 bps, ±100 bps, ±200 bps rate moves). **Finance VP approval required before sign-off due to notional exceeding $50M threshold.**"

**Technical Approach:**
- Threshold table: {condition → text_to_insert}
- Evaluate conditions against new product parameters
- Insert templated text at appropriate location in paragraph

---

### Adaptation Technique 4: Qualitative Rating Adjustment

**Input:** Risk ratings from source NPA  
**Action:** Adjust ratings based on parameter changes  
**Output:** Updated risk ratings reflecting new risk level

**Example:**

Source NPA (notional $25M, desk book $1.1B):
> "Market risk is **moderate**. The $25M notional represents 2.3% of desk book."

Rating thresholds:
- <1% of desk book → Low risk
- 1-3% of desk book → Moderate risk
- 3-5% of desk book → Moderate-to-High risk
- >5% of desk book → High risk

New notional: $50M

Calculation:
- Book percentage: $50M / $1.1B = 4.5%
- Threshold match: 4.5% falls in "Moderate-to-High" range

Output text:
> "Market risk is **moderate-to-high**. The $50M notional represents 4.5% of desk book."

**Technical Approach:**
- Extract current rating from source text
- Calculate new risk metric
- Lookup new rating in threshold table
- Replace old rating with new rating

---

### Adaptation Technique 5: Conditional Content Expansion

**Input:** Cross-border flag, bundling flag, or other special conditions  
**Action:** Expand content with additional paragraphs for special cases  
**Output:** Comprehensive text covering special scenarios

**Example:**

Source NPA (single-entity booking):
> "Operational risk is low. Standard T+2 settlement applies."

New product (cross-border booking detected):

Output text:
> "Operational risk is **moderate** due to cross-border booking. Standard T+2 settlement applies **for the customer leg**. **Inter-company booking between Singapore and Hong Kong entities requires manual reconciliation at month-end per transfer pricing policy. Finance and Operations must coordinate to ensure P&L allocation is correct across legal entities. Tax implications of cross-border transactions must be reviewed by Group Tax before first trade.**"

**Technical Approach:**
- Detect special condition flags (cross-border, bundling, etc.)
- Retrieve templated expansion paragraphs from library
- Append paragraphs to base text
- Adjust risk rating if necessary

---

## Integration with Other Agents

The Template Auto-Fill Engine receives inputs from and sends outputs to multiple agents in the Phase 0 pipeline.

### Upstream Dependencies (Inputs)

**From Product Ideation Agent:**
- User's product description
- User's responses to interview questions
- Extracted parameters (notional, tenor, counterparty rating, etc.)

**From KB Search Sub-Agent (RAG):**
- Top 5 similar historical NPAs
- Similarity scores for each
- Full content of historical NPAs (for copying)

**From Classification Router Agent:**
- Product classification (NTG/Variation/Existing)
- Approval track (Full NPA/NPA Lite/Bundling/Evergreen)
- Confidence score

**From Prohibited List Checker Agent:**
- Cross-border flag (yes/no)
- Bundling flag (yes/no)
- Any special conditions detected

---

### Downstream Outputs (What Happens After Auto-Fill)

**To User Interface:**
- Auto-filled template (47 fields, 78% populated)
- Color-coded field highlighting (green/yellow/red)
- Field-by-field guidance ("Review this" vs "Fill this in")

**To Completeness Triage Sub-Agent (Stage 1):**
- List of fields still requiring manual input
- Expected completion percentage (e.g., 78% done, 22% remaining)

**To Validation Sub-Agent (Stage 1):**
- Auto-filled content for validation checks
- Flags for fields that need extra scrutiny (adapted text)

**To Status Report Sub-Agent:**
- Time saved metric (45 minutes)
- Auto-fill coverage percentage (78%)
- Source NPA used (TSG1917)

---

## Performance Targets

The Template Auto-Fill Engine must operate at enterprise-grade performance:

**Speed:**
- Processing time: <3 seconds for auto-fill (including text adaptation)
- User perception: "Instant" template population

**Coverage:**
- Auto-fill percentage: ≥78% (37 of 47 fields)
- Accuracy of auto-filled content: ≥92% (user accepts without changes)

**Quality:**
- Internal consistency: 100% (no contradictory auto-filled fields)
- Regulatory compliance: 100% (all regulatory references current)
- Completeness: All mandatory fields filled or flagged

**User Satisfaction:**
- Time savings: 60-90 min → 15-20 min (≥70% reduction)
- User rating: ≥4.3/5.0 for auto-fill quality
- Manual override rate: <15% (users change <15% of auto-filled content)

---

## Edge Cases and How the Agent Handles Them

### Edge Case 1: Source NPA Has Stale Regulatory References

**Scenario:** Source NPA from 2020 references "LIBOR" which was discontinued in 2023

**Agent Handling:**
- Detect outdated reference during regulatory compliance check
- Lookup replacement in regulatory reference library: "LIBOR" → "SOFR"
- Auto-replace in template
- Flag change to user: "Updated reference rate from LIBOR to SOFR per 2023 regulatory transition"

---

### Edge Case 2: User's Notional Far Exceeds Source NPA

**Scenario:** Source NPA is $10M, user's deal is $500M (50x larger)

**Agent Handling:**
- Linear scaling would produce unrealistic VaR ($200K × 50 = $10M VaR - too high)
- Detect extreme scaling factor (>10x)
- Apply **non-linear scaling** with diminishing returns (VaR ∝ √Notional for large deals)
- Flag to user: "⚠️ Notional significantly larger than source NPA. VaR estimate may be inaccurate. Please review Section IV.A and consult Risk team."

---

### Edge Case 3: Multiple Similar NPAs, Conflicting Content

**Scenario:** 
- TSG1917: "Settlement via CLS"
- TSG2044: "Settlement via bilateral SWIFT"
- Both are 90% similar to user's product

**Agent Handling:**
- Detect conflicting content on same field
- Use **majority voting**: Check 10 most similar NPAs, pick most common value
- Example: 7 out of 10 say "CLS" → Pick "CLS"
- Flag to user: "⚠️ Source NPAs had different settlement methods. Auto-filled with most common (CLS). Please verify."

---

### Edge Case 4: User Contradicts Auto-Filled Content During Manual Review

**Scenario:** 
- Agent auto-fills "Booking System: Murex"
- User changes to "Booking System: Summit"

**Agent Handling:**
- Detect manual override of auto-filled field
- Trigger **cascade validation**: Does changing booking system affect other fields?
- Example: "Valuation Model: Murex pricing engine" no longer valid if Summit is booking system
- Flag dependent fields: "⚠️ You changed booking system to Summit. Section II.B (Valuation Model) may need update."

---

### Edge Case 5: New-to-Group Product (No Similar NPA)

**Scenario:** User's product is Credit Default Swap, which MBS has never traded

**Agent Handling:**
- Classification Router identifies as NTG (no historical match)
- Agent uses **generic derivative product template** instead of specific NPA
- Auto-fill coverage drops: 78% → 45% (only structural fields, no product-specific content)
- Display message: "⚠️ This is New-to-Group. Auto-fill coverage is lower (45%) because we have no similar historical NPAs. More manual input required."
- Offer help: "Would you like me to search public regulatory filings for CDS examples?" (external knowledge)

---

## Continuous Improvement Through User Feedback

The Template Auto-Fill Engine learns and improves over time based on user behavior.

**Learning Signal 1: Manual Override Rate**
- If users frequently change a specific auto-filled field → Low-quality auto-fill
- Example: 80% of users override "Pricing Methodology" even though auto-filled
- Root cause analysis: Source NPAs have outdated pricing approach
- Action: Update auto-fill logic to prefer most recent NPAs (recency bias increased)

**Learning Signal 2: Checker Rejection Reasons**
- If Checker frequently rejects NPAs due to specific section → Auto-fill issue
- Example: 40% of rejections cite "Insufficient operational risk detail in Section IV.C"
- Root cause analysis: Adaptation algorithm too aggressive (removed important caveats)
- Action: Reduce text compression, preserve more content from source NPA

**Learning Signal 3: User Satisfaction Ratings**
- After template submission, user rates auto-fill quality (1-5 stars)
- Low ratings trigger review: "Why 2 stars?"
- User feedback: "Auto-filled counterparty rating was wrong"
- Root cause analysis: Entity replacement picked wrong entity (ambiguous reference)
- Action: Improve NER model to handle ambiguous entities better

**Retraining Cadence:**
- **Monthly:** Update regulatory reference library (no model retrain)
- **Quarterly:** Retrain text adaptation model with new NPAs
- **Annually:** Major algorithm improvements based on user feedback trends

---

## Success Metrics

**Primary KPIs:**

1. **Auto-Fill Coverage**
   - Baseline: 0% (manual form today)
   - Target Year 1: ≥78%
   - Measured by: (Auto-filled fields / Total fields) × 100%

2. **User Acceptance Rate**
   - Definition: Percentage of auto-filled content accepted without changes
   - Target: ≥85%
   - Measured by: Track manual overrides per field

3. **Time Savings**
   - Baseline: 60-90 minutes (manual form)
   - Target: 15-20 minutes (with auto-fill)
   - Measured by: Time from Phase 0 start to template submission

4. **First-Time Submission Quality**
   - Definition: Percentage of auto-filled NPAs that pass Checker review on first try
   - Target: ≥70% (vs 52% baseline)
   - Measured by: Checker rejection rate for auto-filled vs manual NPAs

**Secondary KPIs:**

5. **Field-Level Accuracy**
   - Measured per field: How often is auto-fill correct?
   - Target: ≥90% accuracy per field
   - Critical fields (risk assessments): ≥95% accuracy

6. **Adaptation Quality**
   - Definition: For adapted fields (Bucket 2), how often is adaptation correct?
   - Target: ≥88% (harder than direct copy)
   - Measured by: User override rate on yellow-flagged fields

7. **User Satisfaction**
   - Survey after each auto-fill: "How helpful was auto-fill?"
   - Target: ≥4.3/5.0
   - Measured by: In-app rating

---

## Conclusion: Why This Agent Is Critical

The Template Auto-Fill Engine is the **time machine** of the NPA Workbench because it:

1. **Eliminates Repetitive Work** - Why retype "Booking System: Murex" for the 500th time when it's always Murex for FX products?

2. **Preserves Institutional Knowledge** - Best practices from 1,784 approved NPAs are automatically inherited by new submissions

3. **Ensures Consistency** - Every FX Forward NPA has the same structure, same quality, same level of detail

4. **Reduces Errors** - Copying proven content from approved NPAs is safer than writing from scratch

5. **Accelerates Onboarding** - New Makers can submit quality NPAs on Day 1 because the system guides them

But here's the real magic: **78% auto-fill isn't just about saving 45 minutes. It's about removing the cognitive burden of "what do I write here?" so the Maker can focus on the 22% that actually requires human judgment—the unique aspects of their specific deal.**

That's the power of intelligent automation balanced with human expertise.

---

**Next Deliverable:** ML-Based Prediction Sub-Agent - How to predict approval likelihood, timeline, and bottlenecks using historical patterns

---
