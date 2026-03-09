# NPA Domain Analysis & Agent Logic Map
## Complete Reference for COO Multi-Agent Workbench

**Document Version:** 2.0 Complete Edition  
**Date:** December 25, 2025  
**Purpose:** Comprehensive domain logic, decision trees, and agent specifications for the NPA Multi-Agent Workbench

---

## 1. Executive Summary

### The Challenge
The New Product Approval (NPA) process is the critical **"Gatekeeper" function** for GFM (Global Financial Markets). It prevents the bank from trading risky or unapproved financial products.

The process is **extremely complex**, with:
- **5 approval tracks** (Full NPA, NPA Lite, Bundling, Evergreen, Prohibited)
- **33+ personas** across 9 organizational tiers
- **Multiple classification dimensions** (NTG/Variation/Existing × Full/Lite/Bundling/Evergreen)
- **Complex routing logic** with cross-border rules, validity periods, loop-backs, and circuit breakers

**Current State:**
- Average processing time: **12 days**
- First-time approval rate: **52%**
- Average rework iterations: **1.4**
- Loop-backs per month: **8**

### The Agent Solution
The **Product Ideation Agent (Phase 0)** acts as the **"Intelligent Router"**, using sophisticated classification logic to:
1. Classify product type (NTG / Variation / Existing)
2. Select approval track (Full / Lite / Bundling / Evergreen)
3. Auto-assign mandatory sign-off parties
4. Predict approval likelihood, timeline, and bottlenecks
5. Auto-fill 78% of NPA template fields
6. Schedule PIR (Post-Implementation Review) automatically

**Target State:**
- Average processing time: **4 days** (67% reduction)
- First-time approval rate: **75%** (23% improvement)
- Average rework iterations: **1.2** (14% reduction)
- 35% straight-through processing for Evergreen products

---

## 2. The Two-Stage Classification Model

### ⚠️ CRITICAL: Classification Happens in TWO Stages

**Stage 1: Product Classification** (Foundation)
- **New-to-Group (NTG)**: Never done before at MBS Group level
- **Variation**: Existing product with altered risk profile
- **Existing**: Already approved elsewhere in Group

**Stage 2: Approval Track Selection** (Routing)
- **Track A**: Full NPA
- **Track B**: NPA Lite (4 sub-types)
- **Track C**: Bundling Approval
- **Track D**: Evergreen
- **Track E**: Hard Stop (Prohibited)

### Why Two Stages?

**Stage 1 determines WHAT this is** (ontology)  
**Stage 2 determines HOW to approve it** (workflow)

**Example Flow:**
```
User describes: "FX Option on EUR/USD, $50M notional, 6-month tenor, BBB+ counterparty"

Stage 1: Product Classification
├─ Search historical NPAs → Found TSG1917 (FX Option, approved 2023)
├─ Check scope: Singapore desk only (no cross-border)
├─ Check changes: Same structure, same risk profile
└─ CLASSIFICATION: "Existing" (already done in Group)

Stage 2: Approval Track Selection
├─ Check TSG1917 status: Approved 8 months ago (still valid)
├─ Check Evergreen eligibility: FX Option is on Evergreen list
├─ Check Evergreen limits: 3 of 10 deals used, $80M of $500M notional used
└─ TRACK: "Evergreen" (Trade immediately, log transaction)

Result: Trade executed same day, no NPA needed (just log Evergreen usage)
```

---

## 3. Stage 1: Product Classification Logic

### 3.1 New-to-Group (NTG)

**Definition:**
Products that have NEVER been approved anywhere in MBS Group.

**Criteria (ANY of the following):**
1. **New businesses, initiatives, products, financial instruments**
   - Example: MBS has never traded Credit Default Swaps (CDS) → NTG
   
2. **New roles within a product group**
   - Example: We've distributed FX Options, but never traded as principal → NTG
   
3. **New distribution channels or customer segments**
   - Example: We've sold to institutions, but never to retail via mobile app → NTG
   
4. **New exchange memberships**
   - Example: First time joining Singapore Exchange (SGX) for futures → NTG
   
5. **New markets/geographies**
   - Example: First time offering product in Vietnam → NTG

**Mandatory Requirements for NTG:**
- ✅ **PAC (Product Approval Committee) approval REQUIRED** before NPA starts
- ✅ **Full NPA** (never NPA Lite)
- ✅ **All sign-off parties** engaged (Credit, Finance, Legal, MLR, Ops, Tech, Compliance)
- ✅ **PIR (Post-Implementation Review) mandatory** within 6 months of launch
- ✅ **Validity**: 1 year from approval (can extend once for +6 months)

**Agent Implication:**
```
IF (classification == "NTG") THEN:
    approval_track = "Full NPA"
    pac_approval_required = TRUE
    pir_mandatory = TRUE
    sign_off_parties = ["Credit", "Finance", "Legal", "MLR", "Ops", "Tech", "Compliance"]
    validity_period = 365 days
    extension_allowed = TRUE (once, +180 days, requires unanimous SOP consent)
```

---

### 3.2 Variation

**Definition:**
Modification to an existing product that **alters the risk profile** for the customer and/or the bank.

**Criteria (ANY of the following):**
1. **Bundling or combination** of existing products
   - Example: FX Option + Deposit → Dual Currency Deposit (DCD)
   
2. **Cross-book structures** (banking vs trading books)
   - Example: Loan combined with interest rate swap
   
3. **Change in accounting treatment**
   - Example: Accrual accounting → Mark-to-market
   - **Action**: Consult Group Finance when in doubt
   
4. **Significant offline/manual workarounds required**
   - Example: Product requires manual Excel calculations because system can't handle it
   
5. **Sustainability features or labels**
   - Example: "Green" bond, "ESG" loan
   
6. **Use of advanced/innovative technology**
   - Example: Collaboration with fintech company, blockchain-based settlement
   
7. **New third-party communication channels**
   - Example: Offering product via WhatsApp, WeChat for first time
   - Must be risk-assessed platforms

**Approval Track Decision for Variations:**
```
IF (variation_risk_severity == "HIGH") THEN:
    approval_track = "Full NPA"
    # Examples: New accounting treatment, cross-book structure, fintech partnership
    
ELSE IF (variation_risk_severity == "MEDIUM") THEN:
    approval_track = "NPA Lite"
    # Examples: Minor bundling (both blocks approved), adding settlement option
    
ELSE IF (variation_risk_severity == "LOW") THEN:
    approval_track = "NPA Lite - Addendum"
    # Examples: Typo correction, clarification of existing terms
```

**Agent Implication:**
The agent must ask **follow-up questions** to assess risk severity:
- "Does this change how we book or account for the product?"
- "Does this require new systems or manual processes?"
- "Does this expose us to new counterparty, market, or operational risks?"

---

### 3.3 Existing

**Definition:**
Products already approved elsewhere in MBS Group, now being introduced to a new location/desk/entity.

**Criteria (ANY of the following):**
1. **New to location/desk/entity**
   - Example: FX Option approved in Singapore, now Hong Kong desk wants to trade it
   
2. **Dormant** (no transactions in last 12 months)
   - Example: Credit Default Swap approved in 2022, but no trades since Feb 2024
   
3. **Expired** (not launched within validity period)
   - Example: NPA approved Jan 2024, but never traded → Expired Jan 2025

**Approval Track Decision for Existing:**
```
IF (original_npa_status == "ACTIVE" AND validity_remaining > 0 days) THEN:
    IF (product_on_evergreen_list == TRUE) THEN:
        approval_track = "Evergreen"
        # Check limits before allowing trade
    ELSE:
        approval_track = "NPA Lite - Reference Existing"
        # Fast-track: Just confirm no variations
        
ELSE IF (original_npa_status == "DORMANT" AND dormant_period < 3 years) THEN:
    approval_track = "NPA Lite - Fast-Track Dormant Reactivation"
    # 48-hour notice, no objection = auto-approve
    
ELSE IF (original_npa_status == "DORMANT" AND dormant_period >= 3 years) THEN:
    approval_track = "Full Assessment Required"
    # May need Full NPA or NPA Lite depending on GFM COO decision
    
ELSE IF (original_npa_status == "EXPIRED" AND no_variations == TRUE) THEN:
    approval_track = "NPA Lite - Reactivation"
    pir_required = TRUE  # Treated as extension of original Full NPA
    
ELSE IF (original_npa_status == "EXPIRED" AND variations_detected == TRUE) THEN:
    approval_track = "Full NPA"
    # Variations to expired NPA = effectively New-to-Group
```

---

## 4. Stage 2: Approval Track Selection

### Track A: Full NPA (The Heavy Lifter)

**When to Use:**
- ✅ ALL New-to-Group (NTG) products
- ✅ High-risk Variations (accounting changes, cross-book, fintech)
- ✅ Expired products with variations
- ✅ Products with significant regulatory implications

**Workflow:**
```
Stage 1: Discovery (Product Ideation)
  ↓
Stage 2: Review (Maker submits, Checker validates)
  ↓
Stage 3: Sign-Off (Parallel approvals: Credit, Finance, Legal, etc.)
  ↓
Stage 4: Preparing for Launch (System config, UAT)
  ↓
Stage 5: Ready for Launch (Final checks)
  ↓
Stage 6: Launched + PIR/Monitoring
```

**Sign-Off Parties (ALL required):**
- ✅ Credit (RMG-Credit)
- ✅ Finance (Group Product Control)
- ✅ Legal & Compliance
- ✅ Market & Liquidity Risk (MLR)
- ✅ Operations
- ✅ Technology
- ✅ Operational Risk (RMG-OR) - Consultative role

**Additional if Cross-Border:**
- ✅ ALL above are MANDATORY (cannot be waived)

**Timeline:**
- Baseline: 12 days average
- Target (with AI): 4 days
- Breakdown (current):
  - Review: 2-3 days
  - Sign-Off: 6-8 days (parallel: Credit 1.2d, Finance 1.8d, Legal 1.1d)
  - Launch Prep: 2-3 days

**Metrics:**
- NPAs processed (last 30 days): 47
- First-time approval rate: 52%
- Average rework iterations: 1.4

---

### Track B: NPA Lite (The Agile Track)

**When to Use:**
- ✅ Variations of existing products (low-medium risk)
- ✅ Products new to location (already approved elsewhere)
- ✅ Dormant reactivations (<3 years)
- ✅ Expired products (no variations)
- ✅ Minor updates to live NPAs

**4 Sub-Types:**

#### B1: Impending Deal (48-Hour Express Approval)

**Criteria (ALL must be true):**
1. ✅ NPA Lite in nature (variation of existing)
2. ✅ Back-to-Back (BTB) deal with professional counterparty
3. ✅ OR dormant/expired product (UAT completed, no system changes)
4. ✅ OR minor variation (model validated, UAT completed)
5. ✅ OR Singapore-approved NPA applicable regionally (BTB basis with SG)
6. ✅ Satisfies all pre-approved conditions from support units

**Process:**
- Maker submits using standard NPA Lite template
- 48-hour notice period to all SOPs
- If ANY SOP objects → Express Approval fails → Route to standard NPA Lite
- If no objections after 48 hours → Auto-approved

**Timeline:** 48 hours (2 business days)

**Agent Implication:**
```
IF (impending_deal_criteria_met == TRUE) THEN:
    approval_mode = "Express Approval"
    notice_period = 48 hours
    auto_approve_if_no_objections = TRUE
    notification_channels = ["Email", "Slack", "In-App"]
    escalation_if_objection = "Route to Standard NPA Lite"
```

---

#### B2: NLNOC (NPA Lite No Objection Concurrence)

**Criteria:**
- Simple change to payoff of approved product
- Reactivation of dormant/expired NPA (no structural changes)
- Simple product/process not covered by existing NPA

**Decision Authority:**
- GFM COO + Head of RMG-MLR jointly determine eligibility
- Support Units provide "no-objection concurrence" (not full sign-off)

**Process:**
1. PU NPA Champion performs self-assessment
2. Engages SUs for no-objection concurrence (timeline set by GFM COO Office)
3. GFM COO approves once all concurrences received
4. Logged in GRC system for record-keeping
5. Technical sign-offs triggered in GRC (post-approval documentation)
6. PIR initiated when product launches

**Timeline:** Determined by PU/PU NPA Champion (typically 5-10 days)

**Agent Implication:**
```
IF (nlnoc_criteria_met == TRUE) THEN:
    approval_mode = "No Objection Concurrence"
    decision_authority = ["GFM COO", "Head of RMG-MLR"]
    sign_off_type = "Concurrence" (not full sign-off)
    timeline_flexibility = TRUE
    pir_required = TRUE
```

---

#### B3: Fast-Track Dormant Reactivation

**Criteria (ALL must be true):**
1. ✅ Existing live trade in the past
2. ✅ Product NOT on prohibited list
3. ✅ PIR completed for original NPA
4. ✅ NO variation or changes in booking

**Process:**
- 48-hour notice period (same as Impending Deal)
- Auto-approval if no SOP objections
- Treated as "automatic reactivation"

**Timeline:** 48 hours (2 business days)

**Agent Implication:**
```
IF (dormant_reactivation_criteria_met == TRUE) THEN:
    approval_mode = "Fast-Track Reactivation"
    notice_period = 48 hours
    auto_approve_if_no_objections = TRUE
    pir_status_check = "Must be completed"
    variation_check = "Must be none"
```

---

#### B4: Approved NPA Addendum

**Criteria:**
- Minor/incremental updates to **live** (not expired) NPA
- Examples: Adding cash/physical settlement, bilateral → tripartite, typos, clarifications
- **NOT eligible**: New features, new payoffs (require full NPA Lite)

**Process:**
1. PU proposes updates
2. SOPs review and agree (or reject)
3. Original NPA document updated with incremental info
4. Original NPA reference kept intact (same GFM ID, same NPOS ID)
5. Validity period NOT extended (maintains original expiry date)
6. SOPs' decisions recorded in live NPA document

**Timeline:** Should be brief (aim for <5 days to minimize inefficiency)

**Sign-Off Grid:** Follows NPA Lite sign-off requirements

**Agent Implication:**
```
IF (addendum_criteria_met == TRUE) THEN:
    approval_mode = "Addendum"
    npa_status_required = "LIVE" (not expired)
    variation_scope = "Minor only"
    validity_extension = FALSE (keeps original expiry)
    timeline_target = 5 days (to minimize inefficiency)
    
IF (proposed_changes == "New feature" OR "New payoff") THEN:
    rejection_reason = "Not eligible for Addendum - requires NPA Lite"
    recommended_action = "Submit as new NPA Lite"
```

---

### Track C: Bundling Approval (The LEGO Master)

**Definition:**
Combining two or more **already-approved** "Building Blocks" into a structure.

**Key Concept:**
- **Building Block**: Each individual component (e.g., FX Option, FX Forward, Deposit)
- **Bundle**: The combined structure (e.g., Dual Currency Deposit = FX Option + Deposit)

**When to Use:**
- ✅ All building blocks individually approved
- ✅ No new pricing model required
- ✅ Legal confirmation differs from internal booking (single Term Sheet, multiple internal deals)

**Bundling vs NPA:**
```
IF (all_blocks_approved == TRUE AND bundling_conditions_met == TRUE) THEN:
    approval_route = "Bundling Approval Process" (via Arbitration Team)
ELSE:
    approval_route = "Full NPA or NPA Lite" (standard process)
```

**8 Bundling Conditions (ALL must pass):**

| # | Condition | Pass/Fail |
|---|-----------|-----------|
| 1 | Building blocks can be booked in Murex/Mini/FA with no new model required | Y/N |
| 2 | No proxy booking in the transaction | Y/N |
| 3 | No leverage in the transaction | Y/N |
| 4 | No collaterals involved (or can be reviewed but not auto-rejection) | Y/N |
| 5 | No third parties involved | Y/N |
| 6 | Compliance considerations in each block complied with (PDD form submitted) | Y/N |
| 7 | No SCF (Structured Credit Financing) except structured warrant bundle | Y/N |
| 8 | Bundle facilitates correct cashflow settlement | Y/N |

**Bundling Arbitration Team:**
- Head of GFM COO Office NPA Team
- RMG-MLR
- TCRM (Technology & Credit Risk Management)
- Finance-GPC (Group Product Control)
- GFMO (GFM Operations)
- GFM Legal & Compliance

**Process:**
1. PU submits Bundling Approval Form (Appendix I of GFM SOP)
2. Arbitration Team reviews within agreed timeline
3. Check all 8 conditions
4. If ALL pass → Approve (track in offline list maintained by GFM COO Office)
5. If ANY fail → Reject → Route to NPA Lite or Full NPA

**Timeline:** Faster than Full NPA (typically 5-10 days)

**Evergreen Bundles (No Bundling Approval Needed):**
- Dual Currency Deposit/Notes (FX Option + LNBR/Deposit/Bond)
- Treasury Investment Asset Swap (Bond + IRS)
- Equity-Linked Note (Equity Option + LNBR)

**Approved FX Derivative Bundles (Examples):**
- Best/Worst of Option
- KIKO (Knock-In Knock-Out) CLI
- Boosted KO Forward with Guarantee
- Multi-period EKI Strangle
- Pivot Forward
- Trigger Forward
- Range Coupon CCY Linked SIP
- (Full list: 28+ approved bundles in "List of approved FX Bundled products.xlsx")

**Agent Implication:**
```
IF (user_describes_combination == TRUE) THEN:
    trigger = "Bundling Detection"
    
    # Step 1: Identify building blocks
    blocks = extract_components(user_description)
    
    # Step 2: Check if all blocks approved
    FOR each block IN blocks:
        IF (block_approval_status != "APPROVED") THEN:
            routing_decision = "Full NPA or NPA Lite"
            reason = "Block '{block}' not yet approved"
            RETURN
    
    # Step 3: Check if bundle on Evergreen list
    IF (bundle IN evergreen_bundle_list) THEN:
        routing_decision = "No Bundling Approval Needed"
        reason = "Evergreen bundle - trade immediately"
        RETURN
    
    # Step 4: Check if bundle already approved
    IF (bundle IN approved_bundle_list) THEN:
        routing_decision = "Approved Bundle - Use Designated Package Typology"
        RETURN
    
    # Step 5: Check 8 bundling conditions
    conditions_result = check_bundling_conditions(bundle)
    
    IF (all_conditions_pass == TRUE) THEN:
        routing_decision = "Bundling Approval Process"
        assign_to = "Bundling Arbitration Team"
    ELSE:
        routing_decision = "Full NPA or NPA Lite"
        reason = "Bundling conditions not met: {failed_conditions}"
```

---

### Track D: Evergreen (The Fast Pass)

**Definition:**
Standard, vanilla products that are **"Always On"** for 3 years, allowing immediate trading within pre-set limits.

**Strategic Purpose:**
- Avoid constant NPA renewals for products that must be continuously offered
- Reduce NPA Working Group workload
- Enable competitive responsiveness (can trade immediately)

**Evergreen Product Characteristics (General Guidelines):**
1. ✅ No significant changes since last approval (no structural variation)
2. ✅ Back-to-Back (BTB) basis with professional counterparty
3. ✅ Vanilla/foundational product (building block for other variants)
4. ✅ Liquidity management product (including for MBS Group Holdings)
5. ✅ Exchange product used as hedge against customer trades
6. ✅ ABS (Asset-Backed Securities) origination to meet client demand

**Out of Scope:**
- ❌ Products requiring deal-by-deal approval
- ❌ Products dormant/expired for >3 years
- ❌ Joint-unit NPAs (Evergreen is GFM-only)

**Evergreen Limits (GFM-Wide):**

| Limit Type | Scope | Currency | Amount |
|------------|-------|----------|--------|
| **Total Notional** | Aggregated GFM-wide | USD | $500,000,000 |
| **Long Tenor Notional** (>10Y) | Aggregated GFM-wide | USD | $250,000,000 (sub-limit) |
| **Non-Retail Deal Cap** | Per NPA | Deal Count | 10 deals |
| **Retail Deal Cap** | Per NPA | Deal Count | 20 deals |
| **Retail Transaction Size** | Per trade | USD | $25,000,000 |
| **Retail Aggregate Notional** | All retail products | USD | $100,000,000 (sub-limit) |

**Special Exemptions:**
- Liquidity management products: Notional and trade count caps **waived** (due to exigency)

**Counting Rules:**
- Only **customer leg** counts (BTB/hedge leg excluded)
- Bond issuance: Deal count = Tranche count = Client-facing deals

**Evergreen Validity:**
- **3 years** from approval date (GFM deviation approved 21-Feb-2023)
- Annual review required (remove if dormant >3 years at review)
- Products reactivated via NPA Lite automatically maintain Evergreen status for:
  - NPA approval date + 3 years, OR
  - Last transaction date during NPA validity + 3 years

**Process When Trading Evergreen Product:**
```
1. Sales/Trader executes deal
2. IMMEDIATELY email: GFM COD SG – COE NPA with deal details
3. SG NPA Team updates Evergreen limits worksheet (chalk usage)
4. Location COO Office confirms within 30 min (sanity check)
5. Initiate NPA Lite reactivation (parallel process)
6. When NPA Lite approved → Uplift Evergreen limits (restore capacity)
```

**Agent Implication:**
```
IF (product_on_evergreen_list == TRUE) THEN:
    # Step 1: Check limits
    current_usage = get_evergreen_usage(product_npa_id)
    
    IF (product_type == "Liquidity Management") THEN:
        limit_check = "WAIVED"
        allow_trade = TRUE
    ELSE:
        IF (current_usage.notional + deal_notional <= total_notional_limit) AND 
           (current_usage.deal_count < deal_cap) AND
           (deal_notional <= retail_transaction_size_cap IF retail) THEN:
            allow_trade = TRUE
        ELSE:
            allow_trade = FALSE
            escalation_required = "GFM COO approval for additional trades"
    
    # Step 2: If allowed, log and chalk
    IF (allow_trade == TRUE) THEN:
        log_trade(product_npa_id, deal_details)
        update_evergreen_limits(product_npa_id, deal_notional, deal_count=1)
        notify(channel="GFM COD SG – COE NPA", message=deal_details)
        initiate_npa_lite_reactivation(product_npa_id)
    
    # Step 3: Monitor for uplift
    ON npa_lite_approval:
        uplift_evergreen_limits(product_npa_id, deal_notional, deal_count=1)
```

**Evergreen Approval Process (Initial):**
1. PU proposes product for Evergreen eligibility
2. NPA Working Group assesses against criteria (FAQ/Checklist in Appendix VII)
3. Location COO Office endorses (for locations)
4. NPA Governance Forum approves
5. Annual review by same Working Group

**Annual Review:**
- Purpose 1: Remove NPAs with expired Evergreen status (>3 years dormant)
- Purpose 2: Interim check to ensure NPAs remain eligible (early termination if needed)
- Scope: All approved Evergreen products still in active status
- Sign-Off: Same Working Group that originally approved

---

### Track E: Hard Stop (The Police)

**Definition:**
Products/jurisdictions explicitly banned by bank policy or regulation.

**Prohibited List Sources:**
1. Internal bank policy (risk appetite, reputational concerns)
2. Regulatory restrictions (MAS, CFTC, local regulations)
3. Sanctions/embargoes (OFAC, UN, EU)

**Process:**
```
IF (product IN prohibited_list OR jurisdiction IN prohibited_list) THEN:
    decision = "HARD STOP"
    reason = "Product/Jurisdiction prohibited - cannot proceed"
    escalation_option = "Contact Compliance for exception request"
    log_attempt = TRUE (for audit/monitoring)
```

**Agent Implication:**
```
# Phase 0 - Immediate Check (before any processing)
prohibited_check_result = check_prohibited_list(product_description, jurisdiction)

IF (prohibited_check_result == "PROHIBITED") THEN:
    display_message = "❌ HARD STOP: This product/jurisdiction is prohibited."
    display_reason = prohibited_check_result.reason
    display_contact = "Please contact Compliance if you believe this is an error."
    halt_workflow = TRUE
    log_event(type="Prohibited Product Attempt", user=current_user, details=product_description)
```

---

## 5. Cross-Cutting Rules (Apply to ALL Tracks)

### 5.1 Cross-Border Booking (Mandatory Sign-Offs)

**Definition:**
Product involves booking across multiple locations/entities.

**Example:**
- Singapore desk trades with Hong Kong entity
- London desk books deal in Singapore books

**Mandatory Sign-Off Parties (NON-NEGOTIABLE):**
- ✅ Finance (Group Product Control)
- ✅ RMG-Credit
- ✅ RMG-Market & Liquidity Risk (MLR)
- ✅ Technology
- ✅ Operations

**Agent Implication:**
```
# Phase 0 Interview Question
question = "Will this product involve cross-border booking? 
            (e.g., Singapore desk trading with Hong Kong entity)"

IF (cross_border == TRUE) THEN:
    mandatory_sign_offs.add(["Finance", "RMG-Credit", "MLR", "Technology", "Operations"])
    display_alert = "⚠️ Cross-border booking detected: Finance, Credit, MLR, Tech, Ops sign-offs are MANDATORY"
```

---

### 5.2 Validity Period & Extensions

**Standard Validity:**
- **1 year** from approval date (for Full NPA and NPA Lite)

**Extension Rules:**
- Can extend **ONCE** for +6 months (total 18 months)
- Extension requires:
  - ✅ Unanimous consensus from all original sign-off parties
  - ✅ No variation to product features
  - ✅ No alteration to risk profile
  - ✅ No change to operating model
  - ✅ Approval from Group BU/SU COO

**Evergreen Exception:**
- **3 years** from approval date (GFM deviation)

**Agent Implication:**
```
# At NPA Approval
approval_date = today()
validity_expiry = approval_date + 365 days (or 1095 days if Evergreen)

# Schedule notifications
schedule_notification(
    date = validity_expiry - 30 days,
    message = "NPA {npa_id} expires in 30 days. Extend or launch?",
    recipients = [Maker, NPA Champion]
)

schedule_notification(
    date = validity_expiry - 7 days,
    message = "NPA {npa_id} expires in 7 days. URGENT: Extend or launch?",
    recipients = [Maker, NPA Champion, Group BU/SU COO]
)

# Extension Request Handler
IF (extension_request_received == TRUE) THEN:
    IF (extensions_used < 1) AND 
       (no_variations == TRUE) AND 
       (risk_profile_unchanged == TRUE) AND
       (operating_model_unchanged == TRUE) THEN:
        request_unanimous_sop_consensus()
        IF (consensus == "UNANIMOUS YES") THEN:
            request_coo_approval()
            IF (coo_approved == TRUE) THEN:
                validity_expiry = validity_expiry + 180 days
                extension_count = 1
            END IF
        END IF
    ELSE:
        rejection_reason = "Extension criteria not met or already extended once"
    END IF
```

---

### 5.3 Post-Implementation Review (PIR)

**Mandatory for:**
1. ✅ ALL New-to-Group (NTG) products (even without conditions)
2. ✅ ALL products with post-launch conditions
3. ✅ (GFM Stricter Rule) ALL launched products (regardless of type)

**Timeline:**
- Must be initiated **within 6 months** of launch
- If variations not fully tested in PIR → PIR must be repeated

**Purpose:**
1. Confirm requirements documented in NPA are adhered to
2. Address issues not identified before launch
3. Ensure post-launch conditions satisfied
4. Assess performance vs original expectations
5. Capture lessons learned for future NPAs

**Sign-Offs Required:**
- All original SOPs who imposed conditions
- All SOPs for NTG products (even without conditions)

**Agent Implication:**
```
# At Product Launch
launch_date = today()
pir_due_date = launch_date + 180 days

# Auto-schedule PIR
create_pir_task(
    npa_id = npa_id,
    due_date = pir_due_date,
    assigned_to = [Original_Maker, NPA_Champion],
    sign_off_parties = original_sops_with_conditions (or all_sops if NTG)
)

# Schedule reminders
schedule_notification(
    date = pir_due_date - 60 days,
    message = "PIR for NPA {npa_id} due in 60 days. Begin preparation.",
    recipients = [Maker, NPA Champion]
)

schedule_notification(
    date = pir_due_date - 30 days,
    message = "PIR for NPA {npa_id} due in 30 days. Submit sample live deal info.",
    recipients = [Maker, NPA Champion]
)

schedule_notification(
    date = pir_due_date - 7 days,
    message = "PIR for NPA {npa_id} due in 7 days. URGENT.",
    recipients = [Maker, NPA Champion, Group BU/SU COO]
)

# PIR Repeat Logic
IF (pir_submitted == TRUE) THEN:
    sop_reviews = collect_sop_feedback()
    
    IF (issues_identified == TRUE OR variations_not_fully_tested == TRUE) THEN:
        display_message = "⚠️ SOPs request PIR repetition"
        reason = sop_reviews.repeat_reason
        create_pir_task(npa_id, due_date = today() + 90 days, iteration = 2)
    END IF
```

---

### 5.4 Loop-Back Scenarios & Circuit Breaker

**Loop-Back Types:**

#### Type 1: Checker Rejection (Major Loop-Back)
```
Maker Submits (Discovery) → Checker Reviews → REJECTS
                             ↓
            Loop-Back to Maker (Draft/Discovery Stage)
                             ↓
            Maker Fixes → Re-submits → Checker Reviews Again
```
**Impact:** +3-5 days per iteration

**Prevention:**
- AI proactive flagging before submission
- Auto-completeness checks (98% gap detection)
- Similarity matching ("TSG1917 rejected for missing collateral details")

---

#### Type 2: Approval Clarification (Smart Loop-Back)
```
Credit Approver Reviews → Needs Clarification
         ↓
AI Decision: Does this require NPA changes?
         ├─ YES → Loop-Back to Maker (NPA modification needed)
         └─ NO → Direct response to Approver (no loop-back)
```

**Smart Routing Logic:**
```
IF (clarification_requires_npa_field_changes == TRUE) OR 
   (clarification_requires_document_updates == TRUE) THEN:
    route_to = "Maker" (full loop-back)
    
ELSE IF (clarification_answerable_from_existing_docs == TRUE) OR 
         (clarification_answerable_from_kb == TRUE) THEN:
    ai_drafts_response()
    checker_reviews_ai_response()
    IF (checker_approves == TRUE) THEN:
        send_to_approver() (no loop-back to Maker)
    END IF
    
ELSE:
    escalate_to_human_decision()
```

**Time Saved:** ~2-3 days per clarification that doesn't need loop-back

---

#### Type 3: Launch Preparation Issues
```
Preparing for Launch → System config fails → Legal review needed again
                       ↓
       Loop-Back to Sign-Off Stage (Legal only)
                       ↓
       Legal Approves → Resume Launch Prep
```

**Typical Causes:**
- System compatibility issues discovered late
- Regulatory requirement changes
- Risk threshold breaches during final checks

**AI Mitigation:**
- Early system compatibility checks during Diligence stage
- Real-time regulatory monitoring (alerts on policy changes)
- Predictive risk modeling before launch prep

---

#### Type 4: Post-Launch Corrective Action
```
Launched → PIR identifies issue → Requires NPA amendment
           ↓
   Loop-Back to Review Stage (expedited re-approval)
           ↓
   Approved → Re-launched with fixes
```

**PIR Triggers:**
- Trading volume lower than projected
- Unexpected operational issues
- Customer feedback requiring product changes
- Regulatory findings

---

### Circuit Breaker Rule

**Trigger:** After **3 loop-backs** on the same NPA

**Action:** Auto-escalate to:
- Group BU/SU COO
- NPA Governance Forum

**Reason:** Indicates fundamental issue:
- Unclear requirements
- Complex edge case
- Process breakdown

**Agent Implication:**
```
# Track loop-backs per NPA
IF (npa_loop_back_count >= 3) THEN:
    trigger_circuit_breaker = TRUE
    
    escalation_message = """
    🚨 CIRCUIT BREAKER TRIGGERED
    
    NPA: {npa_id}
    Loop-Back Count: {loop_back_count}
    Reason: Indicates fundamental issue requiring senior review
    
    History:
    - Iteration 1: {reason_1} ({date_1})
    - Iteration 2: {reason_2} ({date_2})
    - Iteration 3: {reason_3} ({date_3})
    
    Escalated to: Group BU/SU COO, NPA Governance Forum
    """
    
    send_notification(
        recipients = [COO, NPA_Governance_Forum, Maker, NPA_Champion],
        message = escalation_message,
        priority = "CRITICAL"
    )
    
    halt_normal_workflow = TRUE
    require_manual_intervention = TRUE
```

**Metrics to Track:**
- Loop-backs Today: 8
- Average Iterations per NPA: 1.4
- Escalations Due to Circuit Breaker: 1
- **Target**: Reduce iterations from 1.4 → 1.2 (14% reduction)

---

## 6. Phase 0: AI-Powered Conversational Flow (Complete)

### The Product Ideation Agent Interview Script

**Goal:** Replace 47-field manual form with 10-15 question conversational AI interview that:
- Gathers essential information naturally
- Classifies product type (NTG/Variation/Existing)
- Selects approval track (Full/Lite/Bundling/Evergreen/Prohibited)
- Auto-fills 78% of NPA template fields
- Predicts approval likelihood, timeline, bottlenecks

**Interview Flow:**

---

### **Step 1: Discovery**

**Questions:**
1. "Describe the product in your own words. What is it, and what does it do?"
2. "What is the underlying asset or reference rate?" (e.g., EUR/USD, S&P 500, LIBOR)
3. "Explain the payout logic. When and how does the customer get paid?"
4. "What is the notional value or maximum exposure?" (e.g., $50M)
5. "Who is the target customer?" (Retail, Corporate, Institutional)

**AI Actions:**
- Extract key entities: Product type, underlying, structure, notional, customer segment
- Perform initial classification guess (confidence score)

---

### **Step 2: Pre-Screen Checks**

#### 2A: Prohibited List Check (HARD STOP)
```
prohibited_check = check_prohibited_list(product_description, jurisdiction)

IF (prohibited_check == "PROHIBITED") THEN:
    display_message = "❌ HARD STOP: This product/jurisdiction is prohibited."
    display_reason = prohibited_check.reason
    display_contact = "Contact Compliance if you believe this is an error."
    halt_workflow = TRUE
    EXIT
```

---

#### 2B: Cross-Border Detection
**Question:**
"Will this product involve cross-border booking?"  
(e.g., Singapore desk trading with Hong Kong entity)

```
IF (cross_border == TRUE) THEN:
    mandatory_sign_offs.add(["Finance", "RMG-Credit", "MLR", "Technology", "Operations"])
    display_alert = """
    ⚠️ Cross-border booking detected
    
    The following sign-offs are MANDATORY and cannot be waived:
    • Finance (Group Product Control)
    • RMG-Credit
    • RMG-Market & Liquidity Risk (MLR)
    • Technology
    • Operations
    """
```

---

#### 2C: Bundling Detection
```
IF (product_description contains "combination" OR "bundled" OR "packaged") THEN:
    ask_question = "Is this a combination of multiple products?"
    
    IF (answer == "YES") THEN:
        ask_question = "What are the individual components?"
        extract_building_blocks(answer)
        trigger_bundling_logic = TRUE
```

---

### **Step 3: Similarity Search (RAG)**

**Action:**
```
# Search 1,784+ historical NPAs using semantic similarity
similar_npas = search_historical_npas(
    query = product_description,
    top_k = 5,
    similarity_threshold = 0.80
)

FOR each similar_npa IN similar_npas:
    display_result = f"""
    📄 Similar NPA Found (Match: {similar_npa.similarity_score}%)
    
    • NPA ID: {similar_npa.id}
    • Product: {similar_npa.name}
    • Status: {similar_npa.status} ({similar_npa.validity_status})
    • Approved: {similar_npa.approval_date} ({days_since_approval} days ago)
    • Desk: {similar_npa.desk}
    • Outcome: {similar_npa.outcome} in {similar_npa.timeline} days
    • Conditions: {similar_npa.post_launch_conditions}
    """
    
    # Validity Check
    IF (similar_npa.approval_date + 365 days > today()) THEN:
        validity_status = "✅ ACTIVE"
    ELSE IF (similar_npa.approval_date + 365 days <= today() AND dormant_period < 1095 days) THEN:
        validity_status = "⚠️ EXPIRED (can reactivate)"
    ELSE:
        validity_status = "❌ STALE (dormant >3 years)"
```

**Follow-Up Question:**
"Is this exactly the same as NPA {similar_npa.id}, or are there differences?"

```
IF (answer == "EXACTLY THE SAME" AND similar_npa.validity_status == "ACTIVE") THEN:
    check_evergreen_eligibility()
    
ELSE IF (answer == "SIMILAR BUT WITH CHANGES") THEN:
    ask_question = "What has changed compared to {similar_npa.id}?"
    classify_as_variation = TRUE
```

---

### **Step 4: Product Classification (Stage 1)**

**Decision Logic:**
```
# Initialize classification
classification = None
confidence_score = 0.0

# Rule 1: Check for exact match with active NPA
IF (exact_match_found == TRUE AND similar_npa.status == "ACTIVE") THEN:
    classification = "Existing"
    confidence_score = 0.95
    sub_classification = "Reference Existing"

# Rule 2: Check if dormant/expired
ELSE IF (exact_match_found == TRUE AND similar_npa.status == "DORMANT") THEN:
    dormant_period = calculate_dormant_period(similar_npa.last_trade_date)
    
    IF (dormant_period < 1095 days) THEN:  # <3 years
        classification = "Existing"
        sub_classification = "Dormant Reactivation"
        confidence_score = 0.90
    ELSE:  # >=3 years
        classification = "Requires Assessment"
        confidence_score = 0.60
        escalation_note = "Dormant >3 years - GFM COO decision required"

# Rule 3: Check if expired with no variations
ELSE IF (exact_match_found == TRUE AND similar_npa.status == "EXPIRED" AND no_variations == TRUE) THEN:
    classification = "Existing"
    sub_classification = "Expired Reactivation"
    confidence_score = 0.85

# Rule 4: Check for variation signals
ELSE IF (exact_match_found == TRUE AND variations_detected == TRUE) THEN:
    classification = "Variation"
    variation_risk_severity = assess_variation_risk(variations)
    confidence_score = 0.85

# Rule 5: Check if new to location/desk
ELSE IF (similar_npa_in_other_location == TRUE AND no_variations == TRUE) THEN:
    classification = "Existing"
    sub_classification = "New to Location/Desk"
    confidence_score = 0.80

# Rule 6: No similar NPA found anywhere in Group
ELSE IF (no_similar_npa_found == TRUE) THEN:
    classification = "New-to-Group (NTG)"
    confidence_score = 0.90

# Confidence check
IF (confidence_score < 0.75) THEN:
    escalate_to_human = TRUE
    display_message = """
    ⚠️ Classification Confidence Low ({confidence_score}%)
    
    I need human expertise to classify this product accurately.
    Escalating to: GFM COO + Head of RMG-MLR
    """
```

**Display to User:**
```
✅ Product Classification: {classification}
   Confidence: {confidence_score}%
   
   Reasoning:
   • {reasoning_point_1}
   • {reasoning_point_2}
   • {reasoning_point_3}
```

---

### **Step 5: Approval Track Selection (Stage 2)**

**Decision Logic:**
```
# Initialize
approval_track = None

# Track A: Full NPA
IF (classification == "New-to-Group (NTG)") THEN:
    approval_track = "Full NPA"
    pac_approval_required = TRUE
    sign_off_parties = ["Credit", "Finance", "Legal", "MLR", "Ops", "Tech", "Compliance"]
    pir_mandatory = TRUE
    validity_period = 365 days

ELSE IF (classification == "Variation" AND variation_risk_severity == "HIGH") THEN:
    approval_track = "Full NPA"
    pac_approval_required = FALSE
    sign_off_parties = determine_sops_based_on_risk(variation_risk_areas)
    pir_mandatory = TRUE
    validity_period = 365 days

# Track B: NPA Lite
ELSE IF (classification == "Existing" AND sub_classification == "Reference Existing") THEN:
    # Check Evergreen eligibility
    IF (product_on_evergreen_list == TRUE) THEN:
        approval_track = "Evergreen"
        check_evergreen_limits()
    ELSE:
        approval_track = "NPA Lite - Reference Existing"
        sign_off_parties = ["Credit", "Finance", "MLR"]  # Reduced set

ELSE IF (classification == "Existing" AND sub_classification == "Dormant Reactivation" AND dormant_period < 1095 days) THEN:
    # Check Fast-Track criteria
    IF (pir_completed == TRUE AND no_variations == TRUE AND not_on_prohibited_list == TRUE) THEN:
        approval_track = "NPA Lite - Fast-Track Dormant Reactivation"
        timeline = "48 hours"
    ELSE:
        approval_track = "NPA Lite - Dormant Reactivation"
        timeline = "5-10 days"

ELSE IF (classification == "Existing" AND sub_classification == "Expired Reactivation" AND no_variations == TRUE) THEN:
    approval_track = "NPA Lite - Reactivation"
    pir_mandatory = TRUE  # Treated as extension of original Full NPA

ELSE IF (classification == "Variation" AND variation_risk_severity == "MEDIUM") THEN:
    approval_track = "NPA Lite"
    sign_off_parties = determine_sops_based_on_risk(variation_risk_areas)

ELSE IF (classification == "Variation" AND variation_risk_severity == "LOW") THEN:
    # Check if this is just a minor update to live NPA
    IF (original_npa_status == "LIVE") THEN:
        approval_track = "NPA Lite - Addendum"
        timeline = "5 days"
    ELSE:
        approval_track = "NPA Lite"

# Track C: Bundling
ELSE IF (bundling_detected == TRUE) THEN:
    bundling_conditions_met = check_bundling_conditions(building_blocks)
    
    IF (all_blocks_approved == TRUE AND bundling_conditions_met == TRUE) THEN:
        approval_track = "Bundling Approval"
        assign_to = "Bundling Arbitration Team"
        timeline = "5-10 days"
    ELSE:
        approval_track = "Full NPA or NPA Lite"
        reason = "Bundling conditions not met: {failed_conditions}"
```

**Display to User:**
```
✅ Approval Track: {approval_track}
   
   📋 Requirements:
   • Sign-Off Parties: {sign_off_parties}
   • PAC Approval: {"Required" if pac_approval_required else "Not Required"}
   • PIR: {"Mandatory" if pir_mandatory else "If Conditions Imposed"}
   • Validity: {validity_period} days
   • Estimated Timeline: {estimated_timeline} days
   
   🔮 Predictions:
   • Approval Likelihood: {approval_likelihood}%
   • Potential Bottlenecks: {bottlenecks}
   • Similar NPAs Performance:
     - TSG1917: Approved in 4 days
     - TSG2340: Approved in 6 days (Finance clarification needed)
```

---

### **Step 6: Predictive Analytics**

**Approval Likelihood Prediction:**
```
# Use ML-Based Prediction Sub-Agent (XGBoost model)
features = {
    'product_type': product_type,
    'risk_level': risk_level,
    'notional_value': notional_value,
    'counterparty_rating': counterparty_rating,
    'tenor_days': tenor_days,
    'desk_approval_rate_last_6mo': desk_approval_rate,
    'product_type_approval_rate': product_type_approval_rate,
    'quarter': current_quarter,
    'approver_workload': approver_current_workload,
    'text_similarity_to_approved_npas': similarity_score
}

prediction = ml_model.predict(features)

approval_likelihood = prediction['probability'] * 100
confidence_interval = prediction['confidence_interval']
reasoning = prediction['feature_importance']

display_result = f"""
🔮 Approval Prediction
   
   Likelihood: {approval_likelihood}% (Confidence: ±{confidence_interval}%)
   
   Key Factors:
   • Product type (FX Option): 87% historical approval rate (+30% likelihood)
   • Counterparty rating (BBB+): Low risk (+15% likelihood)
   • Similar to TSG1917 (92% match): Approved in 3 days (+20% likelihood)
   • Desk track record: 85% approval rate last 6 months (+10% likelihood)
   • Q4 timing: Legal approvals typically slower (-8% likelihood)
"""
```

---

**Timeline Estimation:**
```
# Predict approval timeline by department
timeline_predictions = {
    'Credit': {'avg_days': 1.2, 'range': (1, 2), 'confidence': 0.85},
    'Finance': {'avg_days': 1.8, 'range': (1, 3), 'confidence': 0.82},
    'Legal': {'avg_days': 1.1, 'range': (1, 2), 'confidence': 0.90},
    'Total': {'avg_days': 4.2, 'range': (4, 6), 'confidence': 0.87}
}

# Adjust for Q4 seasonality
IF (current_quarter == "Q4") THEN:
    timeline_predictions['Legal']['avg_days'] += 0.5
    timeline_predictions['Total']['avg_days'] += 0.5
    seasonal_note = "⚠️ Q4: Legal approvals typically take +0.5 days (year-end deal rush)"

display_result = f"""
⏱️ Timeline Estimate
   
   Expected Total: {timeline_predictions['Total']['avg_days']} days (range: {timeline_predictions['Total']['range']})
   
   Breakdown:
   • Credit: {timeline_predictions['Credit']['avg_days']} days
   • Finance: {timeline_predictions['Finance']['avg_days']} days
   • Legal: {timeline_predictions['Legal']['avg_days']} days
   
   {seasonal_note if exists else ""}
   
   Based on: 500+ historical NPAs with similar characteristics
"""
```

---

**Bottleneck Detection:**
```
# Identify likely bottlenecks
bottlenecks = []

IF (notional_value > 20000000) THEN:
    bottlenecks.append({
        'stage': 'Finance',
        'reason': 'Notional >$20M typically requires ROAE sensitivity analysis',
        'recommendation': 'Pre-populate ROAE scenarios in Appendix 3'
    })

IF (product_type == "Credit Derivative" AND desk == "Asia Desk") THEN:
    bottlenecks.append({
        'stage': 'Credit',
        'reason': '68% of Credit Derivatives from Asia Desk rejected for insufficient collateral docs',
        'recommendation': 'Proactively include collateral schedules in Section IV.B'
    })

IF (current_quarter == "Q4") THEN:
    bottlenecks.append({
        'stage': 'Legal',
        'reason': 'Q4 year-end deal rush adds +0.5 days to Legal approvals',
        'recommendation': 'Submit 2 days earlier than usual to maintain timeline'
    })

display_result = """
⚠️ Potential Bottlenecks
   
   1. Finance (ROAE Analysis Required)
      • Notional $50M > $20M threshold
      • Recommendation: Pre-populate ROAE scenarios in Appendix 3
   
   2. Q4 Timing (Legal Delay)
      • Year-end deal rush adds +0.5 days
      • Recommendation: Submit 2 days earlier than usual
"""
```

---

### **Step 7: Template Auto-Fill**

**Template Auto-Fill Engine Actions:**
```
# Find most similar approved NPA
best_match = similar_npas[0]  # Highest similarity score

# Copy/adapt content from best_match
auto_filled_fields = {
    # Section I: Product Specifications
    'product_name': user_input.product_name,
    'product_type': best_match.product_type,
    'desk': user_input.desk,
    'location': user_input.location,
    'business_unit': best_match.business_unit,
    
    # Section II: Operational & Technology Information
    'booking_system': best_match.booking_system,
    'valuation_model': best_match.valuation_model,
    'settlement_method': best_match.settlement_method,
    
    # Section III: Pricing Model Details
    'pricing_methodology': best_match.pricing_methodology,
    'market_data_sources': best_match.market_data_sources,
    
    # Section IV: Risk Analysis - Pre-populate from similar NPA
    'market_risk_assessment': adapt_text(best_match.market_risk_assessment, user_input.notional),
    'credit_risk_assessment': adapt_text(best_match.credit_risk_assessment, user_input.counterparty_rating),
    'operational_risk_assessment': best_match.operational_risk_assessment,
    'liquidity_risk_assessment': best_match.liquidity_risk_assessment,
    
    # Auto-assigned
    'sign_off_parties': determine_sign_offs(classification, cross_border),
    'approval_matrix': lookup_approval_matrix(product_type, risk_level, notional_value),
    'regulatory_requirements': lookup_regulatory_requirements(product_type, jurisdiction),
}

# Coverage calculation
fields_auto_filled = 37
total_fields = 47
coverage_percentage = (37 / 47) * 100  # 78.7%

# Flag fields requiring manual input
manual_input_required = [
    'specific_counterparty_name',
    'exact_trade_date',
    'unique_product_features',
    'custom_risk_mitigants',
    'special_legal_provisions',
    'desk_specific_operational_procedures',
    'bespoke_pricing_adjustments'
]

display_result = f"""
✅ Template Auto-Fill Complete
   
   Coverage: {coverage_percentage}% ({fields_auto_filled}/{total_fields} fields)
   
   📝 Fields Requiring Your Input ({len(manual_input_required)} remaining):
   1. Specific counterparty name
   2. Exact trade date
   3. Unique product features (if any)
   4. Custom risk mitigants (if any)
   5. Special legal provisions (if any)
   6. Desk-specific operational procedures
   7. Bespoke pricing adjustments
   
   ⏱️ Time Saved: ~45 minutes (average manual NPA form completion time)
"""
```

---

### **Step 8: Final Output & Handoff**

**Generate Work Item Shell:**
```
# Create NPA work item in system
npa_work_item = {
    'npa_id': generate_npa_id(desk, year, sequence),  # e.g., TSG2025-042
    'classification': classification,  # NTG / Variation / Existing
    'approval_track': approval_track,  # Full NPA / NPA Lite / Bundling / Evergreen
    'status': 'Draft',  # Initial state
    'maker': current_user,
    'npa_champion': desk_npa_champion,
    'sign_off_parties': sign_off_parties,
    'mandatory_sign_offs': mandatory_sign_offs (if cross_border),
    'pac_approval_required': pac_approval_required,
    'pir_mandatory': pir_mandatory,
    'validity_period': validity_period,
    'created_date': today(),
    'template_data': auto_filled_fields,
    'manual_fields_required': manual_input_required,
    'predictions': {
        'approval_likelihood': approval_likelihood,
        'timeline_estimate': timeline_predictions,
        'bottlenecks': bottlenecks
    },
    'similar_npas': similar_npas,
    'loop_back_count': 0,
    'circuit_breaker_triggered': False
}

# Schedule PIR auto-reminder (if applicable)
IF (pir_mandatory == TRUE OR approval_track == "Full NPA") THEN:
    # PIR due at Launch + 6 months (scheduled when product launches)
    pir_schedule = {
        'trigger': 'ON_LAUNCH',
        'due_date': 'LAUNCH_DATE + 180 days',
        'assigned_to': [npa_work_item.maker, npa_work_item.npa_champion],
        'sign_off_parties': sign_off_parties_with_conditions
    }
    npa_work_item['pir_schedule'] = pir_schedule

# Set validity expiry
npa_work_item['validity_expiry'] = 'APPROVAL_DATE + {validity_period} days'

# Schedule validity reminders
validity_reminders = [
    {'trigger': 'APPROVAL_DATE + {validity_period - 30} days', 'message': 'NPA expires in 30 days'},
    {'trigger': 'APPROVAL_DATE + {validity_period - 7} days', 'message': 'NPA expires in 7 days - URGENT'}
]
npa_work_item['validity_reminders'] = validity_reminders

# Enforce state machine
workflow_state_manager.create_workflow(npa_id, valid_transitions=get_valid_transitions(approval_track))

# Save to database
save_npa_work_item(npa_work_item)
```

---

**Display to User:**
```
🎉 Phase 0 Complete - NPA Work Item Created
   
   NPA ID: {npa_id}
   Classification: {classification}
   Approval Track: {approval_track}
   
   📋 Next Steps:
   1. Review the auto-filled template (78% complete)
   2. Fill in 7 remaining fields (highlighted in yellow)
   3. Click "Submit for Checker Review"
   
   ⏱️ Estimated Time to Complete: 15-20 minutes
   (vs 60-90 minutes for manual form)
   
   🔮 Predictions:
   • Approval Likelihood: {approval_likelihood}%
   • Timeline: {timeline_estimate} days
   • Potential Delays: {bottlenecks}
   
   📎 Supporting Documents:
   • Similar NPA: TSG1917 (for reference)
   • Risk Assessment Template (pre-populated)
   • Sign-Off Matrix (auto-assigned)
   
   ✅ Ready to proceed?
   [Submit for Review] [Save as Draft] [Start Over]
```

---

**Handoff to Existing Workflow:**
```
# Phase 0 hands off to Stage 1 (Ingestion & Triage)
# Existing 19 task agents take over from here

workflow_handoff = {
    'from_stage': 'Phase 0: Product Ideation',
    'to_stage': 'Stage 1: Ingestion & Triage',
    'trigger': 'User clicks "Submit for Checker Review"',
    'agents_activated': [
        'Document Ingestion Sub-Agent',  # Validate submitted template
        'Completeness Triage Sub-Agent',  # Check all 47 fields
        'Validation Sub-Agent'  # Run 47 business rules + compliance checks
    ],
    'next_persona': 'Checker',
    'next_action': 'Review AI-generated summary + Make decision (Approve/Reject/Request Changes)'
}
```

---

## 7. State Machine & Valid Transitions

### Full NPA State Machine (30+ States)

**Valid Workflow Transitions:**
```
Draft
  ↓
Submitted (by Maker)
  ↓
Checker Review
  ├─ APPROVE → Approved for Sign-Off
  ├─ REJECT → Draft (loop-back to Maker)
  └─ REQUEST CHANGES → Draft (loop-back to Maker)
  
Approved for Sign-Off
  ↓
[Parallel Sign-Offs Begin]
  ├─ Credit Approval
  ├─ Finance Approval
  ├─ Legal Approval
  ├─ MLR Approval
  ├─ Operations Approval
  ├─ Technology Approval
  └─ Compliance Approval
  
[All Sign-Offs Complete]
  ↓
Preparing for Launch
  ├─ System Configuration
  ├─ UAT (User Acceptance Testing)
  └─ Regulatory Clearance (if required)
  
Ready for Launch
  ↓
Launched
  ↓
PIR/Monitoring
  ├─ PIR Initiated (Launch + 180 days)
  ├─ PIR Submitted
  ├─ PIR Under Review
  └─ PIR Approved
  
PIR Approved
  ↓
Monitoring (Ongoing)
```

**Invalid Transitions (Blocked by State Machine):**
- Draft → Launched (cannot skip Checker + Sign-Offs)
- Checker Review → Preparing for Launch (cannot skip Sign-Offs)
- Launched → Draft (cannot roll back after launch without PIR)

**Loop-Back Transitions:**
```
Checker Review → Draft (Checker rejection)
Credit Approval → Draft (Credit requires NPA changes)
Finance Approval → Draft (Finance requires NPA changes)
Preparing for Launch → Sign-Off Stage (System config issues require re-approval)
PIR/Monitoring → Review Stage (Post-launch issues require NPA amendment)
```

**Agent Enforcement:**
```
# Workflow State Manager enforces transitions
ON user_attempts_transition(current_state, requested_next_state):
    
    valid_next_states = get_valid_transitions(current_state)
    
    IF (requested_next_state NOT IN valid_next_states) THEN:
        block_transition = TRUE
        log_event(
            type = "Invalid Transition Attempt",
            user = current_user,
            current_state = current_state,
            requested_state = requested_next_state,
            timestamp = now()
        )
        display_error = f"""
        ❌ Invalid Transition
        
        Cannot move from "{current_state}" to "{requested_next_state}".
        
        Valid next states:
        {valid_next_states}
        """
        RETURN False
    ELSE:
        allow_transition = TRUE
        log_event(
            type = "State Transition",
            user = current_user,
            from_state = current_state,
            to_state = requested_next_state,
            timestamp = now()
        )
        RETURN True
```

---

## 8. Agent Architecture Summary

### New Agents Required for Phase 0 (4)

1. **Product Ideation Agent** ⭐ CRITICAL
   - **Purpose**: Conversational interview to gather info, classify product, select track
   - **Capabilities**: 
     - Natural language processing (10-15 question interview)
     - Two-stage classification (Product Type → Approval Track)
     - Prohibited list checking (HARD STOP)
     - Cross-border detection (mandatory sign-offs)
     - Bundling detection (trigger bundling logic)
   - **Technology**: Dify conversational agent, fine-tuned transformer
   - **Target**: 5-10 min interview, >92% classification accuracy, >4.3/5 satisfaction

2. **Classification Router Agent** ⭐ CRITICAL
   - **Purpose**: Execute two-stage classification logic with confidence scores
   - **Capabilities**:
     - Stage 1: NTG / Variation / Existing classification
     - Stage 2: Full NPA / NPA Lite / Bundling / Evergreen / Prohibited routing
     - Decision trees + ML ensemble
     - Confidence scoring (escalate if <0.75)
   - **Technology**: XGBoost + rule engine
   - **Target**: <3s processing, >95% accuracy

3. **Prohibited List Checker Agent**
   - **Purpose**: Real-time validation against prohibited products/jurisdictions
   - **Capabilities**:
     - Check internal bank policy
     - Check regulatory restrictions (MAS, CFTC, local)
     - Check sanctions/embargoes (OFAC, UN, EU)
   - **Technology**: Redis cache + Compliance database API
   - **Target**: <1s check time, <2% false positive rate

4. **Template Auto-Fill Engine** ⭐ CRITICAL
   - **Purpose**: Auto-fill 78% of NPA template using similar approved NPAs
   - **Capabilities**:
     - RAG-based similarity search (1,784+ historical NPAs)
     - Content copy/adaptation (intelligent text rewriting)
     - Risk assessment pre-population
     - Sign-off party auto-assignment
   - **Technology**: RAG (Retrieval-Augmented Generation), GPT-4 for adaptation
   - **Target**: 78%+ coverage, >92% accuracy, 2-3 min processing

---

### Enhanced Agents (3)

5. **KB Search Sub-Agent** (existing #6)
   - **NEW**: Proactive search during Phase 0 ideation
   - **NEW**: User-facing in conversational interface
   - **NEW**: Richer output (approval timeline, outcome, conditions, trend analysis)

6. **Conversational Diligence Sub-Agent** (existing #8)
   - **NEW**: Active during Phase 0 ideation
   - **NEW**: Proactive guidance ("You'll need Finance+Legal+Credit sign-offs")
   - **NEW**: Predictive bottleneck warnings

7. **ML-Based Prediction Sub-Agent** (existing #11)
   - **NEW**: Early predictions with partial data from interview
   - **NEW**: Timeline forecasting by department
   - **NEW**: Seasonal adjustment (Q4 Legal delays)

---

### Unchanged Agents (12)

Agents #1-5, #7, #9-10, #12-19 continue operating for Steps 6-11 (existing workflow)

**TOTAL AGENT COUNT: 19** (4 new, 3 enhanced, 12 unchanged)

---

## 9. Key Metrics & Success Criteria

### Baseline (Current State)
- Average NPA processing time: **12 days**
- First-time approval rate: **52%**
- Average rework iterations: **1.4**
- Loop-backs per month: **8**
- Straight-through processing: **0%**
- Time spent on manual form: **60-90 minutes**

### Target (Year 1 with AI)
- Average NPA processing time: **4 days** (67% reduction)
- First-time approval rate: **75%** (23% improvement)
- Average rework iterations: **1.2** (14% reduction)
- Loop-backs per month: **5** (38% reduction)
- Straight-through processing: **35%** (Evergreen products)
- Time spent on AI-assisted form: **15-20 minutes** (78% reduction)

### Agent Performance Targets
- **Product Ideation Agent**: >92% classification accuracy, >4.3/5 satisfaction
- **Classification Router Agent**: <3s processing, >95% accuracy
- **Prohibited List Checker**: <1s check, <2% false positive
- **Template Auto-Fill Engine**: 78%+ coverage, >92% accuracy, 2-3 min processing

---

## 10. Open Questions & Next Steps

### Remaining Ambiguities

1. **Bundling Conditions - Weighting**
   - Are the 8 bundling conditions equally weighted?
   - Or is it a hard AND (all must pass)?
   - **Recommended**: Hard AND (safest for regulatory compliance)

2. **Evergreen Annual Review - Trigger**
   - Who initiates annual review? (NPA Champion? Auto-scheduled?)
   - What happens if product fails mid-validity? (Immediate revocation?)
   - **Recommended**: Auto-schedule at Approval + 365 days, NPA Champion reviews

3. **PAC Approval - Workflow Integration**
   - For NTG products, PAC approval required BEFORE NPA starts
   - Should Phase 0 generate "PAC Submission Package"?
   - Or does Maker handle PAC separately, then return to workbench?
   - **Recommended**: Phase 0 generates PAC package, separate approval flow, then returns to NPA

4. **Joint-Unit NPAs - Detection**
   - How does agent detect joint-unit situation?
   - **Recommended**: Explicit question in Phase 0: "Is this a joint proposal with another BU?"

5. **Regional Variations - Location-Specific Rules**
   - Different locations may have additional local sign-offs
   - **Recommended**: Ask location upfront, apply location-specific rules

---

### Immediate Next Steps

**Priority 1: Build Classification Router Agent Spec** (CRITICAL PATH)
- Define complete two-stage decision logic
- Create decision trees for all scenarios
- Define confidence thresholds and escalation rules
- Specify ML model features and training data requirements

**Priority 2: Design Product Ideation Agent Conversational Flow**
- Write complete question scripts for all product types
- Define branching logic based on user responses
- Create error handling for ambiguous inputs
- Build conversation state management

**Priority 3: UI/UX Design for Phase 0 Interface**
- Mockups for conversational chat interface
- Visual display of classification results
- Template auto-fill preview screen
- Handoff transition to existing workflow

**Priority 4: Integration Architecture**
- Define APIs between Phase 0 → Stage 1
- State machine enforcement mechanisms
- Notification trigger points
- Audit logging requirements

**Priority 5: Change Management Strategy**
- User training for new conversational intake
- Champion program for early adopters
- Communication plan for rollout
- Success metrics dashboard

---

## 11. Conclusion

This document provides the **complete domain logic and agent specifications** for the COO Multi-Agent Workbench NPA function. 

**Key Takeaways:**
1. ✅ **Two-stage classification** is foundational (Product Type → Approval Track)
2. ✅ **5 approval tracks** with distinct workflows and requirements
3. ✅ **Cross-cutting rules** apply universally (cross-border, validity, PIR, loop-backs)
4. ✅ **Phase 0 conversational intake** replaces 47-field form (78% auto-fill)
5. ✅ **19 total agents** (4 new, 3 enhanced, 12 unchanged)
6. ✅ **State machine enforcement** prevents invalid transitions
7. ✅ **Predictive analytics** guide users proactively

**We are building a Workflow Decision Engine, not just a form.**

The Product Ideation Agent is the **intelligent router** that makes NPA accessible, efficient, and predictable.

---

**Document End**

**Next Deliverable:** Classification Router Agent - Complete Technical Specification

---