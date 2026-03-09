# Dify KB Architecture Strategy (FINAL)
## COO Multi-Agent Workbench - LLM-First, Zero-Code Business Logic

---

## Executive Summary

**Core Principle: "LLM Handles ALL Business Logic, Database Stores Only Data"**

This strategy uses:
- **Supabase:** Pure data storage (no business rules in DB)
- **Dify KBs:** ALL business logic + unstructured knowledge (LLM interprets everything)
- **Code:** ZERO business logic (only infrastructure: API, MCP, DB connections)

### The Critical Difference

**❌ Traditional Approach (Avoided):**
```python
# Classification logic in code
if notional_usd > 50000000 and is_cross_border:
    return "Full NPA"
elif notional_usd < 5000000:
    return "NPA Lite"
```

**✅ Our Approach (LLM-Powered):**
```
KB_Classification_Rules.md contains:
"If notional > $50M AND cross-border = TRUE, classify as Full NPA
 If notional < $5M, classify as NPA Lite
 If counterparty rating BBB- or below, classify as Full NPA..."

LLM reads KB → Interprets rules → Makes decision
```

### Benefits
- ✅ **Zero code changes** for business rule updates
- ✅ **Business users** can update rules (edit KB docs)
- ✅ **LLM reasoning** handles edge cases naturally
- ✅ **Explainable** decisions (LLM cites KB sources)
- ✅ **Flexible** - natural language rules, not rigid code

### What Goes Where

| Type | Example | Storage | Access Method |
|------|---------|---------|---------------|
| **Pure Data** | NPA metadata (product_type, notional, outcome) | Supabase | SQL queries |
| **Business Rules** | "If notional > $50M, require CEO approval" | Dify KB (text/markdown) | LLM reasoning |
| **Policy Text** | MAS 656 regulatory PDF | Dify KB | LLM RAG search |
| **Agent Instructions** | "You are Product Ideation Agent..." | Dify KB | LLM system prompt |
| **Templates** | NPA form template (Word doc) | Dify KB | LLM retrieval |

---

## Table of Contents

1. [Decision Framework: DB vs KB](#1-decision-framework-db-vs-kb)
2. [Revised KB Structure](#2-revised-kb-structure)
3. [Supabase Tables (Data Only)](#3-supabase-tables-data-only)
4. [Business Logic in KBs](#4-business-logic-in-kbs)
5. [Agent Access Patterns](#5-agent-access-patterns)
6. [Complete Agent Breakdown](#6-complete-agent-breakdown)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [KB Updates & Governance](#8-kb-updates--governance)

---

## 1. Decision Framework: DB vs KB

### The LLM-First Rule

```
┌───────────────────────────────────────────────────────────┐
│ DECISION TREE                                             │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ What type of information is this?                        │
│                                                           │
│ 1. PURE DATA (facts, no logic)                           │
│    Examples: NPA ID, notional, counterparty, outcome     │
│    → Supabase ✅                                         │
│    Why: Fast queries, filtering, aggregation            │
│                                                           │
│ 2. BUSINESS RULES (if/then logic, decisions)            │
│    Examples: Classification rules, approval thresholds  │
│    → Dify KB (as text/markdown) ✅                       │
│    Why: LLM interprets and applies rules                │
│    Format: Natural language or structured markdown      │
│                                                           │
│ 3. KNOWLEDGE (policies, procedures, explanations)       │
│    Examples: MAS 656 PDF, SOPs, agent instructions      │
│    → Dify KB ✅                                          │
│    Why: LLM searches and reasons over text              │
│                                                           │
│ 4. TEMPLATES (documents for generation)                 │
│    Examples: NPA form, credit memo template             │
│    → Dify KB ✅                                          │
│    Why: LLM retrieves and populates                     │
│                                                           │
│ ❌ NEVER: Business logic in code or DB triggers         │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Examples

| Data/Logic | Storage | Why |
|------------|---------|-----|
| NPA instance data: `{npa_id: "TSG1917", notional_usd: 25000000, desk: "Singapore FX"}` | Supabase | Pure facts, no interpretation needed |
| Classification rule: "If notional > $50M AND cross-border, then Full NPA" | Dify KB | LLM interprets and applies rule |
| Approval matrix: "FX Options $20M-$50M require: Credit + Finance + Legal" | Dify KB | LLM determines required approvers |
| State machine: "Valid transitions from Draft: → Pending_Classification or → Withdrawn" | Dify KB | LLM validates state changes |
| MAS 656 Section 4.2.3 (regulatory text) | Dify KB | LLM searches and cites |
| Historical NPA outcomes (1,784 NPAs: approved/rejected) | Supabase | Data for trends, filtering |

---

## 2. Revised KB Structure

### Overview: 27 Knowledge Bases Total (4 more than before)

```
TIER 1: GLOBAL KNOWLEDGE BASES (4 KBs)
├─ KB_Global_Regulatory_Policies (PDFs)
├─ KB_Global_Templates (Word/Excel docs)
├─ KB_Global_SOPs (procedural knowledge)
└─ KB_Global_Org_Hierarchy (org charts + text)

TIER 2: DOMAIN KNOWLEDGE BASES (13 KBs - increased!)
├─ NPA Domain (6 KBs - increased from 2!)
│  ├─ KB_NPA_Policies (policy PDFs)
│  ├─ KB_NPA_Classification_Rules (LLM-readable rules) ⭐ NEW
│  ├─ KB_NPA_Approval_Matrix (sign-off requirements) ⭐ NEW
│  ├─ KB_NPA_State_Machine (workflow logic) ⭐ NEW
│  ├─ KB_NPA_SOPs (15 SOPs)
│  └─ KB_NPA_Full_Documents (optional, 1,784 PDFs)
├─ Desk Support Domain (1 KB)
├─ DCE Domain (1 KB)
├─ ORM Domain (1 KB)
├─ BLA Domain (1 KB)
├─ SPM Domain (1 KB)
└─ BAP Domain (1 KB)

TIER 3: AGENT-SPECIFIC KNOWLEDGE BASES (10 KBs)
├─ KB_Master_COO_Orchestrator
├─ KB_Domain_Orchestrator_NPA
├─ KB_Ideation_Agent
├─ KB_Classification_Agent
├─ KB_Template_Autofill_Agent
├─ KB_Search_Agent
├─ KB_ML_Prediction
├─ KB_Conversational_Diligence
├─ KB_Governance_Agent
└─ KB_Risk_Agent

TOTAL: 27 KBs
```

**Key Change:** Business logic that was going to Supabase tables (`classification_rules`, `approval_matrix`, `state_machine_definitions`) now goes to **dedicated KBs** for LLM interpretation.

---

### TIER 1: Global KBs (Unchanged from previous version)

Same as before:
- KB_Global_Regulatory_Policies (180 MB)
- KB_Global_Templates (25 MB)
- KB_Global_SOPs (30 MB)
- KB_Global_Org_Hierarchy (15 MB)

---

### TIER 2: Domain KBs - NPA (6 KBs, increased from 2)

#### KB_NPA_Policies (Unchanged)
**Contents:** 6 policy PDFs (85 MB)

---

#### KB_NPA_Classification_Rules ⭐ NEW
**Purpose:** Classification logic for LLM to interpret (replaces Supabase `classification_rules` table)

**Contents:**
- `NPA_Classification_Rules.md` (structured markdown)

**Format:**
```markdown
# NPA Classification Rules

## Stage 1: Product Type Classification

### Rule: New to Group (NTG)
**Condition:** Product does not exist in current product catalog
**Classification:** NTG
**Confidence:** Check product_catalog table in Supabase
**Example:** Client requests "Crypto-backed derivatives" → Not in catalog → NTG

### Rule: Variation of Existing Product
**Condition:** Product exists but with different parameters
**Classification:** Variation
**Example:** FX Option exists, but client wants "barrier option" (new feature) → Variation

### Rule: Existing Product
**Condition:** Exact product match in catalog
**Classification:** Existing
**Example:** Standard FX Forward EUR/USD → Existing

---

## Stage 2: Approval Track Selection

### Rule 1: Prohibited Products (HARD STOP)
**Priority:** 1 (highest)
**Condition:** 
- Product type in prohibited list (check KB_Risk_Agent)
- OR Jurisdiction = sanctioned country
**Classification:** Prohibited
**Action:** Immediately reject, do not proceed

### Rule 2: Cross-Border Forces Full NPA
**Priority:** 2
**Condition:** is_cross_border = TRUE
**Classification:** Full NPA
**Required Approvers:** Credit + Finance + Legal + Operations + Technology
**Reasoning:** Cross-border NPAs involve FX risk, multiple regulatory jurisdictions

### Rule 3: High Notional Forces Full NPA
**Priority:** 3
**Condition:** notional_usd > $50,000,000
**Classification:** Full NPA
**Required Approvers:** Credit + Finance + Legal + (CEO if > $100M)
**Reasoning:** Large exposures require comprehensive risk assessment

### Rule 4: Low Credit Rating Forces Full NPA
**Priority:** 4
**Condition:** counterparty_rating in ["BBB-", "BB+", "BB", "BB-", "B+", "B", "B-"]
**Classification:** Full NPA
**Required Approvers:** Credit + Finance + Legal
**Reasoning:** Higher credit risk requires thorough due diligence

### Rule 5: Small Notional Qualifies for NPA Lite
**Priority:** 5
**Condition:** 
- notional_usd < $5,000,000
- AND counterparty_rating in ["AAA", "AA+", "AA", "AA-", "A+", "A", "A-"]
- AND is_cross_border = FALSE
**Classification:** NPA Lite
**Required Approvers:** Credit + Finance
**Reasoning:** Low risk, streamlined process

### Rule 6: Bundling Logic
**Priority:** 6
**Condition:** 
- User indicates multiple related products
- OR Products share same counterparty + similar tenor + similar structure
**Classification:** Bundling
**Action:** Group NPAs, single approval process
**Reasoning:** Operational efficiency, consistent risk assessment

### Rule 7: Evergreen Products
**Priority:** 7
**Condition:**
- Product type in ["Standard FX Forward", "Plain Vanilla IRS"]
- AND notional_usd < $10,000,000
- AND counterparty_rating >= "A-"
**Classification:** Evergreen (auto-approved if within limits)
**Required Approvers:** None (auto-approval)
**Limits Check:** Must not exceed monthly/annual limits (check Supabase)

---

## Edge Cases

### Edge Case 1: Multiple Rules Match
**Resolution:** Apply highest priority rule
**Example:** Cross-border ($30M, BBB+ counterparty)
- Rule 2 matches: Cross-border → Full NPA
- Rule 3 does NOT match: Notional < $50M
- Rule 4 does NOT match: Rating = BBB+ (not BBB- or below)
- **Result:** Full NPA (Rule 2)

### Edge Case 2: Confidence < 75%
**Action:** Escalate to human (NPA Champion)
**Example:** Product description vague, can't determine if NTG or Variation
- LLM flags: "Unable to classify with high confidence"
- Escalation triggered

### Edge Case 3: Contradictory Signals
**Action:** Default to most conservative (Full NPA)
**Example:** Small notional ($3M) but cross-border
- Rule 5 suggests: NPA Lite
- Rule 2 suggests: Full NPA
- **Result:** Full NPA (more conservative)
```

**Why KB, Not Database:**
- LLM can reason over natural language rules
- Easy updates (edit markdown, no code deploy)
- Handles edge cases flexibly
- Explainable (LLM cites specific rule)

**Size:** ~15 KB (one markdown file)

**Dify Settings:**
- Chunking: 800 tokens (preserve rule context)
- Top-K: 10 (retrieve multiple relevant rules)
- Similarity Threshold: 0.70

---

#### KB_NPA_Approval_Matrix ⭐ NEW
**Purpose:** Sign-off requirements for LLM to determine (replaces Supabase `approval_matrix` table)

**Contents:**
- `NPA_Approval_Matrix.md`

**Format:**
```markdown
# NPA Approval Matrix

## General Principles

1. **Cumulative Requirements:** If multiple rules match, combine all required approvers
2. **Parallel Approvals:** All approvers at same level work in parallel (not sequential)
3. **Escalation:** Higher thresholds add approvers, don't replace lower ones

---

## Approval Requirements by Product Type & Attributes

### FX Products (FX Forwards, FX Options, FX Swaps)

#### Tier 1: Small, Domestic, High Credit Quality
**Conditions:**
- Notional: < $5M
- Cross-border: NO
- Counterparty rating: A- or above

**Required Approvers:**
- Credit (Analyst level)
- Finance (Manager level)

**Timeline SLA:** 2 business days

---

#### Tier 2: Medium, Domestic, Good Credit Quality
**Conditions:**
- Notional: $5M - $50M
- Cross-border: NO
- Counterparty rating: BBB+ or above

**Required Approvers:**
- Credit (Senior Analyst)
- Finance (Senior Manager)
- Legal (if new counterparty or complex structure)

**Timeline SLA:** 4 business days

---

#### Tier 3: Large or Cross-Border
**Conditions:**
- Notional: > $50M
- OR Cross-border: YES

**Required Approvers:**
- Credit (VP or Regional Risk Head if > $50M)
- Finance (Head of Finance or CFO if > $100M)
- Legal (mandatory for cross-border)
- Operations (mandatory for cross-border)
- Technology (mandatory for cross-border)

**Additional:**
- CEO approval required if notional > $100M

**Timeline SLA:** 7 business days

---

#### Tier 4: High Risk
**Conditions:**
- Counterparty rating: BBB- or below
- OR Exotic structure (barrier options, digital options)

**Required Approvers:**
- Credit (Regional Risk Head, mandatory)
- Finance (Head of Finance, mandatory)
- Legal (mandatory)
- Risk Management (mandatory)

**Additional:**
- Group Risk Head approval if rating < BB-

**Timeline SLA:** 10 business days

---

### Interest Rate Products (IRS, Caps, Floors, Swaptions)

[Similar structure for rates products...]

---

### Credit Derivatives (CDS, TRS, CLN)

[Similar structure for credit products...]

---

## Special Cases

### Bundled NPAs
**Approvers:** Highest tier among bundled products
**Example:** Bundle of 5 FX Forwards ($3M each = $15M total)
- Individual: Tier 1 (Credit + Finance)
- Bundled: Tier 2 (Credit + Finance + Legal due to aggregate $15M)

### Evergreen Products
**Approvers:** None (auto-approved)
**Conditions:**
- Must be within pre-approved limits (check Supabase for current utilization)
- Monthly limit: $50M per desk
- Annual limit: $200M per desk

### Emergency Approvals
**Process:** Verbal approval + written confirmation within 24 hours
**Required:** At least 2 of {Credit VP, Finance VP, Legal VP}
**Follow-up:** Full NPA documentation within 5 business days

---

## Threshold Mapping

| Notional Range | Credit Approver | Finance Approver |
|----------------|-----------------|------------------|
| < $5M | Analyst | Manager |
| $5M - $20M | Senior Analyst | Senior Manager |
| $20M - $50M | VP | Head of Finance |
| $50M - $100M | Regional Risk Head | CFO |
| > $100M | Group Risk Head + CEO | CFO + CEO |

---

## Cross-Border Mandatory Approvers

All cross-border NPAs (regardless of size) require:
1. Credit (appropriate level based on notional)
2. Finance (appropriate level based on notional)
3. Legal (mandatory)
4. Operations (mandatory)
5. Technology (mandatory)

**Reasoning:** 
- Legal: Multi-jurisdiction contracts
- Operations: Cross-border settlement
- Technology: System connectivity across regions
```

**Why KB, Not Database:**
- Natural language rules easier to update
- LLM interprets complex conditions
- Handles "OR" / "AND" logic naturally
- Business users can edit without SQL knowledge

**Size:** ~25 KB

---

#### KB_NPA_State_Machine ⭐ NEW
**Purpose:** Workflow state transitions for LLM to validate (replaces Supabase `state_machine_definitions` + `state_transitions` tables)

**Contents:**
- `NPA_State_Machine.md`
- `NPA_State_Machine_Diagram.png` (visual)

**Format:**
```markdown
# NPA Workflow State Machine

## State Definitions

### Draft
**Description:** Initial state, Maker is filling out NPA form
**Allowed Actions:**
- Save progress
- Submit for classification
- Withdraw
**Who Can Access:** Maker (creator)

---

### Pending_Classification
**Description:** Automated classification in progress
**Allowed Actions:** None (system state)
**Duration:** < 30 seconds (automated)
**Next States:**
- → Classified_Full_NPA
- → Classified_NPA_Lite
- → Classified_Bundling
- → Classified_Evergreen
- → Prohibited (terminal)

---

### Classified_Full_NPA
**Description:** Classified as Full NPA, awaiting Maker confirmation
**Allowed Actions:**
- Confirm and proceed to approvals
- Challenge classification (goes to human review)
- Withdraw
**Who Can Access:** Maker
**Next States:**
- → Pending_Approvals (if confirmed)
- → Manual_Review (if challenged)
- → Withdrawn (terminal)

---

### Pending_Approvals
**Description:** Parallel approvals from Credit, Finance, Legal, etc.
**Allowed Actions:**
- Approvers: Approve / Reject / Request Changes
- Maker: Answer questions (via comments)
**Who Can Access:** Maker (read), Approvers (read/write)
**Next States:**
- → Approved (if all approve)
- → Rejected (if any reject)
- → Loop_Back_to_Maker (if changes requested)

---

### Loop_Back_to_Maker
**Description:** Approver requested changes/clarifications
**Allowed Actions:**
- Maker updates NPA
- Maker responds to comments
- Maker resubmits
**Who Can Access:** Maker (read/write), Approvers (read)
**Circuit Breaker:** If loop-back count >= 3, escalate to NPA Champion
**Next States:**
- → Pending_Approvals (after resubmission)
- → Escalated (if circuit breaker triggered)
- → Withdrawn

---

### Approved
**Description:** All approvers signed off
**Allowed Actions:**
- Maker: Download approval documentation
- System: Generate credit memo, update product catalog
**Who Can Access:** All (read-only)
**Next States:**
- → Live (if product goes live)
- → Archived (if product not launched)

---

### Rejected
**Description:** At least one approver rejected
**Allowed Actions:**
- Maker: View rejection reasons
- Maker: Create new NPA (learning from rejection)
**Who Can Access:** Maker (read), Approvers (read)
**Next States:** None (terminal state)

---

### Withdrawn
**Description:** Maker voluntarily withdrew NPA
**Next States:** None (terminal state)

---

### Prohibited
**Description:** Product flagged as prohibited by policy/regulation
**Allowed Actions:** None
**Next States:** None (terminal state, HARD STOP)

---

## Valid State Transitions

```
Draft
├─→ Pending_Classification (action: submit)
└─→ Withdrawn (action: withdraw)

Pending_Classification (automated)
├─→ Classified_Full_NPA
├─→ Classified_NPA_Lite
├─→ Classified_Bundling
├─→ Classified_Evergreen
└─→ Prohibited

Classified_Full_NPA
├─→ Pending_Approvals (action: confirm)
├─→ Manual_Review (action: challenge)
└─→ Withdrawn

Pending_Approvals
├─→ Approved (condition: all approve)
├─→ Rejected (condition: any reject)
├─→ Loop_Back_to_Maker (condition: changes requested)
└─→ Escalated (condition: timeout or complex issue)

Loop_Back_to_Maker
├─→ Pending_Approvals (action: resubmit)
├─→ Escalated (circuit breaker: loop count >= 3)
└─→ Withdrawn

Approved
├─→ Live (product launched)
└─→ Archived (product not launched)

Terminal States (no transitions):
- Rejected
- Withdrawn
- Prohibited
- Archived
- Live
```

---

## Business Rules

### Rule 1: Draft Timeout
**Condition:** NPA in Draft state for > 30 days
**Action:** Notify Maker, auto-withdraw after 45 days

### Rule 2: Approval SLA
**Condition:** Approver hasn't responded in SLA timeline
**Action:** 
- Send reminder at 75% of SLA
- Escalate to approver's manager at 100% of SLA

### Rule 3: Circuit Breaker (Loop-Back Limit)
**Condition:** Loop-back count >= 3
**Action:** Escalate to NPA Champion for manual intervention
**Reasoning:** Prevents infinite loops, indicates complex issue

### Rule 4: Parallel Approvals
**Condition:** NPA in Pending_Approvals state
**Action:** Send to ALL required approvers simultaneously (not sequential)
**Reasoning:** Faster processing (approvals in parallel, not waterfall)

### Rule 5: Conditional Approvals
**Condition:** Approver approves with conditions (e.g., "Approve if notional < $40M")
**Action:** 
- If condition met: Count as Approved
- If condition NOT met: Count as Loop-Back

---

## Edge Cases

### Edge Case 1: Approver Out of Office
**Action:** 
- Check approver's delegate (from org hierarchy)
- Route to delegate if > 3 days OOO
- Escalate to manager if no delegate

### Edge Case 2: Conflicting Approvals
**Example:** Credit approves, Finance rejects
**Resolution:** Overall status = Rejected (any reject = overall reject)

### Edge Case 3: Bundled NPAs
**State Machine:** One state machine for entire bundle
**Transition:** All NPAs in bundle move together

### Edge Case 4: Evergreen Auto-Approval
**Fast Track:** 
Draft → Pending_Classification → Classified_Evergreen → Approved (in < 1 minute)
**No Human Approvals:** System auto-approves if within limits
```

**Why KB, Not Database:**
- LLM can reason about state transitions
- Natural language rules for edge cases
- Easy to update workflow without changing code
- LLM can explain why transition is/isn't valid

**Size:** ~20 KB

---

#### KB_NPA_SOPs (Unchanged from original)
**Contents:** 15 SOP PDFs (45 MB)

---

#### KB_NPA_Full_Documents (Optional, unchanged)
**Contents:** 1,784 NPA PDFs (3.2 GB) - only if semantic search needed

---

### Other Domain KBs (Unchanged)
- Desk Support, DCE, ORM, BLA, SPM, BAP: 1 KB each

---

## 3. Supabase Tables (Data Only)

### Reduced to 12 Core Tables (down from 25!)

**Why Fewer Tables?**
- All business logic moved to KBs
- Database only stores facts, not rules

#### Core Data Tables

```
1. npa_instances
   - Pure NPA metadata: npa_id, title, product_type, notional_usd, 
     counterparty_name, desk, current_state, overall_status, dates
   - NO: classification logic, approval thresholds (moved to KBs)

2. npa_stage_history
   - Timeline tracking: stage, state, entered_at, exited_at, actor
   - Used for: Analytics, KPIs, audit trail

3. npa_approvals
   - Approval records: npa_id, department, approver, decision, 
     decision_date, comments
   - Used for: Tracking who approved, timeline

4. npa_comments
   - Loop-back comments: commenter, comment_text, comment_type, 
     is_resolved
   - Used for: Communication trail

5. npa_documents
   - Uploaded files: document_name, file_url, uploaded_by
   - Used for: File management

6. product_catalog
   - All T&M products: product_id, product_name, product_type, 
     asset_class
   - NO: Product rules (e.g., "requires legal approval") - moved to KBs

7. users
   - User profiles: user_id, name, email, department, role

8. departments
   - Org structure: dept_id, dept_name, head_of_dept

9. prohibited_products
   - Simple list: product_type, jurisdiction, reason
   - Used by: Risk Agent to check prohibitions
   - NOTE: Checking logic in KB, this is just data

10. regulatory_thresholds
    - MAS/CFTC limits: regulation, product_type, max_notional
    - Used by: Risk Agent to validate limits
    - NOTE: Interpretation logic in KB

11. audit_logs
    - System audit trail: user_id, action, timestamp

12. notifications
    - Notification queue: user_id, message, sent_at
```

**Removed Tables (logic moved to KBs):**
- ❌ `classification_rules` → KB_NPA_Classification_Rules
- ❌ `approval_matrix` → KB_NPA_Approval_Matrix
- ❌ `state_machine_definitions` → KB_NPA_State_Machine
- ❌ `state_transitions` → KB_NPA_State_Machine
- ❌ `loop_back_rules` → KB_NPA_State_Machine
- ❌ `bundling_groups` → LLM determines bundling in Classification Agent
- ❌ `npa_ml_predictions` → Optional, only if caching predictions

**Total Tables:** 12 (vs 25 in code-heavy approach)

---

## 4. Business Logic in KBs

### How LLM Interprets Rules

**Example: Classification Router Agent**

**Agent Prompt:**
```
You are the Classification Router Agent for NPA.

Your job: Classify NPAs in two stages:
1. Product Type: NTG / Variation / Existing
2. Approval Track: Full NPA / NPA Lite / Bundling / Evergreen / Prohibited

**How to classify:**
1. Read NPA attributes from Supabase (product_type, notional_usd, counterparty_rating, is_cross_border)
2. Query KB_NPA_Classification_Rules for applicable rules
3. Apply rules in priority order
4. If multiple rules match, use highest priority
5. If confidence < 75%, escalate to human
6. Return classification with reasoning

**Important:**
- ALWAYS cite which rule you applied (e.g., "Rule 2: Cross-Border Forces Full NPA")
- ALWAYS explain your reasoning
- NEVER hardcode logic - always refer to KB for rules
```

**User Input:**
```
Product: FX Option
Notional: $50M
Counterparty Rating: BBB+
Cross-Border: TRUE
Desk: Singapore FX
```

**LLM Workflow:**

1. **Query Supabase** for NPA data:
   ```sql
   SELECT * FROM npa_instances WHERE npa_id = 'TSG_NEW'
   ```
   Result: {product_type: "FX Option", notional_usd: 50000000, is_cross_border: true}

2. **Query KB_NPA_Classification_Rules**:
   ```
   RAG Query: "classification rules FX Option cross-border $50M"
   
   Retrieved Rules:
   - Rule 2: Cross-border forces Full NPA (priority 2)
   - Rule 3: Notional > $50M forces Full NPA (priority 3)
   ```

3. **LLM Reasoning**:
   ```
   Applying Rule 2 (priority 2): Cross-border = TRUE → Full NPA
   Rule 3 also matches (notional = $50M, at threshold), but Rule 2 has higher priority
   Rule 4 (low credit rating) does NOT match (BBB+ is not BBB- or below)
   
   Classification: Full NPA
   Reasoning: Cross-border products require comprehensive risk assessment 
              across multiple jurisdictions
   ```

4. **Query KB_NPA_Approval_Matrix** for required approvers:
   ```
   RAG Query: "approval requirements FX Option cross-border $50M"
   
   Retrieved:
   "Tier 3: Large or Cross-Border
    Required Approvers: Credit (VP), Finance (Head of Finance), 
                        Legal, Operations, Technology"
   ```

5. **LLM Output**:
   ```json
   {
     "stage1_classification": "NTG",
     "stage2_classification": "Full NPA",
     "required_approvers": ["Credit", "Finance", "Legal", "Operations", "Technology"],
     "approval_levels": {
       "Credit": "VP or Regional Risk Head",
       "Finance": "Head of Finance"
     },
     "reasoning": "Cross-border FX Option requires Full NPA process per Rule 2. 
                   Cross-border transactions involve multiple regulatory jurisdictions, 
                   FX exposure, and cross-border settlement complexity, requiring 
                   comprehensive review from Operations and Technology in addition 
                   to standard Credit/Finance/Legal approvals.",
     "source": "KB_NPA_Classification_Rules (Rule 2), KB_NPA_Approval_Matrix (Tier 3)",
     "confidence": 0.95
   }
   ```

**Key Points:**
- ❌ NO hardcoded logic: `if is_cross_border: return "Full NPA"`
- ✅ LLM reads KB, interprets rules, applies reasoning
- ✅ Explainable: Cites Rule 2, explains why
- ✅ Flexible: Can handle edge cases naturally

---

### Example 2: Governance Agent (State Validation)

**User Action:** Maker tries to move NPA from "Draft" to "Approved" (invalid shortcut)

**LLM Workflow:**

1. **Query Supabase** for current state:
   ```sql
   SELECT current_state FROM npa_instances WHERE npa_id = 'TSG1917'
   ```
   Result: "Draft"

2. **User Request:** Transition to "Approved"

3. **Query KB_NPA_State_Machine**:
   ```
   RAG Query: "valid transitions from Draft state"
   
   Retrieved:
   "Draft
    ├─→ Pending_Classification (action: submit)
    └─→ Withdrawn (action: withdraw)"
   ```

4. **LLM Reasoning**:
   ```
   Requested Transition: Draft → Approved
   Valid Transitions from Draft: Pending_Classification, Withdrawn
   
   Validation: INVALID
   Reasoning: Draft state can only transition to Pending_Classification 
              or Withdrawn. NPAs must go through classification and 
              approval workflow. Direct jump to Approved bypasses 
              required controls.
   ```

5. **LLM Output**:
   ```json
   {
     "transition_allowed": false,
     "error": "Invalid state transition: Draft → Approved",
     "explanation": "NPAs in Draft state must first be submitted for classification 
                     (Draft → Pending_Classification). They cannot skip directly 
                     to Approved state, as this bypasses required approvals.",
     "valid_next_states": ["Pending_Classification", "Withdrawn"],
     "source": "KB_NPA_State_Machine, Draft state definition",
     "suggested_action": "Submit NPA for classification first"
   }
   ```

**Key Points:**
- ❌ NO hardcoded state machine in database triggers
- ✅ LLM validates transitions by reading KB
- ✅ Provides helpful error messages with reasoning

---

## 5. Agent Access Patterns

### Pattern 1: Pure Data Query (Supabase Only)

**Example:** "How many NPAs did Singapore FX Desk submit in 2024?"

```
Agent: Conversational Diligence

Step 1: Recognize FACTUAL question (data, not logic)
Step 2: Query Supabase via MCP
  
  SQL:
  SELECT COUNT(*) 
  FROM npa_instances
  WHERE desk = 'Singapore FX'
    AND EXTRACT(YEAR FROM created_at) = 2024;
  
  Result: 47

Step 3: Return
  "Singapore FX Desk submitted 47 NPAs in 2024."

No KB needed (pure data query)
```

---

### Pattern 2: Business Rule Application (KB Primary)

**Example:** "Should this NPA go through Full NPA or NPA Lite?"

```
Agent: Classification Router

Step 1: Get NPA attributes from Supabase
  SQL:
  SELECT product_type, notional_usd, counterparty_rating, is_cross_border
  FROM npa_instances WHERE npa_id = 'TSG_NEW';
  
  Result: {FX Option, $30M, BBB+, cross-border=TRUE}

Step 2: Query KB_NPA_Classification_Rules
  RAG: "classification rules FX Option cross-border"
  
  Retrieved: Rule 2 (Cross-border → Full NPA)

Step 3: LLM applies rule
  "Cross-border = TRUE → Classify as Full NPA per Rule 2"

Step 4: Query KB_NPA_Approval_Matrix
  RAG: "approval requirements cross-border FX"
  
  Retrieved: Required approvers list

Step 5: Return
  {
    classification: "Full NPA",
    required_approvers: ["Credit", "Finance", "Legal", "Ops", "Tech"],
    reasoning: "Cross-border requires comprehensive review...",
    source: "Rule 2, KB_NPA_Classification_Rules"
  }

Performance: ~2s (Supabase 50ms + KB RAG 1.5s + LLM reasoning 500ms)
```

---

### Pattern 3: Hybrid (Data + Rules)

**Example:** "Find all rejected NPAs for BBB- counterparties and explain why Full NPA was required"

```
Agent: Conversational Diligence

Step 1: STRUCTURED query (Supabase)
  SQL:
  SELECT npa_id, product_type, notional_usd, counterparty_rating
  FROM npa_instances
  WHERE overall_status = 'Rejected'
    AND counterparty_rating = 'BBB-';
  
  Results: [TSG2134, TSG2089]

Step 2: For rejection reasons (Supabase)
  SQL:
  SELECT comment_text FROM npa_comments
  WHERE npa_id IN ('TSG2134', 'TSG2089')
    AND comment_type = 'Rejection';
  
  Results: "Credit: Counterparty exposure too high without collateral"

Step 3: BUSINESS RULE explanation (KB)
  Query KB_NPA_Classification_Rules:
    RAG: "why BBB- counterparty requires Full NPA"
  
  Retrieved: "Rule 4: Counterparty rating BBB- or below requires Full NPA 
              due to elevated credit risk requiring thorough due diligence"

Step 4: Combine and return
  "Found 2 rejected NPAs for BBB- counterparties:
   
   1. TSG2134 - FX Forward $30M
      • Classification: Full NPA (required due to BBB- rating per Rule 4)
      • Rejection Reason: Credit raised concerns about counterparty 
        exposure without collateral arrangement
      • Why Full NPA: BBB- counterparties have elevated credit risk 
        requiring comprehensive due diligence including detailed 
        credit analysis and collateral requirements
   
   2. TSG2089 - Interest Rate Swap $45M
      • [Similar format]
   
   📌 Source: KB_NPA_Classification_Rules (Rule 4), npa_comments table"

Performance: ~2.5s
```

---

## 6. Complete Agent Breakdown

### Classification Router (Critical Example)

**Data Sources:**
- **Supabase:** `npa_instances` (NPA attributes)
- **KB:**
  - KB_Classification_Agent (agent instructions)
  - KB_NPA_Classification_Rules (business rules)
  - KB_NPA_Approval_Matrix (sign-off requirements)

**Agent Prompt (System):**
```
You are the Classification Router Agent for NPA.

## Your Knowledge Sources
1. KB_Classification_Agent: Your instruction manual
2. KB_NPA_Classification_Rules: Business rules you must apply
3. KB_NPA_Approval_Matrix: Sign-off requirements
4. Supabase (via MCP): NPA data (product_type, notional, rating, etc.)

## Your Task
Given NPA attributes, classify in 2 stages:
- Stage 1: NTG / Variation / Existing
- Stage 2: Full NPA / NPA Lite / Bundling / Evergreen / Prohibited

## How to Work
1. Get NPA attributes from Supabase
2. Search KB_NPA_Classification_Rules for applicable rules
3. Apply highest-priority matching rule
4. Search KB_NPA_Approval_Matrix for required approvers
5. Return classification + approvers + reasoning + source citation

## Critical Rules
- NEVER hardcode logic - always refer to KB
- ALWAYS cite which rule (e.g., "Rule 2")
- If confidence < 75%, flag for human review
- If conflicting rules, use most conservative (Full NPA)
```

**Example Invocation:**

Input:
```json
{
  "npa_id": "TSG_NEW",
  "product_type": "FX Straddle",
  "notional_usd": 75000000,
  "counterparty_rating": "A-",
  "is_cross_border": false,
  "desk": "Singapore FX"
}
```

LLM Execution:
```
Step 1: Query Supabase for confirmation
  → MCP call: SELECT * FROM npa_instances WHERE npa_id='TSG_NEW'
  → Confirmed attributes

Step 2: Query KB_NPA_Classification_Rules
  → RAG: "classification FX Straddle $75M A- domestic"
  → Retrieved Rules:
      - Rule 3: Notional > $50M → Full NPA (priority 3)
      - Rule 5: Notional < $5M → NPA Lite (priority 5, doesn't apply)

Step 3: Apply Rule 3
  → Notional $75M > $50M threshold → Full NPA
  → High confidence (0.92)

Step 4: Query KB_NPA_Approval_Matrix
  → RAG: "approval FX $75M domestic A- rating"
  → Retrieved: "Tier 3: Large notional (> $50M)
                Required: Credit (Regional Risk Head), 
                          Finance (Head of Finance), 
                          Legal"

Step 5: Return classification
```

Output:
```json
{
  "stage1": "NTG",
  "stage2": "Full NPA",
  "required_approvers": [
    {"department": "Credit", "level": "Regional Risk Head"},
    {"department": "Finance", "level": "Head of Finance"},
    {"department": "Legal", "level": "VP"}
  ],
  "reasoning": "FX Straddle with $75M notional exceeds $50M threshold per Rule 3, requiring Full NPA process. Large notionals require comprehensive risk assessment including detailed credit analysis, financial impact evaluation, and legal review of documentation.",
  "rule_applied": "Rule 3: High Notional Forces Full NPA",
  "source": "KB_NPA_Classification_Rules (Rule 3), KB_NPA_Approval_Matrix (Tier 3)",
  "confidence": 0.92,
  "estimated_timeline": "7 business days",
  "flags": []
}
```

**Why This Works:**
- ✅ LLM reads business rules from KB (not hardcoded)
- ✅ Flexible: Can add new rules to KB without code changes
- ✅ Explainable: Cites specific rules
- ✅ Handles edge cases: LLM reasoning covers gaps in rules

---

### Governance Agent (State Machine Example)

**Data Sources:**
- **Supabase:** `npa_instances`, `npa_approvals`, `npa_stage_history`
- **KB:**
  - KB_Governance_Agent (orchestration logic)
  - KB_NPA_State_Machine (workflow rules)
  - KB_NPA_Approval_Matrix (parallel approval logic)

**Agent Prompt:**
```
You are the Governance Agent for NPA approval orchestration.

## Your Responsibilities
1. Enforce state machine (validate state transitions)
2. Orchestrate parallel approvals
3. Handle loop-backs
4. Enforce circuit breakers
5. Track timeline SLAs

## Your Knowledge
- KB_NPA_State_Machine: Valid states, transitions, business rules
- KB_NPA_Approval_Matrix: Who approves what
- Supabase: Current NPA state, approval records

## How You Work
When NPA state changes:
1. Validate transition is allowed (check KB_NPA_State_Machine)
2. If entering Pending_Approvals:
   - Get required approvers (KB_NPA_Approval_Matrix + Supabase)
   - Create approval tasks (parallel)
   - Send notifications
3. Monitor approvals (Supabase subscriptions)
4. If loop-back: Check circuit breaker (KB rules)
5. Update state when conditions met

CRITICAL: Never hardcode state transitions - always validate against KB
```

**Example: NPA Enters Pending_Approvals**

Input:
```
Event: NPA TSG1917 classified as Full NPA, Maker confirmed
Current State: Classified_Full_NPA
Requested Transition: → Pending_Approvals
```

LLM Execution:
```
Step 1: Validate transition (KB_NPA_State_Machine)
  → RAG: "valid transitions from Classified_Full_NPA"
  → Retrieved: "Classified_Full_NPA can transition to:
                - Pending_Approvals (if Maker confirms)
                - Manual_Review (if Maker challenges)
                - Withdrawn"
  → Validation: ✅ Transition allowed

Step 2: Get required approvers (KB_NPA_Approval_Matrix + Supabase)
  → Query Supabase:
      SELECT product_type, notional_usd, is_cross_border 
      FROM npa_instances WHERE npa_id='TSG1917'
    Result: {FX Option, $50M, cross_border=TRUE}
  
  → RAG KB_NPA_Approval_Matrix: "cross-border FX $50M approvers"
  → Retrieved: ["Credit (VP)", "Finance (Head of Finance)", 
                "Legal", "Operations", "Technology"]

Step 3: Create approval tasks (Supabase)
  → For each approver:
      INSERT INTO npa_approvals (npa_id, department, decision, requested_at)
      VALUES ('TSG1917', 'Credit', 'Pending', NOW());
    (Repeat for Finance, Legal, Operations, Technology)

Step 4: Send notifications (call Notification Agent)
  → Notify all 5 approvers in parallel

Step 5: Update NPA state (Supabase)
  → UPDATE npa_instances SET current_state='Pending_Approvals' 
    WHERE npa_id='TSG1917';

Step 6: Log transition (Supabase)
  → INSERT INTO npa_stage_history (npa_id, state, entered_at)
    VALUES ('TSG1917', 'Pending_Approvals', NOW());

Step 7: Set up monitoring
  → Subscribe to npa_approvals table (Supabase real-time)
  → When approval received, check if all complete
```

**When Approval Received:**
```
Event: Credit department approved TSG1917

LLM Check:
  → Query Supabase:
      SELECT COUNT(*) FROM npa_approvals 
      WHERE npa_id='TSG1917' AND decision='Pending'
    Result: 4 (Finance, Legal, Ops, Tech still pending)
  
  → Action: Wait (not all approvals received)
  
  → Query KB_NPA_Approval_Matrix for SLA:
      "Tier 3 Timeline SLA: 7 business days"
  
  → Calculate days elapsed:
      SELECT DATEDIFF(NOW(), MIN(requested_at)) 
      FROM npa_approvals WHERE npa_id='TSG1917'
    Result: 2 days
  
  → Action: No escalation needed (within SLA)
```

**When All Approvals Received:**
```
Event: Technology (last approver) approved

LLM Check:
  → Query: SELECT COUNT(*) FROM npa_approvals 
           WHERE npa_id='TSG1917' AND decision='Pending'
    Result: 0 (all approvals received!)
  
  → Check decision outcomes:
      SELECT decision FROM npa_approvals WHERE npa_id='TSG1917'
    Result: [Approved, Approved, Approved, Approved, Approved]
  
  → All approved! Transition to Approved state
  
  → Query KB_NPA_State_Machine:
      "valid transitions from Pending_Approvals"
    Retrieved: "→ Approved (if all approve)"
    Validation: ✅ Allowed
  
  → Update state:
      UPDATE npa_instances SET current_state='Approved', 
                               overall_status='Approved',
                               completed_at=NOW()
      WHERE npa_id='TSG1917';
  
  → Notify Maker: "Your NPA TSG1917 has been approved!"
```

**Why This Works:**
- ✅ State machine in KB (not hardcoded)
- ✅ LLM validates all transitions
- ✅ Business users can update workflow by editing KB
- ✅ Handles edge cases (circuit breakers, SLA escalations)

---

## 7. Implementation Roadmap

### Phase 1: KB Creation (Week 1-2)

**Goal:** Create all 27 KBs

**TIER 1 (Week 1):**
1. ✅ KB_Global_Regulatory_Policies (6 PDFs, 180 MB)
2. ✅ KB_Global_Templates (15 files, 25 MB)
3. ✅ KB_Global_SOPs (6 PDFs, 30 MB)
4. ✅ KB_Global_Org_Hierarchy (4 files, 15 MB)

**TIER 2 (Week 1-2):**

**NPA Domain (6 KBs):**
5. ✅ KB_NPA_Policies (6 PDFs, 85 MB)
6. ✅ **KB_NPA_Classification_Rules** (create from scratch)
   - Create: `NPA_Classification_Rules.md`
   - Include: Stage 1 & 2 rules, priorities, edge cases
   - Size: ~15 KB
7. ✅ **KB_NPA_Approval_Matrix** (create from scratch)
   - Create: `NPA_Approval_Matrix.md`
   - Include: Tiers, thresholds, cross-border rules
   - Size: ~25 KB
8. ✅ **KB_NPA_State_Machine** (create from scratch)
   - Create: `NPA_State_Machine.md` + diagram
   - Include: States, transitions, business rules
   - Size: ~20 KB
9. ✅ KB_NPA_SOPs (15 PDFs, 45 MB)
10. ⚠️ KB_NPA_Full_Documents (OPTIONAL, 1,784 PDFs, 3.2 GB)

**Other Domains (Week 2):**
11-16. ✅ Create 1 KB each for: Desk Support, DCE, ORM, BLA, SPM, BAP

**TIER 3 (Week 2):**
17-27. ✅ Upload KB_*.md files (10 agent instruction files)

**Deliverable:** 27 fully configured KBs

---

### Phase 2: Supabase Setup (Week 3)

**Goal:** Create 12 core data tables

**Tasks:**
1. ✅ Create tables (no business logic triggers!)
   - npa_instances, npa_stage_history, npa_approvals, etc.
2. ✅ Set up Row-Level Security (RLS)
3. ✅ Create indexes for performance
4. ✅ Seed reference data:
   - Product catalog (361 products)
   - Prohibited products (8 entries)
   - Regulatory thresholds (12 entries)
5. ✅ Test queries

**Deliverable:** Working Supabase database (data only, no logic)

---

### Phase 3: MCP Server (Week 4)

**Goal:** Enable Dify agents to query Supabase

**Tasks:**
1. ✅ Build Python FastAPI MCP server
   - `/query` endpoint (generic)
   - `/query/sql` endpoint (custom SQL)
2. ✅ Deploy (Docker + Cloud Run)
3. ✅ Register in Dify
4. ✅ Test agent → MCP → Supabase flow

**Deliverable:** Working MCP integration

---

### Phase 4: Agent Creation (Week 5-6)

**Goal:** Build 10 NPA Sub-Agents

**Critical Focus:** System prompts that emphasize KB usage

**Agent Template (System Prompt):**
```
You are the [Agent Name] for NPA.

## Your Knowledge Sources
1. KB_[Agent]_Agent: Your instruction manual
2. KB_NPA_[Business Rules]: Rules you must apply
3. Supabase (via MCP): Data only (no logic)

## How You Work
1. For business decisions: Query relevant KB for rules
2. For data retrieval: Query Supabase via MCP
3. NEVER hardcode business logic
4. ALWAYS cite KB sources
5. If uncertain, ask user or escalate

## Example
User asks: "Should this be Full NPA or Lite?"
- Query Supabase: Get NPA attributes
- Query KB_NPA_Classification_Rules: Get classification rules
- Apply rules (highest priority first)
- Return classification + reasoning + source citation
```

**Agents to Build:**
1. ✅ Classification Router (uses KB_NPA_Classification_Rules)
2. ✅ Governance Agent (uses KB_NPA_State_Machine, KB_NPA_Approval_Matrix)
3. ✅ Product Ideation
4. ✅ Template Auto-Fill
5. ✅ KB Search
6. ✅ ML Prediction
7. ✅ Conversational Diligence
8. ✅ Risk Agent
9. ✅ NPA Domain Orchestrator
10. ✅ Master COO Orchestrator

**Deliverable:** 10 fully functional agents

---

### Phase 5: Testing (Week 7-8)

**Goal:** Validate LLM correctly interprets business rules

**Test Cases:**

**Test 1: Classification Rules**
```
Input: {FX Option, $75M, BBB+, cross-border=TRUE}
Expected: Full NPA, approvers=[Credit VP, Finance Head, Legal, Ops, Tech]
Validation:
  ✅ LLM applies Rule 2 (cross-border)
  ✅ Cites KB_NPA_Classification_Rules
  ✅ Returns correct approvers from KB_NPA_Approval_Matrix
```

**Test 2: State Transition**
```
Input: NPA in Draft, user requests → Approved
Expected: REJECT (invalid transition)
Validation:
  ✅ LLM queries KB_NPA_State_Machine
  ✅ Identifies invalid transition
  ✅ Suggests correct path (Draft → Pending_Classification)
```

**Test 3: Rule Update**
```
Action: Edit KB_NPA_Classification_Rules.md
  - Add new rule: "Notional > $200M requires CEO approval"
  - Re-upload to Dify
Input: {FX Option, $250M, A-, domestic}
Expected: LLM applies new rule, requires CEO approval
Validation:
  ✅ No code changes needed
  ✅ LLM immediately uses updated rule
  ✅ Cites new rule in reasoning
```

**Deliverable:** Test report (accuracy >90%)

---

## 8. KB Updates & Governance

### Business Rule Updates (No Code Needed!)

**Process:**
1. Business analyst identifies rule change
2. Edit KB markdown file (e.g., KB_NPA_Classification_Rules.md)
3. Upload to Dify (via UI or API)
4. LLM immediately uses new rule

**Example: Adding a New Classification Rule**

**Current Rule (in KB):**
```markdown
### Rule 3: High Notional Forces Full NPA
**Priority:** 3
**Condition:** notional_usd > $50,000,000
**Classification:** Full NPA
```

**Business Need:** "We need CEO approval for NPAs > $200M"

**Update (edit markdown):**
```markdown
### Rule 3: High Notional Forces Full NPA
**Priority:** 3
**Condition:** notional_usd > $50,000,000
**Classification:** Full NPA

### Rule 3a: Very High Notional Requires CEO  ⭐ NEW
**Priority:** 3a (applied after Rule 3)
**Condition:** notional_usd > $200,000,000
**Additional Approver:** CEO (in addition to standard approvers)
**Classification:** Full NPA (escalated)
**Reasoning:** Exposures > $200M represent significant capital allocation
```

**Deploy:**
```bash
# Upload to Dify via API (or use Dify UI)
curl -X POST https://api.dify.ai/v1/datasets/{kb_id}/documents \
  -H "Authorization: Bearer $DIFY_API_KEY" \
  -F "file=@KB_NPA_Classification_Rules.md"
```

**Result:** Classification Router immediately applies new rule (no code deploy!)

---

### Version Control for KBs

**Recommended:**
- Store all KB markdown files in Git repository
- Use GitHub/GitLab for version control
- CI/CD pipeline auto-uploads to Dify on commit

**Git Workflow:**
```bash
# Edit rule
vim KB_NPA_Classification_Rules.md

# Commit with clear message
git add KB_NPA_Classification_Rules.md
git commit -m "Added CEO approval requirement for NPAs > $200M"
git push

# GitHub Actions auto-uploads to Dify
# (see CI/CD workflow in original doc)
```

**Benefits:**
- ✅ Full audit trail (who changed what, when)
- ✅ Rollback capability (git revert)
- ✅ Code review process (pull requests)
- ✅ Automatic deployment (CI/CD)

---

### Governance Process

**Who Can Update Business Rules?**

| KB Type | Who Can Edit | Approval Required |
|---------|--------------|-------------------|
| Classification Rules | Product Manager | Head of Product (peer review) |
| Approval Matrix | COO or Head of Finance | COO + Head of Risk |
| State Machine | Operations Lead | COO |
| Agent Instructions | Development Team | Tech Lead |
| Policy PDFs | Compliance Team | Chief Compliance Officer |

**Process:**
1. Requester edits KB file (in Git)
2. Creates pull request
3. Approver reviews changes
4. If approved: Merge → CI/CD deploys to Dify
5. If rejected: Requester revises

**Critical:** No code changes needed, business users can update rules!

---

## Summary

### Final Architecture

```
┌──────────────────────────────────────────────────────┐
│ DIFY AGENTS                                          │
│ • Classification Router                              │
│ • Governance Agent                                   │
│ • Product Ideation                                   │
│ • ... (10 total)                                     │
└────────────┬─────────────────────────────────────────┘
             │
             ├─────────────────┬──────────────────────┐
             │                 │                      │
             ↓                 ↓                      ↓
┌────────────────────┐ ┌──────────────┐ ┌────────────────────┐
│ DIFY KBs (27)      │ │ MCP SERVER   │ │ SUPABASE (12 tables)│
│                    │ │              │ │                    │
│ TIER 1: Global (4) │ │ Python       │ │ Pure Data:         │
│ • Policies         │ │ FastAPI      │ │ • npa_instances    │
│ • Templates        │ │              │ │ • npa_approvals    │
│ • SOPs             │ │ Translates   │ │ • npa_comments     │
│ • Org Charts       │ │ agent calls  │ │ • product_catalog  │
│                    │ │ to SQL       │ │ • ... (8 more)     │
│ TIER 2: Domain (13)│ │              │ │                    │
│ NPA (6 KBs):       │ │              │ │ ❌ NO LOGIC:       │
│ • Policies ✅      │ │              │ │ • No triggers      │
│ • Classification   │ │              │ │ • No stored procs  │
│   Rules ⭐         │ │              │ │ • No business rules│
│ • Approval         │ │              │ │                    │
│   Matrix ⭐        │ │              │ └────────────────────┘
│ • State Machine ⭐ │ │              │
│ • SOPs ✅          │ │              │
│ • Full Docs ⚠️     │ │              │
│                    │ │              │
│ Other domains:     │ │              │
│ 1 KB each (7)      │ │              │
│                    │ │              │
│ TIER 3: Agents(10) │ │              │
│ • KB_*.md files    │ │              │
│                    │ │              │
│ ALL BUSINESS LOGIC │ │              │
│ LIVES HERE ✅      │ │              │
└────────────────────┘ └──────────────┘
```

### Key Metrics

| Metric | Value |
|--------|-------|
| **Total KBs** | 27 (vs 23 in previous version) |
| **KB Storage** | ~900 MB (vs ~750 MB, added business rules) |
| **Supabase Tables** | 12 (vs 25, removed logic tables) |
| **Hardcoded Logic** | ZERO ✅ |
| **Business Rule Update Time** | < 5 minutes (edit KB + upload) |
| **Code Deployment for Rule Changes** | ZERO ✅ |

### Critical Success Factors

✅ **ALL business logic in KBs** (classification, approvals, state machine)
✅ **LLM interprets rules** (no hardcoded if/then)
✅ **Business users can update** (edit markdown, no coding)
✅ **Version controlled** (Git for all KB files)
✅ **Explainable decisions** (LLM cites KB sources)
✅ **Supabase = data only** (no triggers, no stored procedures)

**You're ready to build a truly LLM-powered, zero-code business logic system!** 🚀
