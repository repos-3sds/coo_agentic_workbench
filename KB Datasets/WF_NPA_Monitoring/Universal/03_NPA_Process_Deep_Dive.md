# Deep Dive: NPA Domain Analysis & Agent Logic Map (v2)

## 1. Executive Summary
The **New Product Approval (NPA)** process is the critical "Gatekeeper" function for GFM.
**The Agent Solution**: The **Product Ideation Agent** (Phase 0) acts as the "Intelligent Router", using the enhanced logic below to classify the user's request.

---

## 2. Primary Decision: Product Classification (The "First Gate")
*Before determining the approval track, the Agent must classify the product nature.*

1.  **New-to-Group (NTG)**
    *   **Definition**: Product never done before at MBS Group level.
    *   **Agent Rule**: IF `NTG` -> **HARD STOP**. Generate "PAC Submission Package". PAC Approval required *before* NPA starts.
    *   **Mandatory**: Full NPA + PIR.

2.  **Variation**
    *   **Definition**: Existing product with altered risk profile (e.g., new tech platform, sustainability feature).
    *   **Agent Rule**: Assess Risk Severity.
        *   High Risk -> **Full NPA**.
        *   Low Risk -> **NPA Lite**.

3.  **Existing**
    *   **Definition**: Already approved elsewhere or reactivation.
    *   **Agent Rule**: Check Status.
        *   Active (<1 yr) -> **Evergreen** or Referenceable.
        *   Dormant (>1 yr, <3 yrs) -> **Reactivation (NPA Lite)**.
        *   Expired (>3 yrs) -> **Full Assessment**.

---

## 3. Secondary Decision: Cross-Border Logic (The "Mandatory List")
*The Agent must ask: "Will this involve booking across multiple locations?"*

**Rule**: IF `Cross-Border` = YES:
*   **Mandatory Sign-Offs Added**:
    1.  Finance
    2.  RMG-Credit
    3.  RMG-MLR (Market & Liquidity Risk)
    4.  Technology
    5.  Operations
*   *Note*: This overrides any desk-specific matrix.

---

## 4. The Approval Tracks (The "Workflow")

### Track A: "Full NPA"
*   **Trigger**: NTG, High-Risk Variation, or Expired Products.
*   **Validity**: 1 Year. (Extension +6mo possible once).

### Track B: "NPA Lite"
*   **Trigger**: Low-Risk Variation, Dormant Reactivation, Back-to-Back.
*   **Validity**: 1 Year.

### Track C: "Bundling Approval"
*   **Trigger**: Combination of 2+ Approved Blocks.
*   **Conditions**: 8-Point Checklist (weighted as HARD AND - all must pass).

### Track D: "Evergreen"
*   **Trigger**: Standard products on "Evergreen List".
*   **Validity**: **3 Years** (Annual Review required).
*   **Limits**: $500M Notional Cap. 10 deals/NPA.

---

## 5. Lifecycle Intelligence (The "Safety Net")

### A. PIR (Post-Implementation Review)
**Rule**: Mandatory for **ALL** launched products.
*   **Trigger**: Launch Date + 6 Months.
*   **Agent Action**: Auto-schedule Task for Maker & SOPs.

### B. Loop-Back Circuit Breaker
**Rule**: If a Work Item loops between Checker <-> Maker **3 times**:
*   **Agent Action**: **Escalate** to GFM Group NPA Governance Forum.
*   **Reason**: Indicates fundamental misalignment.

### C. State Machine Enforcement
**Rule**: Block invalid transitions (e.g., Draft -> Launched).
*   **Audit**: Log every attempt to bypass states.

---

## 6. The "Phase 0" Conversational Flow (Revised Script)

1.  **Discovery**: "Describe product structure & payout." + **"Is this Cross-Border?"**
2.  **Pre-Screen**:
    *   Prohibited List Check.
    *   **Classification Check**: NTG vs Variation vs Existing.
    *   *(If NTG)* -> "Stop. You need PAC Approval first."
3.  **Similarity Search**:
    *   "Found similar NPA (TSG1917). Status: **Expired (Active 2 years ago)**."
4.  **Routing**:
    *   "Classified as **Variation (Low Risk)** -> **NPA Lite**."
    *   "Cross-Border Detected -> **Added 5 Mandatory Approvers**."
5.  **Output**:
    *   Generate Work Item (Mode: NPA Lite).
    *   Set Validity: **1 Year**.
    *   Set PIR Reminder: **Launch + 6mo**.
