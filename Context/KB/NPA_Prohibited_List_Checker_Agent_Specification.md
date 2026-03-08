# Prohibited List Checker Agent
## The Compliance Gatekeeper That Never Sleeps

**Agent Type:** New Agent (Phase 0 Pre-Screen)  
**Stage:** Step 2A - Pre-Screen Checks (HARD STOP)  
**Purpose:** Real-time validation against prohibited products, jurisdictions, counterparties, and activities before any NPA processing begins  
**Analogy:** This agent is like airport security screening—it's the first checkpoint that stops anything dangerous from entering the system, operating 24/7 with zero tolerance for violations

---

## The Challenge This Agent Solves

Banks face severe penalties for trading prohibited products or dealing with sanctioned entities:
- **Regulatory fines:** $100M+ for sanctions violations (OFAC, UN, EU)
- **Reputational damage:** Front-page news, loss of client trust
- **License revocation:** Worst case, loss of banking license
- **Criminal liability:** Individual executives can face prosecution

**The Risk:**

A well-intentioned Maker submits an NPA for what seems like a standard product, but:
- The counterparty is on OFAC sanctions list (they didn't know)
- The product involves Iran (sanctioned jurisdiction)
- The product type is banned by MAS regulation (policy changed last month)
- The distribution channel violates internal compliance policy

**Current Reality (Manual Compliance Checks):**

**Maker submits NPA** → Sits in queue for 2-3 days  
→ **Checker reviews** → Flags for Compliance review  
→ **Compliance team checks** (1-2 days manual review)  
→ **Discovers violation** → REJECT + escalation  

**Timeline:** 4-5 days wasted on prohibited product

**The damage:**
- Maker wasted 4-5 days of work
- Checker wasted review time
- Compliance team wasted research time
- Business opportunity lost (client went to competitor)
- Morale impact (Maker frustrated by late rejection)

**The Prohibited List Checker Agent solves this by:**
1. **Instant validation** (<1 second vs 4-5 days)
2. **HARD STOP at submission** (blocks workflow immediately)
3. **Clear reasoning** (explains exactly why prohibited)
4. **Multi-layer checking** (internal policy + regulatory + sanctions)
5. **Auto-updates** (new prohibitions sync daily)

**Result:** Zero prohibited products enter the approval workflow (100% prevention)

---

## How the Agent Works: The Four-Layer Check

The agent performs four sequential checks, each operating as a HARD STOP gate:

### Layer 1: Internal Bank Policy (MBS Prohibited List)

**What This Checks:** Products/activities that MBS has decided not to offer, regardless of legality

**Why Banks Have Internal Prohibitions:**
- **Risk appetite:** Product too risky for bank's tolerance (e.g., cryptocurrency derivatives)
- **Reputational risk:** Legal but controversial (e.g., payday loans, tobacco financing)
- **Strategic decision:** Exiting certain business lines (e.g., coal mining financing)
- **Capacity constraints:** Lack of expertise/infrastructure (e.g., complex structured credit)

**Example Internal Prohibitions at MBS (Hypothetical):**
- Cryptocurrency derivatives (high volatility risk)
- Payday loans (reputational risk)
- Thermal coal mining financing (ESG policy)
- Speculative real estate in certain countries (credit risk)
- Products with embedded CDS on sovereign debt (complexity)

**Check Process:**

**Input:** Product description from Product Ideation Agent
```
Product: Bitcoin Option
Underlying: Bitcoin/USD
Structure: European call option
Notional: $10M
```

**Agent Action:**
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

**Output to User:**
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

**Workflow State:**
```
Status: TERMINATED (PROHIBITED)
Reason: Internal Policy Violation
Next Stage: None (HARD STOP)
Escalation: None (unless Maker requests exception review)
```

The NPA **cannot proceed** unless Maker gets EVP-level exception approval (rare).

---

### Layer 2: Regulatory Restrictions (MAS, CFTC, Local Regulations)

**What This Checks:** Products/activities banned by financial regulators

**Regulatory Bodies:**
- **MAS (Monetary Authority of Singapore):** Primary regulator for Singapore operations
- **CFTC (Commodity Futures Trading Commission):** US derivatives regulator
- **FCA (Financial Conduct Authority):** UK regulator (for London desk)
- **HKMA (Hong Kong Monetary Authority):** Hong Kong regulator
- **Local regulators:** Taiwan, Korea, Indonesia, etc.

**Example Regulatory Restrictions:**
- MAS ban on binary options retail distribution (2016)
- CFTC ban on event contracts on political outcomes (2012)
- EU restriction on marketing binary options to retail clients (ESMA 2018)
- China restrictions on cross-border derivatives trading

**Check Process:**

**Input:** Product description + target market
```
Product: Binary Option on Gold
Structure: All-or-nothing payout
Client Type: Retail
Location: Singapore
```

**Agent Action:**
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

**Output to User:**
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

**Key Difference from Internal Policy:**
- Internal policy: Bank can grant exceptions (EVP approval)
- Regulatory restriction: **No exceptions possible** (external law)

---

### Layer 3: Sanctions & Embargoes (OFAC, UN, EU)

**What This Checks:** Transactions involving sanctioned countries, entities, or individuals

**Sanctions Bodies:**
- **OFAC (Office of Foreign Assets Control):** US Treasury Department
- **UN Security Council:** Global sanctions (all member states must comply)
- **EU:** European Union sanctions
- **Local sanctions:** Singapore, Hong Kong, UK individual sanctions lists

**Types of Sanctions:**
1. **Country sanctions:** Comprehensive bans (e.g., North Korea, Iran, Syria)
2. **Sectoral sanctions:** Specific industries (e.g., Russian energy, Myanmar military)
3. **Entity sanctions:** Specific companies (e.g., Huawei sub-entities)
4. **Individual sanctions:** Specific people (SDN list - Specially Designated Nationals)

**Check Process:**

**Input:** Product description + counterparty + jurisdiction
```
Product: FX Forward USD/RUB
Counterparty: Russian Energy Bank
Structure: Standard FX forward
Notional: $50M
Settlement: Moscow
```

**Agent Action:**
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

**Output to User:**
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

**Automatic Actions:**
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

**What This Checks:** Recently updated policies that may not yet be in static lists

**Why Dynamic Checks Matter:**

Compliance landscapes change rapidly:
- New sanctions imposed (e.g., Russia sanctions added weekly in 2022)
- Regulatory emergency actions (e.g., COVID-19 emergency rules)
- Internal policy changes (e.g., ESG exclusions added)
- Breaking news (e.g., company suddenly under investigation)

**Static lists risk being outdated.** Dynamic checks query live databases.

**Check Process:**

**Input:** Product + counterparty + current date
```
Product: Corporate Bond
Issuer: Silicon Valley Bank
Issue Date: 2025-12-26
Client: Institutional investor
```

**Agent Action:**
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

**Output to User:**
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

## The Four-Layer Check in Action: Complete Example

**User Input:**
```
"I want to trade a Bitcoin binary option with Russian Energy Bank, settled in Iran."
```

**Agent Processing (Sequential Checks):**

**Layer 1: Internal Policy Check**
```
Query: "Bitcoin" + "Binary Option"
Result: MATCH on "Bitcoin" (cryptocurrency derivatives prohibited)
Decision: PROHIBITED
Error Type: Internal Policy Violation
```

**Layer 2: Regulatory Check**
```
Query: "Binary Option" + "Retail/Institutional"
(Assuming retail client)
Result: MATCH on "Binary Option" + "Retail" (MAS prohibition)
Decision: PROHIBITED
Error Type: Regulatory Violation
```

**Layer 3: Sanctions Check**
```
Query: "Russian Energy Bank" + "Iran"
Result: DOUBLE MATCH
- Russian Energy Bank on OFAC SDN list (sectoral sanctions)
- Iran under comprehensive OFAC sanctions
Decision: PROHIBITED
Error Type: Sanctions Violation (Critical)
```

**Layer 4: Dynamic Check**
```
Real-time API call:
- Check Bitcoin regulatory status → Volatile, but not prohibited at Layer 4
- Check Russian Energy Bank status → Confirmed on SDN list
- Check Iran sanctions → Comprehensive sanctions confirmed
Decision: PROHIBITED (confirmed by real-time check)
```

**Final Output to User:**
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

## How the Agent Stays Updated

**Challenge:** Sanctions lists update daily, regulations change monthly, internal policies evolve quarterly.

**Solution:** Multi-source synchronization

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

## Performance Targets

**Speed:**
- Check time: <1 second (target: 800ms average)
- Layer 1 (Internal): 100ms (Redis cache lookup)
- Layer 2 (Regulatory): 200ms (SQL query)
- Layer 3 (Sanctions): 300ms (OFAC API + Redis cache)
- Layer 4 (Dynamic): 200ms (REST API call with 15-min cache)

**Accuracy:**
- False positive rate: <2% (blocks allowed transaction)
- False negative rate: 0% (allows prohibited transaction - ZERO TOLERANCE)
- Match accuracy: >99.8% (correctly identifies prohibited items)

**Uptime:**
- Availability: 99.9% (critical compliance function)
- Failover: If primary check fails, secondary manual review triggered
- Fallback: If agent down, workflow halts (conservative failure mode)

**Audit:**
- All checks logged: 100% (regulatory requirement)
- Log retention: 7 years (compliance requirement)
- Audit trail: Immutable (cryptographic hash)

---

## Edge Cases and How the Agent Handles Them

### Edge Case 1: Partial Name Match

**Scenario:** Counterparty name is similar to sanctioned entity but not exact match

**Example:**
- Sanctioned entity: "Bank of Tehran"
- User input: "Bank of Tehran International"

**Challenge:** Is this the same entity (sanctions evasion) or different entity (legitimate)?

**Agent Handling:**
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

**Human Compliance Officer Reviews:**
- Searches Bloomberg, LinkedIn, company registries
- Determines: "Bank of Tehran International" is a subsidiary of "Bank of Tehran"
- Decision: **REJECT** (sanctions evasion attempt)

---

### Edge Case 2: Sanctions Imposed Mid-Workflow

**Scenario:** NPA submitted, approved, in launch preparation. Then sanctions imposed on counterparty.

**Agent Handling:**
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

This demonstrates **continuous monitoring** - agent doesn't just check once at submission.

---

### Edge Case 3: Country Name Ambiguity

**Scenario:** User says "Georgia" - could be Georgia (country, former Soviet Union) or Georgia (U.S. state)

**Agent Handling:**
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

**Integration 1: Product Ideation Agent**
- Product Ideation collects product description
- Calls Prohibited List Checker immediately after user describes product
- If PROHIBITED: Stops interview, displays error
- If PASS: Continues interview

**Integration 2: Classification Router Agent**
- Classification Router receives product classification
- Before finalizing classification, calls Prohibited List Checker
- If PROHIBITED: Overrides classification, HARD STOP
- If PASS: Proceeds with classification

**Integration 3: Approval Orchestration Agent**
- Before sending to approvers, re-checks prohibited list (defensive check)
- If somehow prohibited product got through: Escalate to Compliance
- Log incident: "Prohibited product bypassed initial check - investigate"

---

## Conclusion: Why This Agent Is Critical

The Prohibited List Checker Agent is the **compliance gatekeeper** because it:

1. **Protects the Bank** - Prevents $100M+ fines, criminal prosecution, license revocation

2. **Protects Individuals** - Shields employees from personal legal liability

3. **Saves Time** - 1-second check vs 4-5 days wasted work on prohibited products

4. **Zero Tolerance** - Catches 100% of prohibited items (false negative rate: 0%)

5. **Always Current** - Daily OFAC updates, real-time API checks, continuous monitoring

But here's the real magic: **The agent doesn't just say "no"—it explains why, suggests alternatives, and guides users to compliant solutions.** Instead of a frustrating dead-end, it's a helpful redirect toward legitimate business opportunities.

That's the power of intelligent compliance automation.

---

**Agent Summary: 8 Critical Agents Completed!**

1. ✅ Product Ideation Agent
2. ✅ Classification Router Agent
3. ✅ Template Auto-Fill Engine
4. ✅ ML-Based Prediction Sub-Agent
5. ✅ KB Search Sub-Agent
6. ✅ Conversational Diligence Sub-Agent
7. ✅ Approval Orchestration Sub-Agent
8. ✅ Prohibited List Checker Agent

---
