# KB Search Sub-Agent (RAG Engine)
## The Institutional Memory That Never Forgets

**Agent Type:** Utility Agent (Shared Infrastructure)  
**Stage:** Active throughout entire workflow, especially critical in Phase 0  
**Purpose:** Search 1,784+ historical NPAs and policy documents to find similar cases, precedents, and relevant guidance  
**Analogy:** This agent is like a veteran librarian who has read every NPA ever submitted and can instantly recall "Oh yes, we did something like this in 2023—here's what happened"

---

## The Challenge This Agent Solves

Banking is all about precedent. Before approving a new product, everyone asks the same questions:
- "Have we done this before?"
- "How did it turn out?"
- "What issues came up?"
- "Who approved it and how long did it take?"
- "What conditions were imposed?"

**Current Reality:**

A Maker wants to know if anyone has traded FX Options with BBB+ counterparties before. They:

1. **Email the NPA Champion:** "Hey, have we done this before?"  
   - Response time: 2-4 hours (if they remember to reply)
   - Answer: "I think Singapore desk did something similar last year, but I'm not sure of the details"

2. **Search NPA House manually:** Browse through folders, open 20+ PDF files  
   - Time spent: 45 minutes
   - Success rate: 30% (might miss relevant NPAs)
   - Quality: Incomplete (only finds what they search for)

3. **Ask colleagues:** "Does anyone remember an FX Option NPA from last year?"  
   - Response: "Maybe check with John in Hong Kong?"
   - Result: Knowledge trapped in people's heads

**The KB Search Sub-Agent solves this by:**
1. **Instant search** across ALL 1,784 historical NPAs (<2 seconds)
2. **Semantic understanding** (finds "FX Forward" even when you search "currency hedge")
3. **Rich context** (not just "TSG1917 exists" but "TSG1917: Approved in 3 days, zero loop-backs, PIR completed, similar structure to yours")
4. **Trend analysis** ("FX Options have 87% approval rate, average 4.2 days timeline")
5. **Proactive surfacing** (agent automatically searches during Product Ideation interview)

---

## How RAG (Retrieval-Augmented Generation) Works

### What is RAG?

RAG stands for **Retrieval-Augmented Generation**. It's a technique that combines:
- **Retrieval:** Finding relevant documents from a knowledge base
- **Generation:** Using those documents to generate intelligent responses

Think of it like an open-book exam:
- **Without RAG:** You answer questions from memory (limited, might be outdated)
- **With RAG:** You can look up information in textbooks before answering (comprehensive, always current)

### The RAG Architecture (Simplified)

**Step 1: Document Ingestion (One-Time Setup)**

Every historical NPA is processed and stored in a searchable format:

**Input:** NPA document (PDF, Word, Excel)
```
Document: TSG1917 - FX Option on EUR/USD
Product Type: FX Option
Counterparty: ABC Corporation (BBB+ rated)
Notional: $25M
Tenor: 3 months
Desk: Singapore FX Desk
Submitted: 2024-12-01
Approved: 2024-12-04 (3 days)
Sign-Offs: Credit (1 day), Finance (1 day), Legal (1 day)
Loop-Backs: 0
Outcome: Approved
Conditions: PIR required within 6 months
Risk Assessment: "Market risk is moderate. The $25M notional represents 2.3% of desk book..."
```

**Processing:**
1. **Text Extraction:** Pull out all text content
2. **Chunking:** Break into smaller segments (500-1000 words each)
   - Chunk 1: Product specifications
   - Chunk 2: Risk assessment
   - Chunk 3: Operational details
   - Chunk 4: Approval timeline and conditions
3. **Embedding:** Convert each chunk into a vector (mathematical representation)
   - Vector = array of 1,536 numbers that captures semantic meaning
   - Example: [0.023, -0.145, 0.891, ..., 0.234] (1,536 dimensions)
4. **Storage:** Save vectors in Supabase vector database

**Result:** TSG1917 is now searchable by semantic similarity

---

**Step 2: Search Query Processing (Real-Time)**

When a user asks a question or Product Ideation Agent triggers search:

**Input:** User describes product
```
"I want to trade an FX Option on GBP/USD with a BBB+ counterparty, $50M notional, 6-month tenor"
```

**Processing:**
1. **Query Embedding:** Convert question into same vector format
   - Query vector: [0.019, -0.152, 0.887, ..., 0.229]
2. **Similarity Search:** Find chunks with closest vectors
   - Measure: Cosine similarity (0-1 scale, higher = more similar)
   - Example matches:
     - TSG1917 (FX Option, BBB+, $25M): 0.94 similarity
     - TSG2044 (FX Forward, A-, $50M): 0.82 similarity
     - TSG1823 (FX Option, BBB-, $30M): 0.88 similarity
3. **Ranking:** Sort by similarity score
4. **Filtering:** Apply optional filters
   - Only show "Approved" NPAs (exclude rejected)
   - Only from last 2 years (exclude stale)
   - Only from Singapore desk (exclude other locations)

**Result:** Top 5 most similar historical NPAs, ranked by relevance

---

**Step 3: Context Assembly (Enrichment)**

The agent doesn't just return raw documents—it enriches results with metadata:

**Base Result from Vector Search:**
```
Document ID: TSG1917
Similarity: 94%
```

**Enriched Result with Metadata:**
```
NPA ID: TSG1917
Product: FX Option on EUR/USD
Similarity: 94% (Very High Match)

Status: Approved
Timeline: 3 days (submitted 2024-12-01, approved 2024-12-04)
Outcome: First-time approval (zero loop-backs)

Sign-Off Breakdown:
- Credit: 1 day (Jane Tan)
- Finance: 1 day (Mark Lee)
- Legal: 1 day (Sarah Chen)

Conditions Imposed:
- PIR required within 6 months (completed 2024-06-15)
- Quarterly risk reporting for first year

Key Details:
- Counterparty: ABC Corporation (BBB+ rated)
- Notional: $25M
- Tenor: 3 months
- Desk: Singapore FX Desk
- Risk Rating: Moderate

Relevant Excerpt (Risk Assessment):
"Market risk is moderate. The $25M notional represents 2.3% of the desk's total FX book ($1.1B). Daily VaR (Value at Risk) is estimated at $180K (99% confidence, 1-day holding period)..."

Link: [View Full NPA TSG1917]
```

This is what gets presented to the user—not just "here's a match" but "here's everything you need to know about this match."

---

## The Three Search Modes

The KB Search Sub-Agent operates in three distinct modes depending on who/what triggers it:

### Mode 1: User-Initiated Search (Ad-Hoc)

**Trigger:** User explicitly asks "Find similar NPAs" or "Search for FX Options"

**Example User Query:**
> "Show me all FX Option NPAs from the last 6 months"

**Agent Actions:**
1. Parse query: Product type = FX Option, Time range = Last 6 months
2. Search vector database with semantic query
3. Apply date filter: approved_date >= 2024-06-26
4. Return results sorted by recency (newest first)

**Output Format:**
```
Found 12 FX Option NPAs from last 6 months:

1. TSG2156 - FX Option EUR/USD ($45M) - Approved 2024-12-10 in 5 days
2. TSG2089 - FX Option GBP/JPY ($30M) - Approved 2024-11-22 in 4 days
3. TSG2034 - FX Option USD/SGD ($20M) - Approved 2024-11-08 in 3 days
...

Average approval time: 4.1 days
Approval rate: 91% (11 approved, 1 rejected)
Common bottleneck: Finance (avg 1.8 days)
```

**Use Case:** Maker wants to research before starting new NPA

---

### Mode 2: Agent-Triggered Search (Proactive)

**Trigger:** Product Ideation Agent automatically searches during interview (Step 3 of Phase 0)

**Context:** User just described product in conversational interview
```
Product Ideation Agent collected:
- Product type: FX Option
- Underlying: GBP/USD
- Notional: $50M
- Counterparty rating: BBB+
- Tenor: 6 months
```

**Agent Actions:**
1. Construct semantic query combining all product attributes
2. Search for top 5 most similar NPAs (no user action required)
3. Enrich results with timeline, outcome, conditions
4. Surface to user automatically

**Output Format (Embedded in Product Ideation Flow):**
```
📄 Similar NPAs Found (3 matches):

1. TSG1917 - FX Option EUR/USD (94% match) ⭐ Closest Match
   - Approved in 3 days, zero loop-backs
   - Counterparty: BBB+ rated, $25M notional
   - Your deal is similar but 2x larger notional → Expect Finance scrutiny
   
2. TSG1823 - FX Option GBP/USD (88% match)
   - Approved in 4 days, 1 loop-back (Finance ROAE request)
   - Counterparty: BBB- rated, $30M notional
   - Finance requested ROAE sensitivity analysis → You may need this too

3. TSG2044 - FX Forward GBP/USD (82% match)
   - Approved in 6 days, 2 loop-backs
   - Different product type (Forward vs Option), but same currency pair
   - Legal raised jurisdiction questions on GBP contracts
```

**Use Case:** Proactive guidance during NPA creation

---

### Mode 3: Contextual Search (Embedded)

**Trigger:** Other agents query KB during their processing

**Example: Template Auto-Fill Engine needs source NPA**
```
Template Auto-Fill Engine: "Find closest match to current product for copying content"
KB Search: [Returns TSG1917 with 94% similarity]
Template Auto-Fill: "Copy booking system, valuation model from TSG1917"
```

**Example: ML Prediction Sub-Agent needs training data**
```
ML Prediction: "Get all FX Option NPAs approved in last 18 months"
KB Search: [Returns 247 NPAs with metadata]
ML Prediction: "Calculate average approval time → 4.2 days"
```

**Example: Conversational Diligence Sub-Agent answers user question**
```
User: "What valuation model do we use for FX Options?"
Conversational Diligence: "Search KB for FX Option valuation methodology"
KB Search: [Returns 15 NPAs mentioning Black-Scholes]
Conversational Diligence: "We use Black-Scholes for vanilla FX Options (source: TSG1917, TSG1823, TSG2044...)"
```

**Use Case:** Background intelligence for other agents

---

## Semantic Search vs Keyword Search

### The Problem with Traditional Keyword Search

**User searches for:** "currency hedge"

**Keyword search finds:**
- Only documents containing exact phrase "currency hedge"
- Misses relevant documents using different terminology:
  - "FX Forward" (same thing, different name)
  - "Foreign exchange derivative" (same concept, formal name)
  - "Cross-currency swap" (related product)

**Result:** User misses 70% of relevant NPAs

---

### How Semantic Search Solves This

**User searches for:** "currency hedge"

**Semantic search understands:**
- "Currency hedge" = Financial instrument to mitigate FX risk
- Related concepts: FX Forward, FX Option, Cross-currency swap, Currency swap
- Synonyms: Foreign exchange, forex, FX

**Semantic search finds:**
- FX Forward NPAs (concept match, even without exact keywords)
- FX Option NPAs (same use case: hedging currency risk)
- Cross-currency swap NPAs (related hedging instrument)

**Result:** User finds 95% of relevant NPAs, including ones they didn't know existed

---

### Real-World Example

**Scenario:** User searches "risk mitigation for high-notional deals"

**Keyword Search Results:**
```
Found 2 documents containing "risk mitigation" AND "high-notional"
- TSG2089 (mentioned both phrases)
- TSG1734 (mentioned both phrases)
```

**Semantic Search Results:**
```
Found 23 documents about managing risk in large deals:
- TSG2089 - "Risk mitigation for high-notional deals" (exact match)
- TSG1917 - "Hedging strategies for $25M+ transactions" (concept match)
- TSG2134 - "Collateral requirements for large exposures" (related concept)
- TSG1823 - "ROAE sensitivity for material deals" (related concept)
- TSG2044 - "Credit enhancement for BBB-rated counterparties" (related concept)
...
```

**Why Semantic is Better:**
- Understands "high-notional" = "large exposures" = "$25M+" = "material deals"
- Understands "risk mitigation" = "hedging" = "collateral" = "credit enhancement"
- Finds relevant content even with different phrasing

---

## Rich Contextual Results: What the Agent Returns

The KB Search Sub-Agent doesn't just return document IDs—it provides **actionable intelligence**.

### Standard Result Format

For each matching NPA, the agent returns:

**1. Identification & Similarity**
```
NPA ID: TSG1917
Title: FX Option on EUR/USD for ABC Corporation
Similarity Score: 94% (Very High Match)
Confidence: High (247 similar FX Options in database)
```

**2. Approval Outcome & Timeline**
```
Status: Approved
Submission Date: 2024-12-01
Approval Date: 2024-12-04
Total Timeline: 3 days
Loop-Backs: 0 (First-time approval)
```

**3. Department-Level Timeline**
```
Credit: 1.0 days (Jane Tan approved 2024-12-02)
Finance: 1.2 days (Mark Lee approved 2024-12-03)
Legal: 0.8 days (Sarah Chen approved 2024-12-02)
Operations: 0.6 days (Auto-approved via workflow)
Technology: 0.5 days (Auto-approved via workflow)
```

**4. Conditions Imposed**
```
Post-Approval Conditions:
- PIR required within 6 months (Status: Completed 2024-06-15)
- Quarterly risk reporting for first year (Status: Ongoing)

Sign-Off Conditions:
- Finance: ROAE sensitivity analysis required (Fulfilled)
- Credit: Counterparty financials review (Fulfilled)
```

**5. Key Product Details**
```
Product Type: FX Option (European style, cash-settled)
Underlying: EUR/USD currency pair
Notional: $25M USD
Tenor: 3 months (90 days)
Counterparty: ABC Corporation (BBB+ rating by S&P)
Desk: Singapore FX Desk
Location: Singapore
Risk Rating: Moderate
```

**6. Risk Assessment Summary**
```
Market Risk: Moderate (2.3% of desk book, VaR $180K)
Credit Risk: Low (BBB+ counterparty, daily collateral exchange)
Operational Risk: Low (standard settlement, existing system)
Liquidity Risk: Low (liquid EUR/USD market)

Key Excerpt:
"The $25M notional represents 2.3% of the desk's total FX book ($1.1B). Daily VaR is estimated at $180K (99% confidence, 1-day holding period). The EUR/USD currency pair has moderate volatility (historical 30-day vol: 8.5%)..."
```

**7. Lessons Learned / Insights**
```
What Went Well:
- Clean approval process (zero loop-backs)
- All approvers responded within 24 hours
- Standard ISDA documentation used (no special legal review)

What to Replicate:
- Pre-populated ROAE scenarios in initial submission (Finance appreciated this)
- Proactive engagement with Credit on counterparty rating (avoided delay)

Relevant for Your NPA:
- Your notional ($50M) is 2x this NPA → Expect Finance to ask similar ROAE questions
- Your counterparty rating (A-) is stronger → Credit should be faster
- Same currency pair (GBP/USD vs EUR/USD) → Risk profile comparable
```

**8. Link to Full Document**
```
[View Full NPA TSG1917] (Opens in new window)
[Download PDF] [View Approval Chain] [View PIR Report]
```

---

## Trend Analysis: Aggregating Insights Across Multiple NPAs

The KB Search Sub-Agent doesn't just find individual NPAs—it can analyze patterns across many NPAs.

### Trend Analysis Example 1: Product Type Performance

**User Query:** "How do FX Options typically perform in the approval process?"

**Agent Actions:**
1. Search for all FX Option NPAs (finds 347 from 2020-2025)
2. Aggregate statistics across all 347 NPAs
3. Generate insights

**Output:**
```
FX Option NPA Performance Analysis (347 NPAs, 2020-2025)

Approval Rate: 87% (302 approved, 45 rejected)
Average Timeline: 4.2 days
First-Time Approval Rate: 68% (234 approved first time, 68 required rework)

Timeline Distribution:
- <3 days: 23% (fast-track approvals)
- 3-5 days: 58% (typical)
- 6-10 days: 15% (slower)
- >10 days: 4% (delays/escalations)

Common Bottlenecks:
1. Finance (42% of delays) - ROAE analysis requests when notional >$20M
2. Legal (28% of delays) - Q4 year-end workload
3. Credit (18% of delays) - Counterparty rating <BBB

Success Factors (High First-Time Approval):
1. Pre-populated ROAE scenarios (+35% approval likelihood)
2. Strong counterparty rating (A- or above) (+28% approval likelihood)
3. Notional <$30M (+22% approval likelihood)
4. Singapore desk submission (+18% approval likelihood - strong track record)

Trend Over Time:
- 2020-2021: 91% approval rate, 3.8 days average
- 2022-2023: 88% approval rate, 4.1 days average
- 2024-2025: 84% approval rate, 4.5 days average
  → Tightening standards (likely due to new MAS 656 requirements in 2024)

Desk Performance:
- Singapore FX: 91% approval rate, 3.9 days
- Hong Kong FX: 82% approval rate, 4.8 days
- London FX: 79% approval rate, 5.2 days
```

**Use Case:** Maker wants to understand baseline expectations for FX Options

---

### Trend Analysis Example 2: Desk-Specific Performance

**User Query:** "How does Singapore FX Desk compare to other desks?"

**Agent Actions:**
1. Aggregate all Singapore FX Desk NPAs (finds 247)
2. Compare to Hong Kong Desk (185 NPAs) and London Desk (143 NPAs)
3. Generate comparative insights

**Output:**
```
Desk Comparison Analysis (2020-2025)

Singapore FX Desk (247 NPAs):
- Approval Rate: 91%
- Average Timeline: 3.9 days
- First-Time Approval: 72%
- Common Products: FX Options (45%), FX Forwards (32%), Cross-currency swaps (23%)

Hong Kong FX Desk (185 NPAs):
- Approval Rate: 82%
- Average Timeline: 4.8 days
- First-Time Approval: 64%
- Common Products: FX Options (38%), FX Forwards (41%), Structured FX (21%)

London FX Desk (143 NPAs):
- Approval Rate: 79%
- Average Timeline: 5.2 days
- First-Time Approval: 58%
- Common Products: FX Options (51%), FX Exotics (29%), Cross-currency swaps (20%)

Key Differences:
- Singapore has highest approval rate (91% vs 82% HK vs 79% London)
- Singapore fastest timeline (3.9 days vs 4.8 HK vs 5.2 London)
- Singapore highest first-time approval (72% vs 64% HK vs 58% London)

Possible Reasons:
- Singapore desk has most experience with NPA process (longest history)
- Singapore submissions typically include more detail upfront
- Singapore approvers (Credit/Finance) familiar with desk's products
- Hong Kong deals often involve cross-border booking (adds complexity)
- London deals more exotic/complex products (longer review time)

Recommendation:
Your NPA is from Singapore FX Desk → Higher likelihood of smooth approval based on desk track record
```

**Use Case:** Understanding desk-specific patterns

---

### Trend Analysis Example 3: Seasonal Patterns

**User Query:** "Is Q4 really slower for Legal approvals?"

**Agent Actions:**
1. Segment all NPAs by quarter (Q1, Q2, Q3, Q4)
2. Calculate Legal approval time for each quarter
3. Statistical significance test

**Output:**
```
Seasonal Pattern Analysis: Legal Department (2020-2025)

Legal Approval Time by Quarter:
- Q1: 0.9 days average (fast - fresh start after holidays)
- Q2: 1.0 days average (baseline)
- Q3: 1.1 days average (slightly slower - post-summer)
- Q4: 1.4 days average (significantly slower - year-end rush)

Q4 Delay Analysis:
- +0.5 days vs Q1 (56% slower)
- +0.4 days vs Q2 (40% slower)
- +0.3 days vs Q3 (27% slower)

Statistical Significance: p < 0.001 (highly significant, not random variance)

Root Causes (Q4 Delays):
1. Client deal rush (47% more NPAs submitted in Q4 vs Q1-Q3)
2. Year-end audit prep (Legal team pulled into compliance reviews)
3. Holiday season (fewer working days in December)

Recommendation:
Current date is December 15, 2025 (Q4) → Expect Legal to take ~1.4 days (vs typical 1.0 days)
Mitigation: Flag NPA as urgent if time-sensitive, or wait until Q1 2026 for faster turnaround
```

**Use Case:** Validating seasonal assumptions with data

---

## Integration with Other Agents

The KB Search Sub-Agent is a foundational utility used by almost every other agent:

### Integration 1: Product Ideation Agent

**When:** During Phase 0 conversational interview (Step 3: Similarity Search)

**Trigger:** User finishes describing product

**KB Search Action:**
1. Take product description from Product Ideation Agent
2. Perform semantic search
3. Return top 5 similar NPAs with enriched metadata
4. Product Ideation Agent presents results to user

**Data Flow:**
```
Product Ideation → "FX Option, $50M, BBB+, 6-month tenor"
       ↓
KB Search → Semantic search across 1,784 NPAs
       ↓
KB Search → Return [TSG1917 (94%), TSG1823 (88%), TSG2044 (82%)]
       ↓
Product Ideation → Display to user with insights
```

---

### Integration 2: Template Auto-Fill Engine

**When:** During auto-fill process (Step 1: Find Best Match)

**Trigger:** Template Auto-Fill needs source NPA for copying content

**KB Search Action:**
1. Receive product attributes from Template Auto-Fill
2. Search for highest similarity match (>90% threshold)
3. Return full NPA content (not just metadata, but actual text)
4. Template Auto-Fill copies/adapts content

**Data Flow:**
```
Template Auto-Fill → "Need source NPA for FX Option, BBB+, $50M"
       ↓
KB Search → Return TSG1917 (94% match) with full content
       ↓
Template Auto-Fill → Copy booking system, valuation model, risk assessment from TSG1917
```

---

### Integration 3: ML-Based Prediction Sub-Agent

**When:** During model training and inference

**Trigger:** ML model needs historical data for training or feature extraction

**KB Search Action:**
1. Retrieve all NPAs matching criteria (e.g., "All FX Options from 2022-2025")
2. Extract features: approval outcome, timeline, sign-off parties, conditions
3. Return structured dataset for ML training
4. ML model trains on this data

**Data Flow:**
```
ML Prediction → "Get all FX Option NPAs with outcome data"
       ↓
KB Search → Return 347 NPAs with [product_type, notional, rating, outcome, timeline]
       ↓
ML Prediction → Train XGBoost model on 347 examples
```

---

### Integration 4: Conversational Diligence Sub-Agent

**When:** User asks question during NPA creation

**Trigger:** User question requires factual answer from historical NPAs or policies

**KB Search Action:**
1. Receive natural language question from Conversational Diligence
2. Search KB for relevant content (NPAs + policy documents)
3. Return relevant excerpts with citations
4. Conversational Diligence generates answer using retrieved content

**Data Flow:**
```
User → "What collateral requirements apply for BBB+ counterparties?"
       ↓
Conversational Diligence → "Search KB for collateral + BBB+ counterparty"
       ↓
KB Search → Return 15 NPAs mentioning collateral requirements for BBB+ rating
       ↓
Conversational Diligence → "Daily collateral exchange required for BBB+ (source: TSG1917, TSG1823...)"
```

---

## Performance Targets

**Speed:**
- Search time: <2 seconds for semantic search across 1,784 NPAs
- Result assembly: <1 second for enriching metadata
- Total response time: <3 seconds from query to enriched results

**Accuracy:**
- Relevance score: >87% average (user rates results as "relevant")
- Recall: >92% (finds 92% of truly relevant NPAs)
- Precision: >85% (85% of returned results are actually relevant)

**Coverage:**
- Knowledge base size: 1,784+ historical NPAs (updated monthly)
- Document types: NPAs, policies, SOPs, regulatory documents
- Temporal range: 2020-2025 (5 years of history)

**User Satisfaction:**
- Usefulness rating: >4.3/5.0
- Time saved vs manual search: 43 minutes per search (45 min manual → 2 min with agent)

---

## Edge Cases and How the Agent Handles Them

### Edge Case 1: No Similar NPAs Found

**Scenario:** User's product is Credit Default Swap (MBS has never traded CDS)

**Challenge:** Semantic search returns zero results >80% similarity

**Agent Handling:**
- Lower similarity threshold: Accept matches >60% similarity
- Broaden search: Find most similar derivative products (Interest Rate Swaps, FX Options)
- Display message: "⚠️ No exact matches found (MBS has not traded CDS before). Showing most similar derivative products for reference."
- Suggest escalation: "This appears to be New-to-Group. Recommend engaging PAC for guidance."

---

### Edge Case 2: Too Many Results (Information Overload)

**Scenario:** User searches "FX products" → Returns 500+ NPAs

**Challenge:** User overwhelmed with results

**Agent Handling:**
- Automatic clustering: Group similar NPAs (FX Options, FX Forwards, FX Swaps)
- Display aggregated view:
  ```
  Found 512 FX Product NPAs:
  - FX Options: 347 NPAs (87% approval rate, 4.2 days avg)
  - FX Forwards: 165 NPAs (92% approval rate, 3.5 days avg)
  
  Showing top 10 most relevant:
  1. TSG1917 - FX Option (most similar to your search)
  2. TSG2044 - FX Forward (high approval rate)
  ...
  ```
- Filter options: "Narrow by desk, date range, approval outcome"

---

### Edge Case 3: Contradictory Results

**Scenario:** Search finds 2 similar NPAs with opposite outcomes
- TSG1917: FX Option, BBB+, $25M → Approved in 3 days
- TSG2134: FX Option, BBB+, $28M → Rejected (insufficient collateral)

**Challenge:** Which precedent to follow?

**Agent Handling:**
- Flag contradiction: "⚠️ Similar NPAs had different outcomes"
- Explain difference:
  ```
  TSG1917 (Approved):
  - Included daily collateral exchange in initial submission
  - Strong credit analysis upfront
  
  TSG2134 (Rejected):
  - No collateral arrangement proposed
  - Credit raised concerns on counterparty exposure
  
  Key Difference: Collateral arrangement
  Recommendation: Include collateral terms in your NPA to avoid TSG2134's rejection
  ```

---

## Continuous Improvement

### Learning Mechanism 1: User Feedback

After each search, user can rate results:
- 👍 "Helpful" → Reinforce this search pattern
- 👎 "Not helpful" → Investigate why

**Example:**
- User searches "currency hedge"
- KB returns FX Forward NPAs
- User rates 👎 "Not helpful"
- Root cause: User wanted Cross-currency swaps, not FX Forwards
- Learning: Add "cross-currency swap" to semantic equivalents for "currency hedge"

---

### Learning Mechanism 2: Click-Through Analysis

Track which results users actually click:
- Query: "FX Options"
- Results shown: [TSG1917, TSG1823, TSG2044, TSG2156, TSG2089]
- User clicks: TSG1917, TSG1823 (ignores others)

**Learning:** TSG1917 and TSG1823 are most useful for FX Option queries → Boost ranking

---

### Learning Mechanism 3: New Document Ingestion

As new NPAs are approved:
- Auto-ingest into knowledge base (monthly batch)
- Re-train semantic embeddings
- Update trend statistics

**Example:**
- January 2026: 23 new NPAs approved
- KB Search ingests all 23
- Total knowledge base: 1,784 → 1,807 NPAs
- Trend analysis updated: FX Option approval rate: 87% → 86% (slight decline)

---

## Conclusion: Why This Agent Is Critical

The KB Search Sub-Agent is the **institutional memory** of the NPA Workbench because it:

1. **Preserves Knowledge** - Every NPA ever done is searchable, preventing knowledge loss when people leave

2. **Accelerates Learning** - New Makers can instantly learn from 1,784 historical NPAs instead of starting from zero

3. **Ensures Consistency** - Precedents are automatically surfaced, promoting consistent decision-making

4. **Enables Intelligence** - Other agents (Template Auto-Fill, ML Prediction) depend on KB Search for their intelligence

5. **Reduces Risk** - By showing what worked and what didn't, reduces likelihood of repeating past mistakes

But here's the real magic: **Semantic search means you don't need to know the exact keywords to find what you need.** Search "currency hedge" and find "FX Forward." Search "risk mitigation" and find "collateral requirements." The agent understands meaning, not just words.

That's the power of RAG-based institutional memory.

---

**Next Deliverable:** Conversational Diligence Sub-Agent - How to answer user questions in real-time with contextual help and proactive guidance

---
