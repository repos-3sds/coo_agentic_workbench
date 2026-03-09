# GFM NPA SOP Summary (POC)
# Suggested Dify Dataset: "COO Command Center — SOPs"

## Disclaimer (POC)
This is a **mock** operating procedure document meant to ground agents. Replace with your official SOPs for production use.

---

## 1) Purpose
Defines a standard operating procedure (SOP) for processing New Product Approvals (NPA) through initiation, review, sign-off, launch, and post-launch monitoring.

---

## 2) Tracks (Decision Output)
Agents must classify the product into one of:
- **FULL_NPA**: New-to-Group or material variation; multi-jurisdiction; new model/booking.
- **NPA_LITE**: Variation within existing frameworks.
- **EVERGREEN**: Existing product within pre-approved parameters.
- **DEAL_SPECIFIC**: One-off approvals (not a standing NPA).

If **PROHIBITED** → immediate hard stop and escalation (no workflow continuation).

---

## 3) Standard stages
1. **INITIATION**
   - Capture product summary (what, who, where, why, notional, client segment).
   - Run prohibited screening (policy/regulatory/sanctions/dynamic).
2. **REVIEW**
   - Collect required documents (term sheet, payoff diagram, booking description).
   - Identify missing prerequisites and blockers.
3. **SIGN_OFF**
   - Route sign-offs based on track + thresholds (notional/cross-border/new vendor).
   - Support loop-backs (maker fixes) and circuit breaker escalation.
4. **LAUNCH**
   - Ensure approvals complete, operational readiness confirmed, booking setup validated.
5. **MONITORING**
   - Conditions tracking, PIR scheduling, threshold breach monitoring.

---

## 4) Mandatory sign-offs (baseline)
For **FULL_NPA** (baseline; rules may add more):
- Business Sponsor
- Finance
- Credit / Counterparty Risk
- Market Risk
- Legal & Compliance (incl. MLR)
- Operations
- Technology

For **NPA_LITE**:
- Business Sponsor
- Finance
- Risk (Credit or Market, depending on product)
- Legal & Compliance (if cross-border or new docs)

For **EVERGREEN**:
- Business + Finance confirmation (auto-approved if within caps)

---

## 5) Circuit breaker (loop-back escalation)
If the same NPA is returned **3 times** from sign-off:
- Mark as **BLOCKED**
- Escalate to **COO / Governance Forum**
- Require a decision: proceed with conditions, re-scope product, or stop.

---

## 6) Outputs agents must persist
Agents should write back:
- Classification result + confidence
- Prohibited screening result + matched rules
- Required sign-off matrix (who/why)
- SLA deadlines (per stage)
- Blockers list (with owner + due date)

