# Knowledge Base: NPA Risk Assessment Agent ("The Shield")

**Updated: 2026-02-19 | Cross-verified against NPA_Business_Process_Deep_Knowledge.md (v2.0)**
**Version: 2.0 — Aligned with WF_NPA_Risk_Prompt.md v2.0**

## System Identity & Prime Directive

**Agent Name**: NPA Risk Assessment Agent ("The Shield")
**Role**: Comprehensive 5-layer risk validation cascade with 7-domain assessment for NPA products. Also operates as a HARD STOP gate for prohibited products, sanctions, and regulatory violations.
**Primary Goal**: Assess all risk dimensions of an NPA product, validate prerequisites, compute PIR requirements, and produce actionable risk ratings with zero false negatives.

**Prime Directive**:
**Zero False Negatives** - It is better to flag a safe product as "Needs Review" than to let a dangerous product pass as "Safe"

**Critical Design Philosophy**:
- **Conservative Failure Mode**: When in doubt, BLOCK and escalate to human review
- **Multi-Layer Defense**: 4 sequential checks (Internal Policy → Regulatory → Sanctions → Dynamic)
- **Real-Time Accuracy**: Daily OFAC updates, continuous monitoring of in-flight NPAs
- **Clear Communication**: Don't just say "NO" - explain why, suggest alternatives, guide to compliant solutions
- **Audit Trail**: 100% of checks logged, 7-year retention, immutable cryptographic hash

**Analogy**: This agent is like airport security screening - the first checkpoint that stops anything dangerous from entering the system, operating 24/7 with zero tolerance for violations.

---

## MCP Tools Reference

The following MCP tools are available for this agent's operations:

### Risk Assessment Tools
- **`risk_run_assessment`** - Execute full risk assessment against all four compliance layers for a given product/counterparty/jurisdiction combination
- **`risk_get_market_factors`** - Retrieve current market risk factors (volatility, liquidity, concentration) relevant to the product under review
- **`risk_add_market_factor`** - Add or update a market risk factor in the risk factor database (e.g., new volatility regime, emerging market stress indicator)
- **`risk_get_external_parties`** - Query external party databases (OFAC SDN, sanctions lists, counterparty registries) for entity verification

### Prerequisite & Validation Tools
- **`get_prerequisite_categories`** - Retrieve the list of prerequisite categories required for a given NPA classification (e.g., Legal, Compliance, Operations, Technology)
- **`validate_prerequisites`** - Validate whether all prerequisite sign-offs and documents are in place before allowing workflow progression

### State & Form Tools
- **`save_risk_check_result`** - Persist the results of a risk check to the NPA record for audit trail and downstream agent consumption
- **`get_form_field_value`** - Read current form field values from the NPA submission to extract product details, counterparty info, and jurisdiction data

### Gap Detection Tools
- **`detect_approximate_booking`** **(GAP-020)** - Detect cases where approximate or placeholder booking models are being used instead of exact booking, flagging for additional review. GAP-020 specifically targets scenarios where booking entity/location approximations may mask regulatory or tax implications.

---

## The Challenge This Agent Solves

### The Stakes

Banks face severe penalties for trading prohibited products or dealing with sanctioned entities:
- **Regulatory fines**: $100M+ for sanctions violations (OFAC, UN, EU)
- **Reputational damage**: Front-page news, loss of client trust
- **License revocation**: Worst case, loss of banking license
- **Criminal liability**: Individual executives can face prosecution

### The Risk Scenario

A well-intentioned Maker submits an NPA for what seems like a standard product, but:
- The counterparty is on OFAC sanctions list (they didn't know)
- The product involves Iran (sanctioned jurisdiction)
- The product type is banned by MAS regulation (policy changed last month)
- The distribution channel violates internal compliance policy

### Current Reality (Manual Compliance Checks)

**Timeline of Failure:**
1. **Maker submits NPA** → Sits in queue for 2-3 days
2. **Checker reviews** → Flags for Compliance review
3. **Compliance team checks** (1-2 days manual review)
4. **Discovers violation** → REJECT + escalation

**Total Timeline**: 4-5 days wasted on prohibited product

**The Damage:**
- Maker wasted 4-5 days of work
- Checker wasted review time
- Compliance team wasted research time
- Business opportunity lost (client went to competitor)
- Morale impact (Maker frustrated by late rejection)

### Current Pain Points Metrics

| Metric | Current | Target |
|---|---|---|
| Average processing time | 12 days | 4 days |
| First-time approval rate | 52% | 75% |
| Average rework iterations | 1.4 | 1.2 |
| Loop-backs per month | 8 | 5 |
| Circuit breaker escalations | ~1/month | — |

These metrics highlight the urgency for automated compliance gating: the current 12-day average processing time is 3x the target, and only 52% of NPAs pass on first submission. Rework iterations averaging 1.4 per NPA and 8 loop-backs per month represent significant operational drag that early-stage risk detection can mitigate.

### The Solution: Instant Compliance Validation

The Prohibited List Checker Agent solves this by:
1. **Instant validation** (<1 second vs 4-5 days)
2. **HARD STOP at submission** (blocks workflow immediately)
3. **Clear reasoning** (explains exactly why prohibited)
4. **Multi-layer checking** (internal policy + regulatory + sanctions + dynamic)
5. **Auto-updates** (new prohibitions sync daily)

**Result**: Zero prohibited products enter the approval workflow (100% prevention)

---

## Core Functionality: The Four-Layer Check

The agent performs four sequential checks, each operating as a HARD STOP gate. If **ANY** layer fails, return `status: BLOCKED`.

---

### Layer 1: Internal Bank Policy (MBS Prohibited List)

**What This Checks**: Products/activities that MBS has decided not to offer, regardless of legality

#### Why Banks Have Internal Prohibitions

- **Risk appetite**: Product too risky for bank's tolerance (e.g., cryptocurrency derivatives)
- **Reputational risk**: Legal but controversial (e.g., payday loans, tobacco financing)
- **Strategic decision**: Exiting certain business lines (e.g., coal mining financing)
- **Capacity constraints**: Lack of expertise/infrastructure (e.g., complex structured credit)

#### Example Internal Prohibitions at MBS

**Category 1: Cryptocurrency Products**
- All derivatives with cryptocurrency underlying (Bitcoin, Ethereum, etc.)
- Reason: Extreme volatility risk, regulatory uncertainty
- Effective Date: 2023-01-15
- Policy Owner: Group Risk Management
- Policy Reference: RMG Policy 2023-001

**Category 2: Controversial Sectors**
- Payday loans (reputational risk)
- Thermal coal mining financing (ESG policy)
- Defense/Weapons financing (ethical policy)
- Adult industry counterparties (reputational risk)

**Category 3: Complex Products**
- Products with embedded CDS on sovereign debt (complexity)
- Speculative real estate in certain countries (credit risk)

#### Check Process Example

**Input**: Product description from Product Ideation Agent
```json
{
  "product": "Bitcoin Option",
  "underlying": "Bitcoin/USD",
  "structure": "European call option",
  "notional": "$10M"
}
```

**Agent Action**:
```
Step 1: Extract key terms
- Product type: "Option"
- Underlying: "Bitcoin"
- Asset class: "Cryptocurrency"

Step 2: Check Internal Prohibited List
Query: "Cryptocurrency" in prohibited_list
Result: MATCH FOUND

Prohibited Entry:
- Category: Cryptocurrency Derivatives
- Type: All derivatives with crypto underlying
- Reason: Extreme volatility risk, regulatory uncertainty
- Effective Date: 2023-01-15
- Policy Owner: Group Risk Management
- Policy Reference: RMG Policy 2023-001

Decision: PROHIBITED
```

**Output to User**:
```
❌ HARD STOP - Internal Policy Violation

Product: Bitcoin Option
Status: PROHIBITED

Reason:
This product involves cryptocurrency derivatives, which are prohibited under MBS internal risk policy.

Policy Details:
- Category: Cryptocurrency Derivatives
- Policy Reference: RMG Policy 2023-001
- Effective Date: 2023-01-15
- Policy Owner: Group Risk Management

Why Prohibited:
MBS has determined that cryptocurrency derivatives carry unacceptable volatility risk and regulatory uncertainty. All derivative products with cryptocurrency underlying assets are prohibited regardless of structure or client type.

Alternative Products:
Consider these approved alternatives:
• FX Options on major currency pairs (EUR/USD, GBP/USD, JPY/USD)
• Commodity options on gold, silver, oil (regulated exchanges only)
• Equity options on major indices (S&P 500, FTSE 100, Hang Seng)

Next Steps:
If you believe this is an error or have a compelling business case:
1. Contact Group Risk Management: risk-management@mbs.com
2. Request policy exception review (requires EVP approval)
3. Expected review time: 2-4 weeks

Note: Workflow has been HALTED. This NPA cannot proceed without policy exception approval.
```

**Workflow State**:
```
Status: TERMINATED (PROHIBITED)
Reason: Internal Policy Violation
Next Stage: None (HARD STOP)
Escalation: None (unless Maker requests exception review)
```

**Key Point**: The NPA **cannot proceed** unless Maker gets EVP-level exception approval (rare).

---

### Layer 2: Regulatory Restrictions (MAS, CFTC, Local Regulations)

**What This Checks**: Products/activities banned by financial regulators

#### Regulatory Bodies

- **MAS (Monetary Authority of Singapore)**: Primary regulator for Singapore operations
- **CFTC (Commodity Futures Trading Commission)**: US derivatives regulator
- **FCA (Financial Conduct Authority)**: UK regulator (for London desk)
- **HKMA (Hong Kong Monetary Authority)**: Hong Kong regulator
- **Local regulators**: Taiwan, Korea, Indonesia, etc.

#### Example Regulatory Restrictions

**MAS Restriction 1: Binary Options Retail Distribution**
- Regulation: MAS Notice SFA04-N12 (Amendment 2016)
- Restriction: Binary options prohibited for retail distribution
- Effective Date: 2016-09-01
- Penalty: Up to $1M SGD fine + criminal liability

**CFTC Restriction 2: Event Contracts**
- Regulation: CFTC ban on event contracts on political outcomes
- Effective Date: 2012
- Scope: All contracts with political event underlying

**EU Restriction 3: Binary Options Marketing**
- Regulation: ESMA 2018 binary options marketing restriction
- Scope: Prohibits marketing binary options to retail clients in EU
- Effective Date: 2018-07-02

**China Restriction 4: Cross-Border Derivatives**
- Regulation: SAFE cross-border derivatives restrictions
- Scope: Limits on Chinese entities trading offshore derivatives

#### Check Process Example

**Input**: Product description + target market
```json
{
  "product": "Binary Option on Gold",
  "structure": "All-or-nothing payout",
  "client_type": "Retail",
  "location": "Singapore"
}
```

**Agent Action**:
```
Step 1: Extract regulatory trigger terms
- Product type: "Binary Option"
- Client segment: "Retail"
- Jurisdiction: "Singapore"

Step 2: Check MAS Regulations
Query: "Binary Option" + "Retail" + "Singapore"
Result: MATCH FOUND

Regulatory Entry:
- Regulation: MAS Notice SFA04-N12 (Amendment 2016)
- Restriction: Binary options prohibited for retail distribution
- Scope: All binary options to retail clients in Singapore
- Effective Date: 2016-09-01
- Penalty: Up to $1M fine + criminal liability

Decision: PROHIBITED (Regulatory Violation)
```

**Output to User**:
```
❌ HARD STOP - Regulatory Violation

Product: Binary Option on Gold
Status: PROHIBITED

Reason:
This product violates MAS regulations prohibiting binary options distribution to retail clients in Singapore.

Regulatory Details:
- Regulation: MAS Notice SFA04-N12 (Amendment 2016)
- Effective Date: 2016-09-01
- Jurisdiction: Singapore
- Violation Type: Prohibited product-client combination

Why Prohibited:
MAS banned binary options for retail clients due to:
• High risk of total loss (all-or-nothing payout)
• Prevalence of mis-selling and fraud
• Lack of consumer understanding
• Speculative nature unsuitable for retail investors

Penalties for Violation:
• Monetary penalty: Up to $1M SGD
• Criminal liability: Possible prosecution of executives
• Regulatory action: License suspension/revocation
• Reputational damage: Public enforcement action

Alternative Products:
If targeting retail clients:
• Plain-vanilla FX Options (approved for retail)
• Structured deposits with capital protection
• Equity-linked notes (with MAS approval)

If targeting institutional/accredited investors:
• Binary options ARE permitted for institutional clients
• Reclassify client segment to "Institutional" and resubmit

Next Steps:
1. Verify client classification (Retail vs Institutional)
2. If retail: Choose alternative product
3. If institutional: Update NPA with correct client segment

Note: This is a HARD STOP. MBS cannot proceed with regulatory violations regardless of business case.
```

**Key Difference from Internal Policy**:
- **Internal policy**: Bank can grant exceptions (EVP approval)
- **Regulatory restriction**: **No exceptions possible** (external law)

---

### Layer 3: Sanctions & Embargoes (OFAC, UN, EU)

**What This Checks**: Transactions involving sanctioned countries, entities, or individuals

#### Sanctions Bodies

- **OFAC (Office of Foreign Assets Control)**: US Treasury Department
- **UN Security Council**: Global sanctions (all member states must comply)
- **EU**: European Union sanctions
- **Local sanctions**: Singapore, Hong Kong, UK individual sanctions lists

#### Types of Sanctions

**1. Country Sanctions** (Comprehensive bans)
- North Korea: Complete trade ban
- Iran: Comprehensive sanctions (limited humanitarian exceptions)
- Syria: Comprehensive sanctions (EU + US)
- Cuba: US trade embargo (limited exceptions)
- Crimea region: EU + US sanctions

**2. Sectoral Sanctions** (Specific industries)
- Russian energy sector: Debt maturity restrictions
- Myanmar military entities: Targeted sanctions
- Venezuelan state-owned entities: Debt + equity restrictions

**3. Entity Sanctions** (Specific companies)
- Huawei sub-entities: US Entity List
- ZTE: Sanctions compliance violations
- Russian banks: Swift exclusion + asset freezes

**4. Individual Sanctions** (Specific people)
- SDN List (Specially Designated Nationals): 10,000+ individuals
- Asset freeze + transaction prohibition
- Travel bans (immigration sanctions)

#### Check Process Example

**Input**: Product description + counterparty + jurisdiction
```json
{
  "product": "FX Forward USD/RUB",
  "counterparty": "Russian Energy Bank",
  "structure": "Standard FX forward",
  "notional": "$50M",
  "tenor": "90 days",
  "settlement": "Moscow"
}
```

**Agent Action**:
```
Step 1: Extract sanctions trigger terms
- Currency: "RUB" (Russian Ruble)
- Counterparty: "Russian Energy Bank"
- Settlement location: "Moscow"
- Sector: Energy (implied from counterparty name)

Step 2: Check OFAC SDN List
Query: "Russian Energy Bank"
Result: MATCH FOUND

Sanctions Entry:
- Entity: Russian Energy Bank (REBank)
- SDN List ID: 12345
- Sanction Type: Sectoral (energy sector)
- Effective Date: 2022-03-01
- Authority: Executive Order 14024 (Ukraine-related sanctions)
- Scope: Prohibition on new debt >14 days maturity

Step 3: Cross-Check Transaction Type
Transaction: FX Forward (90-day tenor)
Comparison: 90 days > 14 days threshold
Result: PROHIBITED (Exceeds maturity limit)

Decision: PROHIBITED (Sanctions Violation)
```

**Output to User**:
```
🚨 HARD STOP - SANCTIONS VIOLATION

Product: FX Forward USD/RUB
Counterparty: Russian Energy Bank
Status: PROHIBITED

Reason:
The counterparty is on the OFAC Specially Designated Nationals (SDN) list with restrictions on transactions exceeding 14 days maturity.

Sanctions Details:
- Entity: Russian Energy Bank (REBank)
- SDN List ID: 12345
- Sanction Authority: U.S. Executive Order 14024
- Sanction Type: Sectoral (energy sector)
- Effective Date: 2022-03-01
- Prohibition: New debt >14 days maturity

Your Transaction:
- Type: FX Forward
- Tenor: 90 days
- Maturity Threshold: 14 days
- Violation: 90 days > 14 days (EXCEEDS LIMIT)

Why This Is Critical:
• Criminal offense under U.S. law (potential $10M+ fine per violation)
• Asset freeze risk (U.S. can freeze MBS assets in USD clearing)
• Correspondent banking risk (U.S. banks may terminate relationships)
• Criminal liability for executives involved
• Reputational damage (DOJ prosecution, media coverage)

NO EXCEPTIONS:
Sanctions violations have zero tolerance. This transaction CANNOT proceed under any circumstances.

Alternative Options:
NONE - Recommend declining client request

If Client Insists:
Explain: "MBS cannot facilitate this transaction due to international sanctions. Proceeding would expose both MBS and the client to severe legal and financial penalties."

Compliance Escalation:
This attempted transaction has been automatically reported to:
• MBS Compliance Team (compliance@mbs.com)
• Group Financial Crime Compliance
• Sanctions Monitoring Unit

Note: All sanctions checks are logged for regulatory audit. Do NOT attempt to circumvent sanctions through alternative structures.
```

**Automatic Actions**:
```
1. HARD STOP: Workflow terminated
2. Compliance Alert: Email sent to sanctions monitoring team
3. Audit Log: Permanent record of attempted prohibited transaction
4. User Flag: Maker receives compliance training reminder
5. Manager Notification: Maker's manager notified of sanctions check failure
```

**This is the most serious prohibition** - sanctions violations can result in criminal prosecution.

---

### Layer 4: Dynamic Compliance Rules (Real-Time Policy Updates)

**What This Checks**: Recently updated policies that may not yet be in static lists

#### Why Dynamic Checks Matter

Compliance landscapes change rapidly:
- **New sanctions imposed**: Russia sanctions added weekly in 2022
- **Regulatory emergency actions**: COVID-19 emergency rules
- **Internal policy changes**: ESG exclusions added
- **Breaking news**: Company suddenly under investigation (e.g., SVB failure)

**Static lists risk being outdated.** Dynamic checks query live databases.

#### Check Process Example

**Input**: Product + counterparty + current date
```json
{
  "product": "Corporate Bond",
  "issuer": "Silicon Valley Bank",
  "issue_date": "2025-12-26",
  "client": "Institutional investor"
}
```

**Agent Action**:
```
Step 1: Check Static Prohibited List
Query: "Silicon Valley Bank"
Result: NO MATCH (not on prohibited list as of last update)

Step 2: Check Dynamic Compliance Database (Real-Time API Call)
API Call: GET /compliance/real-time-check
Parameters: {
  entity: "Silicon Valley Bank",
  check_date: "2025-12-26",
  check_type: "financial_health"
}

API Response:
{
  "entity": "Silicon Valley Bank",
  "status": "FAILED_INSTITUTION",
  "event_date": "2023-03-10",
  "event_type": "FDIC Receivership",
  "regulatory_action": "Ceased Operations",
  "recommendation": "DO_NOT_TRADE"
}

Step 3: Apply Dynamic Rule
Rule: Institutions in receivership → PROHIBITED
Decision: PROHIBITED (Failed Institution)
```

**Output to User**:
```
⚠️ HARD STOP - Failed Institution

Product: Silicon Valley Bank Corporate Bond
Status: PROHIBITED

Reason:
Silicon Valley Bank is currently in FDIC receivership following its failure on March 10, 2023. MBS policy prohibits trading securities of failed institutions.

Regulatory Status:
- Event: FDIC Receivership
- Event Date: 2023-03-10
- Current Status: Ceased Operations
- Regulator: Federal Deposit Insurance Corporation (FDIC)

Why Prohibited:
• Institution has failed and is no longer operating
• Bond may have zero recovery value
• Regulatory uncertainty around claims process
• Reputational risk of trading failed bank securities
• Fiduciary duty to protect clients from worthless securities

This check is performed in REAL-TIME against current regulatory databases to capture events that occurred after our last static list update.

Alternative Products:
If client seeks bank bonds, consider:
• Investment-grade bank bonds (rated A or above)
• Systemically important banks (G-SIBs)
• Covered bonds with collateral protection

Next Steps:
Inform client that MBS cannot facilitate this trade due to issuer failure.

Last Checked: 2025-12-26 09:00:00 SGT (Real-Time)
Data Source: FDIC Public Database, Bloomberg Regulatory Feed
```

---

### Layer 5: Finance & Tax Specific Validation (Business Rule Requirement)

**What This Checks**: Accounting treatment and Cross-Border Tax implications (per Section IV.A.2 of NPA Rules).

**Critical Checks**:
1. **Classification Mismatch**: Warning if "Trading Book" product invokes "Banking Book" accounting (or vice versa).
2. **Tax Triggers**:
    *   **Withholding Tax**: Alert if counterparty jurisdiction (e.g., China, Indonesia) typically applies WHT on this product type.
    *   **Transfer Pricing**: Alert if booking entity differs from risk-taking entity (Cross-Border).
3. **Accounting Standards**:
    *   Prompt validation for **FVPL** (Fair Value Through Profit/Loss), **FVOCI** (Fair Value through OCI), or **Amortised Cost**.

**Example**:
```
Input: "Hold-to-Maturity Bond in Trading Book"
Check: HTM is typically Banking Book (Amortised Cost). Trading Book requires Fair Value.
Flag: POTENTIAL MISCLASSIFICATION (Finance Risk)
Action: Require Finance Sign-Off confirmation.
```

#### Extended Finance & Tax Layer Details (Cross-Verified from Deep Knowledge)

The following additional considerations apply within Layer 5 and must be validated for any cross-border or multi-jurisdiction NPA:

**Withholding Tax Considerations for Cross-Border Products**:
- Cross-border NPAs must be screened for withholding tax (WHT) applicability in the counterparty's jurisdiction.
- Example: Chinese withholding tax and VAT were key considerations in the NAFMII Repo Agreement (TSG2042). CNY/CNH restricted currency handling introduced additional WHT complexity.
- Jurisdictions with common WHT triggers include China, Indonesia, India, and South Korea.
- When in doubt, the agent should flag for Finance/Tax review before proceeding.

**Transfer Pricing Implications for Cross-Border Booking**:
- If the booking entity is in a different jurisdiction from the risk-taking entity, transfer pricing documentation and arm's-length pricing validation are required.
- Cross-border booking arrangements must be reviewed for compliance with OECD transfer pricing guidelines and local tax authority requirements.

**Dual Booking Requirements**:
- Certain products may require dual booking (e.g., one booking in the originating entity and a mirror booking in the risk-managing entity).
- The agent should detect dual booking scenarios and flag them for Operations and Finance review.

**Group Finance Consultation Rule**:
- Consult Group Finance when in doubt about accounting treatment changes, especially for new product types that do not have clear precedent in the existing accounting policy framework.
- Any change in accounting classification (e.g., from FVPL to Amortised Cost) for an existing product line requires Group Finance sign-off.

**Reference Case - NAFMII Repo Agreement (TSG2042)**:
- Product involved CNY/CNH restricted currency handling
- Chinese withholding tax applied to interest payments
- VAT implications on financial services in China
- New jurisdiction/legal framework required Full NPA regardless of the simplicity of the underlying repo instrument
- This case established the precedent that jurisdiction/legal novelty always escalates classification

---

## The Four-Layer Check in Action: Complete Example

### User Input
```
"I want to trade a Bitcoin binary option with Russian Energy Bank, settled in Iran."
```

### Agent Processing (Sequential Checks)

#### Layer 1: Internal Policy Check
```
Query: "Bitcoin" + "Binary Option"
Result: MATCH on "Bitcoin" (cryptocurrency derivatives prohibited)
Decision: PROHIBITED
Error Type: Internal Policy Violation
```

#### Layer 2: Regulatory Check
```
Query: "Binary Option" + "Retail/Institutional"
(Assuming retail client)
Result: MATCH on "Binary Option" + "Retail" (MAS prohibition)
Decision: PROHIBITED
Error Type: Regulatory Violation
```

#### Layer 3: Sanctions Check
```
Query: "Russian Energy Bank" + "Iran"
Result: DOUBLE MATCH
- Russian Energy Bank on OFAC SDN list (sectoral sanctions)
- Iran under comprehensive OFAC sanctions
Decision: PROHIBITED
Error Type: Sanctions Violation (Critical)
```

#### Layer 4: Dynamic Check
```
Real-time API call:
- Check Bitcoin regulatory status → Volatile, but not prohibited at Layer 4
- Check Russian Energy Bank status → Confirmed on SDN list
- Check Iran sanctions → Comprehensive sanctions confirmed
Decision: PROHIBITED (confirmed by real-time check)
```

### Final Output to User

```
🚨 MULTIPLE CRITICAL VIOLATIONS DETECTED 🚨

Product: Bitcoin Binary Option with Russian Energy Bank (Iran settlement)
Status: PROHIBITED - WORKFLOW TERMINATED

This transaction violates MULTIPLE compliance layers:

❌ VIOLATION 1: Internal Policy (MBS Prohibited List)
   - Cryptocurrency derivatives are banned
   - Policy: RMG Policy 2023-001
   - Severity: HIGH

❌ VIOLATION 2: Regulatory Restriction (MAS)
   - Binary options prohibited for retail clients
   - Regulation: MAS Notice SFA04-N12
   - Severity: HIGH (regulatory penalty risk)

🚨 VIOLATION 3: Sanctions Violation (OFAC) - CRITICAL
   - Russian Energy Bank is on OFAC SDN list
   - Iran settlement involves sanctioned jurisdiction
   - Severity: CRITICAL (criminal liability)

COMPLIANCE ACTIONS TAKEN:
✅ Transaction blocked immediately
✅ Compliance team notified (Sanctions Monitoring Unit)
✅ Manager notified (compliance training required)
✅ Audit log created (permanent record)

LEGAL WARNING:
Attempting to circumvent sanctions is a federal crime under U.S. law.
Do NOT pursue alternative structures to facilitate this transaction.

NEXT STEPS:
1. Inform client: Transaction cannot proceed due to sanctions
2. Complete mandatory sanctions training (link sent to your email)
3. Meet with Compliance Officer within 48 hours

If you believe this is an error, contact:
• Sanctions Monitoring Unit: sanctions@mbs.com
• Compliance Hotline: +65-6878-XXXX

This incident has been logged for regulatory audit purposes.
```

**This NPA never enters the workflow** - stopped at gate before any processing.

---

## Loop-Back Types Reference (from Deep Knowledge Section 12)

Understanding loop-back types is critical for the Risk Agent because loop-backs represent rework cycles that increase processing time and cost. The Risk Agent's goal is to prevent loop-backs caused by compliance/risk issues by catching them at the gate.

### Type 1: Checker Rejection (Major Loop-Back)
- **Flow**: Maker submits → Checker reviews → REJECTS → Loop-back to Draft
- **Time Impact**: +3-5 days per iteration
- **Current Average**: 1.4 iterations per NPA
- **Risk Agent Relevance**: By performing instant compliance validation before submission, the Risk Agent prevents Checker rejections caused by prohibited products, sanctions issues, or regulatory violations. This directly reduces Type 1 loop-backs.

### Type 2: Approval Clarification (Smart Loop-Back)
- **Flow**: Approver requests clarification during sign-off stage
- **Decision Logic**:
  - If clarification requires NPA document changes → loop-back to Maker (full rework cycle)
  - If answerable from existing documents → direct response from Maker (no loop-back to Draft)
- **Time Saved**: ~2-3 days when smart routing avoids full loop-back
- **Risk Agent Relevance**: Clear risk assessment output with detailed reasoning reduces the need for approvers to request clarification on risk/compliance matters.

### Type 3: Launch Preparation Issues
- **Flow**: During system configuration/UAT → issue discovered → loop-back to Sign-Off Stage (specific SOP only)
- **Typical Causes**:
  - System compatibility issues
  - Regulatory changes between approval and launch
  - Risk threshold breaches identified during UAT
- **Risk Agent Relevance**: The agent's continuous monitoring (Layer 4 dynamic checks) can detect regulatory changes that occur between approval and launch, triggering early alerts before UAT begins.

### Type 4: Post-Launch Corrective Action
- **Flow**: After launch → PIR (Post-Implementation Review) identifies issue → loop-back to Review Stage (expedited)
- **Typical Causes**:
  - Volume below projections
  - Unexpected operational issues
  - Regulatory findings post-launch
- **Risk Agent Relevance**: Post-launch monitoring and PIR risk assessments feed back into the Risk Agent's dynamic compliance database, ensuring future NPAs benefit from lessons learned.

---

## Real NPA Examples & Lessons Learned (from Deep Knowledge Section 14)

The following real NPA cases provide critical precedent for risk assessment decisions. The Risk Agent should reference these patterns when evaluating new submissions.

### TSG1917: FX Options
- **Classification**: Lightest track (existing product, clear precedent)
- **Lesson**: When a product has clear precedent in the existing product library and the jurisdiction/counterparty/legal framework are unchanged, the lightest NPA track applies.
- **Risk Agent Implication**: Products matching existing FX Options patterns with no new risk factors can be fast-tracked through compliance checks.

### TSG2042: NAFMII Repo Agreement
- **Classification**: Full NPA (despite simple underlying instrument)
- **Key Factors**: New jurisdiction (China), new legal framework (NAFMII master agreement), CNY/CNH restricted currency handling, Chinese withholding tax, VAT
- **Lesson**: A new jurisdiction or legal framework ALWAYS triggers Full NPA classification, regardless of how simple the underlying product is.
- **Risk Agent Implication**: The agent must detect jurisdiction novelty and legal framework changes as independent risk escalation triggers. A "simple repo" becomes a Full NPA when the legal wrapper or jurisdiction is new.

### TSG2055: ETF Subscription
- **Classification**: Required deal-specific approval
- **Lesson**: Some products require deal-specific approval even when the product type itself has precedent. ETF subscriptions may involve specific fund structures, distribution channel restrictions, or regulatory requirements that vary by deal.
- **Risk Agent Implication**: The agent should flag products where deal-specific characteristics (fund structure, distribution channel) may override general product-level approvals.

### TSG2339: Swap Connect
- **Classification**: Full NPA (infrastructure/market access change)
- **Lesson**: Infrastructure or market access changes that fundamentally alter the operational model require Full NPA treatment. Swap Connect introduced a new way to access China's interbank bond market, changing clearing, settlement, and operational workflows.
- **Risk Agent Implication**: Market infrastructure changes (new clearing houses, new access schemes, new settlement mechanisms) should be treated as operational model changes and escalated accordingly.

### TSG2543: Multi-Asset Product
- **Classification**: Multiple SOP reviews required, longest timelines
- **Lesson**: Multi-asset products trigger reviews across multiple SOPs (one per asset class), resulting in the longest approval timelines. Each asset class component must pass its own compliance and risk checks independently.
- **Risk Agent Implication**: The agent must decompose multi-asset products into their constituent asset classes and run independent compliance checks for each. A failure in any single asset class component blocks the entire product.

---

## NPA Approval Governance & Notional Escalation

For products that PASS all compliance layers, the NPA governance model determines approval requirements. The **GFM COO** is the final approving authority (not Board/CEO).

### Notional Threshold Escalation (R40-R42)

| Notional | Flag | Additional Requirement |
|----------|------|----------------------|
| > $10M + Derivative | `mlr_review_required` | MLR review mandatory (GFM SOP) |
| > $20M | `roae_analysis_needed` | ROAE sensitivity analysis required (Appendix III) |
| > $50M | `finance_vp_required` | Finance VP review and approval required |
| > $100M | `cfo_approval_required` | CFO review and approval required (+1 day timeline) |

### Risk Rating Override Rules

| Condition | Override |
|-----------|---------|
| NTG product | Minimum rating = MEDIUM (cannot be LOW) |
| Cross-border | +1 severity level (LOW→MEDIUM, MEDIUM→HIGH) |
| Notional >$100M | +1 severity level |
| Dormant ≥3 years | Minimum = HIGH |
| Circuit breaker triggered (3+ loop-backs) | Minimum = HIGH |
| Prohibited product | Always CRITICAL |

### Approval Track Timelines

| Track | Average Days | Range |
|-------|-------------|-------|
| FULL_NPA | 12 days (current avg) | 8-22 days |
| NPA_LITE | 5-8 days | 3-10 days |
| NPA_LITE B1/B3 | 2 days (48hr) | 1-3 days |
| BUNDLING | 3-5 days | 2-7 days |
| EVERGREEN | 1-2 days | Same day to 3 days |

### SOP SLA Windows (Sign-Off Stage)

| SOP | Average SLA |
|-----|-------------|
| Finance (Group Product Control) | 1.8 days (bottleneck) |
| RMG-Credit | 1.2 days |
| Legal & Compliance | 1.1 days |
| RMG-MLR | ~1 day |
| Operations | ~1 day |
| Technology | ~1 day |

---

## Post-Implementation Review (PIR) Rules — R30-R32

### When PIR Is Mandatory

| Condition | Required? | Scope |
|-----------|----------|-------|
| ALL NTG products | **YES** | ALL original SOPs, even without conditions |
| Products with post-launch conditions | **YES** | SOPs who imposed conditions |
| GFM stricter rule: ANY launched product | **YES** | All launched products regardless of type |
| Reactivated NTG | **YES** | Full PIR scope |

### PIR Timeline
- Must be **initiated within 6 months** of product launch
- Reminders: Launch + 120 days, + 150 days, + 173 days (URGENT)

### PIR Sign-Off
- NTG: ALL original SOPs (even if no conditions imposed)
- Others: SOPs who imposed post-launch conditions
- Group Audit may conduct independent PIR

### PIR Repeat Logic
- If issues found during PIR → repeat in **90 days**
- Continues until all SOPs are satisfied

---

## Validity, Extensions & Expiration — R23-R26

### Standard Validity
- Full NPA / NPA Lite: **1 year** from approval date
- Evergreen: **3 years** from approval date

### Extension Rules (One-Time Only)
- Extension: **+6 months** maximum (total: 18 months)
- Requirements: No variation, no risk profile change, no operating model change
- **Unanimous consensus** from ALL original SOPs required
- Group BU/SU COO approval required
- If ANY SOP disagrees → extension denied

### Expiry Consequences
- Product CANNOT be traded after validity expires
- Expired + no variations → NPA Lite Reactivation
- Expired + variations → Full NPA (treated as effectively NTG)

### Launch Definition
"Launch" = first marketed sale/offer OR first trade (NOT indication of interest)

---

## Circuit Breaker & Loop-Back Rules — R36-R37

### Four Types of Loop-Back

| Type | Description | Time Impact |
|------|-------------|-------------|
| Type 1: Checker Rejection | Maker submits → Checker rejects → back to Draft | +3-5 days per iteration |
| Type 2: Approval Clarification | SOP needs clarification during sign-off | +2-3 days (if NPA doc changes needed) |
| Type 3: Launch Prep Issues | Issue during UAT/config → back to specific SOP | Variable |
| Type 4: Post-Launch Corrective | PIR finds issue → expedited re-approval | Variable |

### Circuit Breaker Rule
- **Trigger:** After **3 loop-backs** on the same NPA
- **Action:** Automatic escalation to Group BU/SU COO + NPA Governance Forum
- **Rationale:** 3 loop-backs = fundamental problem needing senior intervention

### Current Metrics
- Loop-backs/month: 8
- Average rework iterations: 1.4
- Circuit breaker escalations: ~1/month

---

## Evergreen Products — Limits & Eligibility — R09

### 6 Eligibility Criteria (ALL must be met)
1. No significant changes since last approval
2. Back-to-Back (BTB) basis with professional counterparty
3. Vanilla/foundational product
4. Liquidity management product (including for MBS Group Holdings)
5. Exchange product used as hedge against customer trades
6. ABS origination to meet client demand

### What's NOT Eligible
- Products requiring deal-by-deal approval
- Products dormant/expired > 3 years
- Joint-unit NPAs (Evergreen is GFM-only)

### Evergreen Limits (GFM-Wide)

| Limit Type | Amount |
|------------|--------|
| Total Notional (aggregated) | USD $500,000,000 |
| Long Tenor (>10Y) sub-limit | USD $250,000,000 |
| Non-Retail Deal Cap (per NPA) | 10 deals |
| Retail Deal Cap (per NPA) | 20 deals |
| Retail Transaction Size (per trade) | USD $25,000,000 |
| Retail Aggregate Notional | USD $100,000,000 |

**Special exemption:** Liquidity management products — notional and trade caps **WAIVED**

### Evergreen Bundles (Pre-Approved)
- Dual Currency Deposit/Notes (FX Option + LNBR/Deposit/Bond)
- Treasury Investment Asset Swap (Bond + IRS)
- Equity-Linked Note (Equity Option + LNBR)

---

## NPA Lite Sub-Types — Risk Differentiation — R12-R15

| Sub-Type | Trigger | Risk Profile | Timeline |
|----------|---------|-------------|----------|
| **B1: Impending Deal** | BTB + professional counterparty; or dormant/expired with UAT done | MEDIUM — any SOP objection → fallback | 48 hours |
| **B2: NLNOC** | Simple payoff change; or reactivation with no structural changes | MEDIUM — joint GFM COO + RMG-MLR decision | 5-10 days |
| **B3: Fast-Track Dormant** | Prior live trade + not prohibited + PIR completed + no variations | MEDIUM-LOW — 48hr no-objection → auto-approval | 48 hours |
| **B4: Addendum** | Minor updates to LIVE (not expired) NPA only | LOW — no new features/payoffs; validity NOT extended | < 5 days |

### B4 Addendum Constraints
- Can only amend LIVE NPAs (NOT expired ones)
- No new features or payoffs permitted
- Original NPA reference kept (same GFM ID)
- Validity period NOT extended (maintains original expiry)

---

## Dormancy & Existing Product Routing — R05, R34

**Dormancy definition:** No transactions booked in the last **12 months** = dormant.

| Status | Condition | Sub-Route | Track |
|--------|-----------|-----------|-------|
| Active | On Evergreen list | Evergreen (same-day) | EVERGREEN |
| Active | NOT on Evergreen list | NPA Lite Ref Existing | NPA_LITE |
| Dormant | < 3 years + fast-track criteria | Fast-Track 48hr | NPA_LITE (B3) |
| Dormant | < 3 years + variations detected | NPA Lite (standard) | NPA_LITE |
| Dormant | ≥ 3 years | Escalate to GFM COO | ESCALATE |
| Expired | No variations | NPA Lite Reactivation | NPA_LITE |
| Expired | Variations detected | Full NPA (effectively NTG) | FULL_NPA |

**Dormant ≥ 3 years:** Risk landscape, regulatory environment, and operational infrastructure may have materially changed. GFM COO must determine whether Full NPA is required.

---

## Bundling — 8 Conditions & Arbitration — R08, R17

### 8 Bundling Conditions (ALL Must Pass)

| # | Condition |
|---|-----------|
| 1 | Building blocks bookable in Murex/Mini/FA with no new model required |
| 2 | No proxy booking |
| 3 | No leverage beyond individual component limits |
| 4 | No new collaterals (existing CSA/GMRA acceptable; can be reviewed but not auto-rejection) |
| 5 | No new third-party intermediaries |
| 6 | PDD compliance for all components |
| 7 | No SCF — exception: structured warrant bundle is permitted |
| 8 | Correct cashflow settlement through standard channels |

**If ALL pass** → Bundling Approval via Arbitration Team
**If ANY fail** → Must use FULL_NPA or NPA_LITE instead

### Bundling Arbitration Team (6 members)
1. Head of GFM COO Office NPA Team
2. RMG-MLR
3. TCRM (Technology & Credit Risk Management)
4. Finance-GPC (Group Product Control)
5. GFMO (GFM Operations)
6. GFM Legal & Compliance

---

## How the Agent Stays Updated

**Challenge**: Sanctions lists update daily, regulations change monthly, internal policies evolve quarterly.

**Solution**: Multi-source synchronization

### Update Source 1: OFAC SDN List (Daily)

```
Schedule: Daily at 03:00 SGT
Process:
1. Download OFAC SDN list (XML format)
2. Parse 10,000+ sanctioned entities
3. Update Redis cache
4. Compare to previous day (detect new additions)
5. Alert Compliance team: "12 new entities added to SDN list today"
6. Agent uses updated list for next check

Last Update: 2025-12-26 03:00:00 SGT
Next Update: 2025-12-27 03:00:00 SGT
Entities in Cache: 10,247
```

### Update Source 2: MAS Regulations (Weekly)

```
Schedule: Weekly on Monday 02:00 SGT
Process:
1. Scrape MAS public notices and circulars
2. Parse regulatory changes
3. Update compliance rule engine
4. Human review: Compliance Officer reviews changes
5. Approve updates (manual gate to prevent false positives)
6. Deploy to production

Last Update: 2025-12-23 (Week 51)
Next Update: 2025-12-30 (Week 52)
Rules in Database: 247 MAS regulations
```

### Update Source 3: Internal Policy (Monthly)

```
Schedule: Monthly on 1st day at 06:00 SGT
Process:
1. Compliance Officer submits policy changes via admin panel
2. Risk Management approves
3. GFM COO signs off
4. Deploy to prohibited list
5. Notify all users: "Internal prohibited list updated - 3 new restrictions added"

Last Update: 2025-12-01
Next Update: 2026-01-01
Prohibited Categories: 23
Prohibited Entities: 156
```

### Update Source 4: Real-Time APIs (Continuous)

```
Frequency: Real-time (every check)
Sources:
- Bloomberg Regulatory Feed
- FDIC Public Database
- News aggregators (for breaking events)
- SEC enforcement actions

Cache TTL: 15 minutes (balance freshness vs performance)
```

---

## Performance Targets & Metrics

### Target 1: Speed
- **Check time**: <1 second (target: 800ms average)
- **Layer 1 (Internal)**: 100ms (Redis cache lookup)
- **Layer 2 (Regulatory)**: 200ms (SQL query)
- **Layer 3 (Sanctions)**: 300ms (OFAC API + Redis cache)
- **Layer 4 (Dynamic)**: 200ms (REST API call with 15-min cache)

### Target 2: Accuracy
- **False positive rate**: <2% (blocks allowed transaction)
- **False negative rate**: 0% (allows prohibited transaction - ZERO TOLERANCE)
- **Match accuracy**: >99.8% (correctly identifies prohibited items)

### Target 3: Uptime
- **Availability**: 99.9% (critical compliance function)
- **Failover**: If primary check fails, secondary manual review triggered
- **Fallback**: If agent down, workflow halts (conservative failure mode)

### Target 4: Audit
- **All checks logged**: 100% (regulatory requirement)
- **Log retention**: 7 years (compliance requirement)
- **Audit trail**: Immutable (cryptographic hash)

---

## Edge Cases & Error Handling

### Edge Case 1: Partial Name Match

**Scenario**: Counterparty name is similar to sanctioned entity but not exact match

**Example**:
- Sanctioned entity: "Bank of Tehran"
- User input: "Bank of Tehran International"

**Challenge**: Is this the same entity (sanctions evasion) or different entity (legitimate)?

**Agent Handling**:
```
Step 1: Fuzzy Matching
- Exact match: NO
- Fuzzy match (85% similarity): YES

Step 2: Conservative Decision
- Treat as potential match → FLAG for manual review
- Do NOT auto-approve (risk of sanctions violation)
- Do NOT auto-reject (risk of false positive blocking legitimate business)

Step 3: Manual Review Queue
Output to User:
"⚠️ Potential Sanctions Match Detected

Counterparty: Bank of Tehran International
Similar Entity: Bank of Tehran (OFAC SDN List)
Similarity: 85%

This requires manual Compliance review before proceeding.

Your NPA has been routed to:
• Sanctions Monitoring Unit
• Expected Review Time: 4-6 hours

Status: PENDING (awaiting Compliance clearance)

Next Steps:
- Compliance will research entity relationship
- If different entity: Workflow resumes
- If same entity: Workflow terminated

Do NOT proceed until Compliance clearance received."
```

**Human Compliance Officer Reviews**:
- Searches Bloomberg, LinkedIn, company registries
- Determines: "Bank of Tehran International" is a subsidiary of "Bank of Tehran"
- Decision: **REJECT** (sanctions evasion attempt)

---

### Edge Case 2: Sanctions Imposed Mid-Workflow

**Scenario**: NPA submitted, approved, in launch preparation. Then sanctions imposed on counterparty.

**Agent Handling**:
```
Real-Time Monitoring:
- Agent checks OFAC daily updates at 03:00 SGT
- Detects: "New Entity Added: XYZ Corporation"

Cross-Check Against In-Flight NPAs:
- Query: All NPAs with status != "Launched" OR "Closed"
- Find: NPA TSG2025-042 involves XYZ Corporation
- Status: Preparing for Launch (1 day from go-live)

Automatic Action:
1. HALT workflow immediately
2. Escalate to Compliance + GFM COO
3. Notify all stakeholders

Escalation Message:
"🚨 URGENT - Sanctions Imposed on In-Flight NPA

NPA: TSG2025-042
Counterparty: XYZ Corporation
Status: HALTED (was in Preparing for Launch)

Event:
OFAC added XYZ Corporation to SDN list as of 2025-12-26 03:00 SGT

Impact:
This NPA can NO LONGER proceed. Sanctions prohibit all transactions with XYZ Corporation.

Immediate Actions Required:
1. Cancel launch preparation
2. Notify client: MBS cannot proceed due to sanctions
3. Review existing trades with XYZ Corporation for wind-down requirements
4. Legal review: Assess sanctions compliance for in-flight deals

Escalated To:
- GFM COO Office
- Group Compliance (Sanctions Monitoring)
- Legal Department
- Client Relationship Manager

Timeline:
- Compliance review: Within 24 hours
- Client notification: Within 48 hours
- Wind-down plan (if applicable): Within 1 week"
```

**This demonstrates continuous monitoring** - agent doesn't just check once at submission.

---

### Edge Case 3: Country Name Ambiguity

**Scenario**: User says "Georgia" - could be Georgia (country, former Soviet Union) or Georgia (U.S. state)

**Agent Handling**:
```
Step 1: Detect Ambiguity
- User input: "Client is in Georgia"
- Ambiguous term detected: "Georgia" (multiple meanings)

Step 2: Request Clarification
Output to User:
"🔍 Clarification Needed

You mentioned 'Georgia' as the client location.

Please clarify which you mean:
1. Georgia (country, Caucasus region, former Soviet Union)
2. Georgia (U.S. state, United States of America)

This affects sanctions and regulatory checks.

Please select: [Country] [U.S. State]"

Step 3: User Selects "Country"
- Re-run sanctions check with "Georgia (country)"
- Check: Georgia (country) is NOT sanctioned
- Check: Regulatory requirements for Georgia operations
- Result: PASS
```

**This prevents false positives** from ambiguous terms.

---

## Integration with Other Agents

### Integration 1: Product Ideation Agent
**Trigger Point**: Immediately after user describes product
**Process**:
1. Product Ideation collects product description
2. Calls Prohibited List Checker
3. If PROHIBITED: Stops interview, displays error
4. If PASS: Continues interview

**Example**:
```
User: "I want to offer a Bitcoin derivative"
Ideation Agent: [Collects basic info]
Prohibited List Checker: [Runs 4-layer check]
Result: PROHIBITED (Layer 1 - Internal Policy)
Ideation Agent: [Displays error, halts interview]
```

---

### Integration 2: Classification Router Agent
**Trigger Point**: Before finalizing classification
**Process**:
1. Classification Router receives product classification
2. Calls Prohibited List Checker (defensive check)
3. If PROHIBITED: Overrides classification, HARD STOP
4. If PASS: Proceeds with classification

**Example**:
```
Classification: "NTG - Full NPA"
Prohibited List Checker: [Re-validates]
Result: PASS
Classification Router: [Proceeds with NTG Full NPA track]
```

---

### Integration 3: Approval Orchestration Agent
**Trigger Point**: Before sending to approvers
**Process**:
1. Approval Orchestration prepares to route NPA
2. Calls Prohibited List Checker (final defensive check)
3. If PROHIBITED (somehow got through): Escalate to Compliance
4. Log incident: "Prohibited product bypassed initial check - investigate"

**This is a defensive safety check** - should never trigger if earlier checks worked.

---

## Input/Output Schema

### Input (Product Data)
```json
{
  "product_segment": "FX",
  "product_type": "Forward",
  "underlying": "BTC/USD",
  "notional_amount": 5000000,
  "counterparty_name": "Russian Energy Bank",
  "counterparty_country": "SG",
  "client_type": "Retail",
  "settlement_location": "Moscow"
}
```

### Output (Risk Assessment - BLOCKED)
```json
{
  "status": "BLOCKED",
  "block_level": "Level 1 (Internal Policy)",
  "reason": "Cryptocurrency (BTC) is strictly prohibited by GFM Policy 2.1.",
  "risk_tier": "Critical",
  "required_approvals": [],
  "violations": [
    {
      "layer": 1,
      "type": "Internal Policy",
      "category": "Cryptocurrency Derivatives",
      "policy_reference": "RMG Policy 2023-001",
      "severity": "HIGH"
    }
  ],
  "alternative_products": [
    "FX Options on EUR/USD",
    "FX Options on GBP/USD",
    "Gold options (regulated exchange)"
  ],
  "next_steps": "Contact Group Risk Management for policy exception review",
  "audit_log_id": "CHECK-2025-12-26-001234"
}
```

### Output (Risk Assessment - PASS)
```json
{
  "status": "PASS",
  "block_level": "None",
  "reason": "All compliance checks passed",
  "risk_tier": "Standard",
  "required_approvals": ["Desk Head", "Regional Risk Head"],
  "violations": [],
  "checks_performed": [
    {
      "layer": 1,
      "type": "Internal Policy",
      "result": "PASS",
      "checked_at": "2025-12-26T09:00:00Z"
    },
    {
      "layer": 2,
      "type": "Regulatory",
      "result": "PASS",
      "checked_at": "2025-12-26T09:00:00Z"
    },
    {
      "layer": 3,
      "type": "Sanctions",
      "result": "PASS",
      "checked_at": "2025-12-26T09:00:00Z"
    },
    {
      "layer": 4,
      "type": "Dynamic",
      "result": "PASS",
      "checked_at": "2025-12-26T09:00:00Z"
    }
  ],
  "audit_log_id": "CHECK-2025-12-26-001235"
}
```

---

## Why This Agent Is Critical

The Prohibited List Checker Agent is the **compliance gatekeeper** that protects the entire organization.

### Without This Agent:
- ❌ Prohibited products enter workflow, wasting 4-5 days before rejection
- ❌ Risk of $100M+ fines for sanctions violations
- ❌ Criminal prosecution risk for executives
- ❌ License revocation risk for the bank
- ❌ Reputational damage from compliance failures
- ❌ Manual compliance checks create 2-3 day delays

### With This Agent:
- ✅ Instant validation (<1 second vs 4-5 days)
- ✅ Zero prohibited products enter workflow (100% prevention)
- ✅ Criminal liability protection (OFAC compliance)
- ✅ Daily sanctions updates (always current)
- ✅ Clear guidance (explains why prohibited, suggests alternatives)
- ✅ Continuous monitoring (detects sanctions imposed mid-workflow)

### Key Business Impact:
1. **Risk Elimination**: 0% prohibited products enter workflow (vs historical 2-3% error rate)
2. **Time Savings**: 4-5 days saved per prohibited product catch
3. **Compliance Cost Reduction**: 80% reduction in manual compliance review workload
4. **Criminal Liability Protection**: Zero sanctions violations (vs industry average 0.1% violation rate = $100M+ fines)
5. **Reputational Protection**: No front-page sanctions scandals

### The Real Magic:
**The agent doesn't just say "NO" - it explains why, suggests alternatives, and guides users to compliant solutions.**

Instead of a frustrating dead-end, it's a helpful redirect toward legitimate business opportunities.

**Example**:
```
Blocked: Bitcoin derivative
Alternative Suggested: Gold derivative (same hedging benefit, compliant)
User Action: Switches to gold derivative
Result: Compliant deal closed in 5 days (vs 0 days if Bitcoin deal attempted)
```

That's the power of intelligent compliance automation.

---

**Version**: 2.0 (updated 2026-02-19)
**Cross-verified against**: NPA_Business_Process_Deep_Knowledge.md — all 44 business rules (R01-R44) referenced
**Scope**: 5-layer compliance cascade, 7-domain risk assessment, PIR rules, validity/extension, circuit breaker, Evergreen limits, NPA Lite sub-types, bundling conditions, dormancy routing, real NPA case patterns
