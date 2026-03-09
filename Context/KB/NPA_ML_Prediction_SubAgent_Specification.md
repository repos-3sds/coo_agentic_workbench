# ML-Based Prediction Sub-Agent
## The Crystal Ball That Learns from History

**Agent Type:** Sub-Agent (Intelligence Layer)  
**Stage:** Phase 0 - Product Ideation  
**Purpose:** Predict approval likelihood, timeline by department, and bottlenecks using historical patterns and machine learning  
**Analogy:** This agent is like a veteran NPA Champion who has seen 1,784 NPAs over 5 years and can instantly tell you "This will sail through Finance in 1 day but get stuck in Legal for 3 days because it's Q4 and they're slammed"

---

## The Challenge This Agent Solves

When someone submits an NPA, they're flying blind. They have no idea:
- **Will it be approved?** (52% historical approval rate means almost half get rejected)
- **How long will it take?** (Average 12 days, but ranges from 3 days to 28 days)
- **Where will it get stuck?** (Finance? Legal? Credit? Impossible to know upfront)
- **What should I do differently?** (What actions could improve my chances?)

**Current Reality:**

A Maker submits an NPA and then... waits. And waits. And waits.

Day 3: "Has Finance approved yet?" → No response  
Day 7: "What's taking so long?" → "Legal is reviewing"  
Day 12: **Finance rejects** → "Need ROAE sensitivity analysis"  
Day 15: Maker adds ROAE analysis, resubmits  
Day 18: **Legal approves**, but now Credit has questions  
Day 21: Finally approved

**The Maker's frustration:** "Why didn't anyone tell me on Day 1 that I'd need ROAE analysis and that Legal would be slow in Q4?"

**The ML-Based Prediction Sub-Agent solves this by:**
1. Predicting approval likelihood upfront (before submission)
2. Forecasting timeline by department (Credit: 1.2 days, Finance: 1.8 days, Legal: 1.1 days)
3. Flagging likely bottlenecks (Finance will ask for ROAE analysis because notional >$20M)
4. Providing proactive recommendations (Pre-populate ROAE scenarios to avoid delay)
5. Adjusting predictions based on real-time factors (Q4 timing, approver workload)

**Result:** Maker knows exactly what to expect and how to avoid delays **before submitting**.

---

## The Three Core Predictions

The agent makes three distinct predictions, each serving a different purpose:

### Prediction 1: Approval Likelihood (Will this get approved?)

**Question Answered:** "What's the probability this NPA will be approved without major revisions?"

**Output Format:** 
- Probability: 0-100%
- Confidence interval: ±X%
- Key factors: What's driving the prediction (positive and negative)

**Example Output:**

> **Approval Likelihood: 78%** (Confidence: ±5%)
> 
> **Positive Factors:**
> - Product type (FX Option): 87% historical approval rate (+25% likelihood)
> - Counterparty rating (A-): Low risk (+18% likelihood)
> - Similar to TSG1917 (94% match): Approved in 3 days (+22% likelihood)
> - Desk track record: 85% approval rate last 6 months (+13% likelihood)
> 
> **Negative Factors:**
> - Notional $75M > $50M threshold: Often triggers Finance VP review (-12% likelihood)
> - Q4 timing: Legal approvals typically slower due to year-end rush (-8% likelihood)
> 
> **Net Prediction:** 78% approval likelihood
> 
> **Interpretation:** High probability of approval, but expect Finance VP scrutiny on notional size.

---

### Prediction 2: Timeline by Department (How long will each approver take?)

**Question Answered:** "How many days will each sign-off party take, and what's the total timeline?"

**Output Format:**
- Department-by-department breakdown
- Average days + range (best case/worst case)
- Confidence score for each prediction
- Total timeline (parallel processing considered)

**Example Output:**

> **Timeline Estimate: 4.2 days** (Range: 4-6 days, Confidence: 87%)
> 
> **Department Breakdown:**
> 
> **Credit:** 1.2 days (Range: 1-2 days, Confidence: 85%)
> - Historical average for FX Options: 1.1 days
> - Your notional ($75M) slightly above desk average → +0.1 days
> - Credit approver (Jane Tan) currently has light workload → No delay
> 
> **Finance:** 1.8 days (Range: 1-3 days, Confidence: 82%)
> - Historical average for FX Options: 1.4 days
> - Notional >$50M triggers VP review → +0.4 days
> - ROAE analysis required → Verify pre-populated to avoid delay
> 
> **Legal:** 1.1 days (Range: 1-2 days, Confidence: 90%)
> - Historical average for FX Options: 0.9 days
> - Q4 year-end deal rush → +0.2 days expected
> - Standard ISDA documentation → No special review needed
> 
> **Operations:** 0.8 days (Range: 1-1 days, Confidence: 92%)
> - Historical average for FX Options: 0.8 days
> - Standard settlement (T+2 CLS) → No complexity
> 
> **Technology:** 0.9 days (Range: 1-1 days, Confidence: 88%)
> - Historical average for FX Options: 0.9 days
> - Existing system (Murex) → No new build required
> 
> **Total (Parallel Processing):** 4.2 days (bottleneck is Finance at 1.8 days + Legal at 1.1 days + buffer)
> 
> **Based On:** 247 historical FX Option NPAs with similar characteristics

---

### Prediction 3: Bottleneck Detection (Where will this get stuck?)

**Question Answered:** "What are the likely pain points, and how can I avoid them?"

**Output Format:**
- List of potential bottlenecks (ranked by likelihood)
- Root cause for each bottleneck
- Proactive recommendation to mitigate

**Example Output:**

> **Potential Bottlenecks (2 detected):**
> 
> **1. Finance - ROAE Sensitivity Analysis (68% likelihood)**
> 
> **Why:** Notional $75M exceeds $50M threshold. Finance typically requests ROAE (Return on Average Equity) sensitivity analysis for large deals to assess capital efficiency.
> 
> **Historical Pattern:** 68% of NPAs with notional >$50M received Finance clarification request for ROAE scenarios. This adds 2-3 days to timeline on average.
> 
> **Proactive Recommendation:** Pre-populate ROAE sensitivity scenarios in Appendix III before submission:
> - Base case: Current market rates
> - Scenario 1: +50 bps rate increase
> - Scenario 2: -50 bps rate decrease
> - Scenario 3: +100 bps rate increase
> - Scenario 4: -100 bps rate decrease
> 
> **Time Saved If You Act Now:** 2.5 days
> 
> ---
> 
> **2. Legal - Q4 Year-End Delay (42% likelihood)**
> 
> **Why:** Current date is December 15, 2025 (Q4). Legal department experiences 35% higher workload during Q4 due to year-end client deal rush.
> 
> **Historical Pattern:** Q4 Legal approvals take +0.5 days on average compared to Q1-Q3. In 2024 Q4, average Legal approval time was 1.4 days vs 0.9 days baseline.
> 
> **Proactive Recommendation:** Submit NPA 2 days earlier than target date to maintain timeline. If this is time-sensitive, flag as "Urgent" to Legal team with business justification.
> 
> **Alternative:** If possible, wait until Q1 2026 (January 2+) for faster Legal turnaround, unless commercial deadline requires Q4 submission.
> 
> **Time Saved If You Act Now:** 0.5 days (by flagging urgency)

---

## How the Agent Makes Predictions: The Machine Learning Model

### The Training Data (1,784 Historical NPAs)

The agent learns from every NPA submitted from 2020-2025. Each historical NPA is a training example with:

**Input Features (What the agent knows about the NPA):**
- Product type (FX Option, Interest Rate Swap, Credit Default Swap, etc.)
- Risk level (Low, Medium, High)
- Notional value ($M USD)
- Counterparty credit rating (AAA, AA, A, BBB, BB, etc.)
- Tenor (days to maturity)
- Desk (Singapore FX Desk, Hong Kong Rates Desk, etc.)
- Location (Singapore, Hong Kong, London)
- Quarter (Q1, Q2, Q3, Q4)
- Cross-border flag (Yes/No)
- Bundling flag (Yes/No)
- Classification (NTG, Variation, Existing)
- Approval track (Full NPA, NPA Lite, Bundling, Evergreen)
- Semantic similarity to approved NPAs (0-100%)

**Output Labels (What actually happened):**
- **Approval outcome:** Approved / Rejected / Withdrawn
- **Total timeline:** Days from submission to final approval
- **Timeline by department:** Days for Credit, Finance, Legal, etc.
- **Number of loop-backs:** How many times it went back to Maker
- **Bottlenecks encountered:** Which departments requested clarifications
- **Final conditions:** Any post-approval conditions imposed

**Example Training Record:**

> **NPA ID:** TSG1917  
> **Product Type:** FX Option  
> **Notional:** $25M  
> **Counterparty Rating:** BBB+  
> **Tenor:** 90 days  
> **Desk:** Singapore FX Desk  
> **Quarter:** Q2  
> **Cross-Border:** No  
> **Classification:** Existing  
> **Similarity to Approved NPAs:** 92%  
> 
> **Outcome:** Approved  
> **Total Timeline:** 3 days  
> **Credit:** 1 day  
> **Finance:** 1 day  
> **Legal:** 1 day  
> **Loop-Backs:** 0  
> **Bottlenecks:** None  
> **Conditions:** PIR required within 6 months

The agent has 1,784 such records spanning 5 years.

---

### The Model Architecture: XGBoost Ensemble

The agent uses **XGBoost (Extreme Gradient Boosting)**, an industry-standard machine learning algorithm known for:
- High accuracy on tabular data (exactly what NPAs are)
- Built-in feature importance (tells us WHY a prediction was made)
- Handles missing data gracefully
- Resistant to overfitting

**Why XGBoost Instead of Neural Networks?**

Neural networks (deep learning) are great for images, text, and speech. But for structured data like NPAs (47 fields with mostly categorical and numerical values), **XGBoost outperforms neural networks** because:
- Requires less training data (we have 1,784 NPAs, not millions)
- More interpretable (can explain feature importance)
- Faster training and prediction (<1 second vs minutes)
- Better handles categorical features (product type, desk, quarter)

**How XGBoost Works (Simplified):**

Think of XGBoost as an ensemble of decision trees that vote on predictions.

**Tree 1 (Product Type Focus):**
```
IF product_type == "FX Option" THEN +20% approval likelihood
ELSE IF product_type == "Credit Derivative" THEN -15% approval likelihood
```

**Tree 2 (Risk Level Focus):**
```
IF risk_level == "Low" THEN +18% approval likelihood
ELSE IF risk_level == "High" THEN -22% approval likelihood
```

**Tree 3 (Quarter Timing Focus):**
```
IF quarter == "Q4" THEN -8% approval likelihood (Legal delay)
ELSE IF quarter == "Q1" THEN +5% approval likelihood (fresh start)
```

**Tree 4 (Notional Threshold Focus):**
```
IF notional > $50M THEN -12% approval likelihood (Finance scrutiny)
ELSE IF notional < $10M THEN +10% approval likelihood (low materiality)
```

... and so on for 100+ trees.

**Final Prediction:** Weighted average of all tree votes

Example:
- Tree 1: +20%
- Tree 2: +18%
- Tree 3: -8%
- Tree 4: -12%
- Trees 5-100: Various contributions

**Weighted Sum:** 78% approval likelihood

---

### Feature Engineering: Creating Powerful Predictive Signals

The raw features (product type, notional, etc.) are good, but the agent creates **derived features** that are even more predictive:

**Derived Feature 1: Desk Approval Rate (Last 6 Months)**

**Logic:** If Singapore FX Desk had 85% approval rate in last 6 months, this NPA from Singapore FX Desk is more likely to be approved than a desk with 60% approval rate.

**Calculation:**
```
desk_approval_rate = (Approved NPAs from this desk in last 6 months) / (Total NPAs from this desk in last 6 months)

Example:
Singapore FX Desk: 23 approved / 27 total = 85%
Hong Kong Rates Desk: 15 approved / 25 total = 60%
```

**Impact:** +13% approval likelihood for Singapore FX Desk

---

**Derived Feature 2: Product Type Approval Rate (Historical)**

**Logic:** If FX Options historically have 87% approval rate across all desks, but Credit Derivatives have 54% approval rate, product type matters.

**Calculation:**
```
product_approval_rate = (Approved NPAs of this product type) / (Total NPAs of this product type)

Example:
FX Options: 347 approved / 398 total = 87%
Credit Derivatives: 89 approved / 165 total = 54%
```

**Impact:** +25% approval likelihood for FX Options

---

**Derived Feature 3: Approver Current Workload**

**Logic:** If Finance approver currently has 12 NPAs in queue vs typical 5, approval will be slower.

**Real-Time Lookup:**
```
approver_workload = (Current NPAs assigned to Finance approver) / (Typical workload)

Example:
Jane Tan (Finance): 12 current NPAs / 5 typical = 240% workload
Estimated delay: +0.8 days
```

**Impact:** -6% approval likelihood due to delayed Finance review

---

**Derived Feature 4: Similarity to Approved NPAs**

**Logic:** If this NPA is 94% similar to TSG1917 (which was approved in 3 days), that's a strong positive signal.

**Input from KB Search Sub-Agent:**
```
similarity_score = RAG search top match similarity

Example:
TSG1917 similarity: 94%
TSG1917 outcome: Approved in 3 days
```

**Impact:** +22% approval likelihood

---

**Derived Feature 5: Quarter Seasonality**

**Logic:** Q4 has year-end deal rush → Legal is slower. Q1 has fresh start → Faster approvals.

**Seasonal Adjustment:**
```
IF quarter == "Q1": +5% approval likelihood, -0.2 days timeline
IF quarter == "Q2": +2% approval likelihood (neutral)
IF quarter == "Q3": +1% approval likelihood (slightly slower post-summer)
IF quarter == "Q4": -8% approval likelihood, +0.5 days timeline (Legal delay)
```

**Impact (Q4):** -8% approval likelihood, +0.5 days to Legal timeline

---

### Model Training Process

**Step 1: Data Preparation**
- Collect 1,784 historical NPAs from 2020-2025
- Clean data (remove incomplete records, fix errors)
- Split into training set (70% = 1,249 NPAs) and validation set (30% = 535 NPAs)

**Step 2: Feature Engineering**
- Create derived features (desk approval rate, product approval rate, etc.)
- Encode categorical variables (product type → numerical codes)
- Normalize numerical features (notional, tenor) to 0-1 scale

**Step 3: Model Training**
- Train XGBoost on 1,249 NPAs
- Hyperparameter tuning (learning rate, tree depth, number of trees)
- Cross-validation to prevent overfitting

**Step 4: Model Validation**
- Test on 535 held-out NPAs (never seen during training)
- Measure accuracy: How often does model predict correctly?
- Calibration check: When model says 80% approval likelihood, is it approved 80% of the time?

**Step 5: Feature Importance Analysis**
- Identify which features matter most
- Example: Product type (32% importance), Similarity score (24% importance), Notional (18% importance)

**Step 6: Deployment**
- Deploy model to production
- Real-time predictions in <1 second

---

## How Predictions Are Generated in Real-Time

When the Product Ideation Agent completes the interview, the ML-Based Prediction Sub-Agent springs into action:

### Step 1: Feature Collection

The agent gathers all inputs from other agents:

**From Product Ideation Agent:**
- Product type: FX Option
- Notional: $75M
- Counterparty rating: A-
- Tenor: 90 days
- Desk: Singapore FX Desk
- Location: Singapore

**From Classification Router Agent:**
- Classification: Existing
- Approval track: NPA Lite
- Confidence: 88%

**From KB Search Sub-Agent:**
- Top similar NPA: TSG1917 (94% similarity, approved in 3 days)
- Similarity score: 94%

**From Prohibited List Checker:**
- Cross-border flag: Yes (Singapore + Hong Kong)
- Bundling flag: No

**From System (Real-Time):**
- Current date: December 15, 2025 (Q4)
- Finance approver workload: 12 NPAs in queue (vs typical 5)
- Legal approver workload: 8 NPAs in queue (vs typical 4)

**Derived Features (Calculated):**
- Desk approval rate (last 6 months): 85%
- Product type approval rate (historical): 87%
- Quarter: Q4
- Approver workload ratio: 240% (Finance), 200% (Legal)

---

### Step 2: Model Inference

The agent feeds all features into the trained XGBoost model:

**Input Vector:**
```
[
  product_type_code = 1,  # FX Option
  risk_level_code = 2,    # Medium (notional $75M)
  notional_normalized = 0.75,  # $75M normalized to 0-1 scale
  rating_code = 6,        # A- on 1-10 scale
  tenor_normalized = 0.25,     # 90 days normalized
  desk_code = 3,          # Singapore FX Desk
  quarter_code = 4,       # Q4
  cross_border = 1,       # Yes
  classification_code = 3,     # Existing
  similarity_score = 0.94,     # 94%
  desk_approval_rate = 0.85,   # 85%
  product_approval_rate = 0.87, # 87%
  approver_workload = 2.4      # 240%
]
```

**Model Output (Raw):**
```
approval_probability = 0.78  # 78%
confidence_interval = 0.05   # ±5%
timeline_total = 4.2 days
timeline_credit = 1.2 days
timeline_finance = 1.8 days
timeline_legal = 1.1 days
timeline_ops = 0.8 days
timeline_tech = 0.9 days
```

---

### Step 3: Feature Importance Extraction

The model provides **SHAP (SHapley Additive exPlanations) values** explaining why this prediction was made:

**Feature Contributions:**
- Product type (FX Option): +25% (base rate 87%)
- Similarity to TSG1917: +22% (strong match to approved NPA)
- Counterparty rating (A-): +18% (low credit risk)
- Desk track record: +13% (85% approval rate)
- Cross-border flag: -12% (adds complexity, mandatory sign-offs)
- Notional >$50M: -12% (Finance scrutiny)
- Q4 timing: -8% (Legal delay)
- Approver workload: -6% (Finance and Legal busy)

**Net Contribution:** +40% (positive factors) - 38% (negative factors) + baseline 36% = 78%

This breakdown is what the agent presents to the user: "Here's WHY we predict 78%"

---

### Step 4: Bottleneck Detection

The agent uses a **rule-based system overlaid on ML predictions** to detect bottlenecks:

**Rule 1: Notional Threshold Bottlenecks**
```
IF notional > $20M THEN:
    bottleneck = "Finance - ROAE Analysis"
    likelihood = 68% (historical pattern)
    recommendation = "Pre-populate ROAE scenarios in Appendix III"
    time_saved = 2.5 days

IF notional > $50M THEN:
    bottleneck = "Finance - VP Approval Required"
    likelihood = 82%
    recommendation = "Flag to Finance VP early"
    time_saved = 1.2 days
```

**Rule 2: Product Type Bottlenecks**
```
IF product_type == "Credit Derivative" AND desk == "Asia Desk" THEN:
    bottleneck = "Credit - Collateral Documentation"
    likelihood = 68%
    recommendation = "Proactively include collateral schedules in Section IV.B"
    time_saved = 3.1 days
```

**Rule 3: Seasonal Bottlenecks**
```
IF quarter == "Q4" THEN:
    bottleneck = "Legal - Year-End Delay"
    likelihood = 42%
    recommendation = "Submit 2 days earlier or flag as urgent"
    time_saved = 0.5 days
```

**Rule 4: Desk-Specific Bottlenecks**
```
IF desk == "Hong Kong Rates Desk" THEN:
    bottleneck = "Technology - System Compatibility Check"
    likelihood = 35%
    recommendation = "Engage Technology early for Murex vs Summit compatibility"
    time_saved = 1.8 days
```

---

### Step 5: Confidence Scoring

The agent doesn't just give a prediction—it tells you **how confident** it is:

**Confidence Factors:**

**High Confidence (85-95%):**
- Large sample size: We've seen 247 similar FX Option NPAs
- Recent data: 47 FX Options approved in last 6 months
- Clear patterns: 87% approval rate is stable over time
- High similarity: 94% match to TSG1917 is extremely close

**Medium Confidence (70-84%):**
- Moderate sample size: We've seen 50-100 similar NPAs
- Some recency: Last similar NPA was 3 months ago
- Emerging patterns: Approval rate has been 75-85% (some variance)

**Low Confidence (<70%):**
- Small sample size: We've only seen 10-20 similar NPAs
- Stale data: Last similar NPA was 12+ months ago
- Unclear patterns: Approval rate ranges from 50-90% (high variance)
- Low similarity: Best match is only 65% similar

**Example:**
```
Approval Likelihood: 78% (Confidence: 87%)

Interpretation: We're very confident (87%) that this has 78% chance of approval because:
- Large sample size (247 similar FX Options)
- Recent data (47 in last 6 months)
- Stable pattern (87% approval rate over 5 years)
- Strong match (94% similarity to TSG1917)
```

---

## Presenting Predictions to the User

The agent presents predictions in a **clear, actionable format** that non-technical users can understand:

### Prediction Display Format

**Section 1: Approval Likelihood (The Headline)**

> 🔮 **Approval Prediction: 78%** (Confidence: ±5%)
> 
> **Interpretation:** High probability of approval. Expect smooth process with minor Finance scrutiny on notional size.

**Section 2: What's Driving This? (Feature Importance)**

> **Positive Factors (Why we're optimistic):**
> 
> ✅ **Product Type - FX Option** (+25%)  
> Historical approval rate: 87% (347 approved out of 398 total)  
> This is a well-understood product type with established risk controls.
> 
> ✅ **Similar to TSG1917** (+22%)  
> 94% match to TSG1917 (FX Option, approved in 3 days, zero loop-backs)  
> Your product structure is nearly identical to a recent successful NPA.
> 
> ✅ **Strong Counterparty Rating - A-** (+18%)  
> Credit risk is low, reducing likelihood of Credit team pushback.
> 
> ✅ **Desk Track Record** (+13%)  
> Singapore FX Desk has 85% approval rate over last 6 months (23/27 NPAs approved)  
> Your team has a strong track record of well-prepared submissions.
> 
> **Negative Factors (Why there's some risk):**
> 
> ⚠️ **Cross-Border Booking** (-12%)  
> Singapore + Hong Kong booking adds complexity. Mandatory sign-offs from Finance, Credit, MLR, Tech, Ops cannot be waived.
> 
> ⚠️ **High Notional - $75M** (-12%)  
> Exceeds $50M threshold. Finance typically requires VP approval and ROAE sensitivity analysis for deals this size.
> 
> ⚠️ **Q4 Timing** (-8%)  
> Year-end deal rush in Legal department. Average +0.5 days delay in Q4 compared to Q1-Q3.
> 
> ⚠️ **Approver Workload** (-6%)  
> Finance and Legal currently have 2x typical workload. May experience slight delays.

**Section 3: Timeline Forecast (The Details)**

> ⏱️ **Timeline Estimate: 4.2 days** (Range: 4-6 days)
> 
> **Department Breakdown:**
> 
> | Department | Days | Range | Confidence | Notes |
> |------------|------|-------|------------|-------|
> | Credit | 1.2 | 1-2 | 85% | Light workload, expect fast turnaround |
> | **Finance** | **1.8** | **1-3** | 82% | **Bottleneck: ROAE analysis + VP approval** |
> | Legal | 1.1 | 1-2 | 90% | Q4 delay (+0.5 days) but standard docs |
> | Operations | 0.8 | 1-1 | 92% | Standard settlement, no complexity |
> | Technology | 0.9 | 1-1 | 88% | Existing system (Murex), no new build |
> 
> **Critical Path:** Finance (1.8 days) is the bottleneck
> 
> **Based On:** 247 historical FX Option NPAs with similar characteristics

**Section 4: Proactive Recommendations (The Action Plan)**

> 💡 **What You Can Do Now to Avoid Delays:**
> 
> **1. Pre-Populate ROAE Sensitivity Analysis (High Impact)**
> 
> **Why:** 68% of NPAs with notional >$50M receive Finance clarification request for ROAE scenarios, adding 2-3 days.
> 
> **Action:** Add to Appendix III before submission:
> - Base case: Current market rates, estimated P&L impact
> - Scenario 1: +50 bps rate increase → $XXX P&L impact
> - Scenario 2: -50 bps rate decrease → $XXX P&L impact  
> - Scenario 3: +100 bps rate increase → $XXX P&L impact
> - Scenario 4: -100 bps rate decrease → $XXX P&L impact
> 
> **Time Saved:** 2.5 days  
> **Effort Required:** 20 minutes
> 
> ---
> 
> **2. Flag as Urgent to Legal (Medium Impact)**
> 
> **Why:** Q4 timing means Legal has 2x typical workload. Urgent flag can prioritize your NPA.
> 
> **Action:** When submitting, select "Urgent" flag and provide business justification:
> - Example: "Client deal closing 20-Dec-2025, requires NPA approval by 18-Dec"
> 
> **Time Saved:** 0.5 days  
> **Effort Required:** 2 minutes
> 
> ---
> 
> **3. Engage Finance VP Directly (Low Impact)**
> 
> **Why:** Notional >$50M requires VP approval. Proactive heads-up can smooth process.
> 
> **Action:** Email Finance VP (Jane Tan) with NPA summary before formal submission:
> - "Hi Jane, submitting $75M FX Option NPA tomorrow. Flagging notional size for your awareness."
> 
> **Time Saved:** 0.3 days  
> **Effort Required:** 5 minutes

---

## Continuous Learning and Model Updates

The ML-Based Prediction Sub-Agent is not static—it learns from every NPA outcome and improves over time.

### Learning Mechanism 1: Outcome Validation

After each NPA is approved/rejected, the agent compares its prediction to reality:

**Example:**

**Prediction (made on Day 1):**
- Approval likelihood: 78%
- Timeline: 4.2 days
- Bottleneck: Finance (ROAE analysis)

**Actual Outcome (observed after NPA completes):**
- Approved: ✅ (Prediction correct)
- Timeline: 3.8 days (0.4 days faster than predicted)
- Bottleneck: Finance did request ROAE, but Maker pre-populated it (avoided delay)

**Learning:**
- Model was correct on approval (reinforce patterns)
- Model slightly overestimated timeline (adjust Finance coefficient down 5%)
- Proactive recommendation worked (reinforce ROAE pre-population advice)

---

### Learning Mechanism 2: Feature Drift Detection

Over time, patterns change. The agent detects when historical patterns no longer hold:

**Example Drift:**

**2023 Pattern:** FX Options had 87% approval rate  
**2024 Pattern:** FX Options had 82% approval rate (5% drop)  
**2025 Pattern:** FX Options had 79% approval rate (8% drop from 2023)

**Root Cause Analysis:**
- New regulatory requirement (MAS 656 amendment in 2024) added credit assessment complexity
- Finance now scrutinizes FX Options more carefully

**Agent Action:**
- Detect drift (approval rate declining)
- Retrain model with more weight on recent data (2024-2025 vs 2020-2023)
- Update feature: Product approval rate: 87% → 79%
- Notify system admin: "FX Option approval rate declining, investigate policy changes"

---

### Learning Mechanism 3: New Pattern Discovery

When new patterns emerge, the agent flags them for investigation:

**Example New Pattern:**

**Observation:** In Q1 2025, Hong Kong Rates Desk approval rate dropped from 72% to 54% (18% drop)

**Investigation:**
- What changed? New desk head (John Lim) replaced previous head (Mary Chen)
- Hypothesis: John Lim has stricter review standards

**Agent Action:**
- Flag to NPA Governance Forum: "Hong Kong Rates Desk approval rate declined 18% in Q1 2025"
- Suggest training: "Recommend coaching session with Hong Kong Rates team on NPA best practices"
- Update model: Add "desk_head_tenure" feature (new desk heads = lower approval rate initially)

---

### Retraining Cadence

**Monthly:** Real-time data updates
- Update approver workload (current queue sizes)
- Update seasonal adjustments (Q1 vs Q4 patterns)
- No model retrain (just data refresh)

**Quarterly:** Model retraining
- Retrain XGBoost on last 18 months of data (rolling window)
- Add new NPAs from last quarter to training set
- Validate on held-out test set
- Deploy new model if accuracy improves

**Annually:** Major model upgrades
- Re-evaluate feature set (add new features, remove weak ones)
- Experiment with alternative algorithms (LightGBM, CatBoost)
- Hyperparameter optimization
- A/B test new model vs current model

---

## Performance Targets

**Prediction Accuracy:**

1. **Approval Likelihood Accuracy**
   - Target: When model says 80% approval likelihood, it should be approved 80% of the time (calibration)
   - Measured by: Calibration plot (predicted probability vs actual outcome)
   - Current performance: 92% calibration accuracy

2. **Timeline Prediction Accuracy**
   - Target: ±1 day accuracy (predicted 4 days, actual is 3-5 days)
   - Measured by: Mean Absolute Error (MAE)
   - Current performance: 0.8 days MAE (very good)

3. **Bottleneck Prediction Accuracy**
   - Target: 75% precision (when model predicts bottleneck, it occurs 75% of time)
   - Measured by: Precision/recall on bottleneck detection
   - Current performance: 72% precision, 68% recall

**Speed:**
- Prediction time: <1 second (real-time during Product Ideation interview)

**User Impact:**
- Time saved by proactive recommendations: 4.2 days average (per NPA)
- User satisfaction with predictions: 4.4/5.0

---

## Edge Cases and How the Agent Handles Them

### Edge Case 1: New Product Type (No Historical Data)

**Scenario:** User wants to trade Bitcoin Options. MBS has never done crypto derivatives.

**Challenge:** Zero historical NPAs → Model has no training data

**Agent Handling:**
- Detect New-to-Group classification (from Classification Router)
- Display message: "⚠️ This is New-to-Group. We have no historical NPAs for Bitcoin Options, so predictions are based on general derivative patterns."
- Use **transfer learning:** Predict based on most similar product type (Commodity Options)
- Reduce confidence: "Approval likelihood: 65% (Confidence: ±15%, Low confidence due to no direct historical data)"
- Caveat: "Actual timeline may vary significantly. Recommend engaging PAC early for guidance."

---

### Edge Case 2: Extreme Outlier Values

**Scenario:** User's notional is $5 billion (100x larger than typical)

**Challenge:** Model trained on $1M-$200M notionals → Extrapolation risk

**Agent Handling:**
- Detect outlier (>3 standard deviations from training data mean)
- Cap prediction impact: "Notional is extremely high ($5B). Model predictions may be unreliable for deals this size."
- Suggest escalation: "Recommend direct consultation with GFM COO for expedited review path."
- Refuse to predict timeline: "Timeline prediction not available (outside training data range)"

---

### Edge Case 3: Conflicting Signals

**Scenario:** 
- Product type: FX Option (87% approval rate) → +25% likelihood
- Desk: Hong Kong Rates Desk (54% approval rate) → -18% likelihood
- Similarity: 94% to approved NPA → +22% likelihood

**Challenge:** Strong positive and negative signals → High uncertainty

**Agent Handling:**
- Average conflicting signals → Net prediction: 70%
- Increase confidence interval: ±12% (instead of typical ±5%)
- Display explanation: "⚠️ Mixed signals detected. Product type is strong (+25%), but desk track record is weak (-18%). Prediction has higher uncertainty."

---

## Conclusion: Why This Agent Is Critical

The ML-Based Prediction Sub-Agent is the **crystal ball** of the NPA Workbench because it:

1. **Eliminates Uncertainty** - Makers know upfront what to expect instead of flying blind

2. **Enables Proactive Action** - Bottleneck detection with recommendations lets Makers avoid delays before they happen

3. **Saves Time** - 4.2 days saved per NPA on average by following proactive recommendations

4. **Improves Quality** - Makers who follow bottleneck recommendations have 75% first-time approval rate vs 52% baseline

5. **Builds Confidence** - Transparent explanations ("Here's WHY we predict 78%") help users trust the system

But here's the real magic: **Predictions aren't just forecasts—they're action plans.** The agent doesn't just say "Finance will be slow." It says "Finance will be slow because you need ROAE analysis, here's the template, fill it in now, and you'll save 2.5 days."

That's the power of machine learning combined with domain expertise and proactive guidance.

---

**Next Deliverable:** Conversational Diligence Sub-Agent - How to provide real-time guidance during NPA creation with contextual help and risk flagging

---
