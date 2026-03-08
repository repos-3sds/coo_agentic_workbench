# KB-9: SLA Policy — DCE Account Opening
*Version: 1.0 | Last Updated: 2026-03-02 | Regulatory Scope: MAS (SGP), HKMA (HKG)*

---

## Priority Level Definitions

### URGENT
**Criteria** (ANY of the following):
- Client tier = Platinum or Diamond
- RM flags urgency in submission (rm_urgency_flag = true)
- Regulatory deadline < 72 hours (e.g., MAS license expiry, HKMA reporting cutoff)
- Product launch dependency (client needs account live for time-sensitive trade)
- Escalation from DCE COO or Relationship Head
**SLA Windows** (from case submission):
- N-0 Intake: 2 hours
- N-1 Document Collection: 8 hours
- N-2 KYC/CDD: 2 hours
- N-3a Credit + N-3b TMO: 4 hours (parallel)
- N-5 Signature HITL: 12 hours
- N-7 Activation HITL: 12 hours
- **Total End-to-End**: 48 hours
**Escalation Triggers**:
- 75% SLA consumed: Notify RM Manager + DCE COO
- 90% SLA consumed: Auto-escalate to DCE COO
- SLA breach: Notify Risk Management + log breach event

---

### STANDARD
**Criteria** (default if no URGENT/DEFERRED criteria met):
- Client tier = Gold or Silver
- No RM urgency flag
- No regulatory time pressure
- Routine account opening for ongoing relationship
**SLA Windows** (from case submission):
- N-0 Intake: 2 hours
- N-1 Document Collection: 24 hours
- N-2 KYC/CDD: 4 hours
- N-3a Credit + N-3b TMO: 8 hours (parallel)
- N-5 Signature HITL: 24 hours
- N-7 Activation HITL: 24 hours
- **Total End-to-End**: 10 business days
**Escalation Triggers**:
- 75% SLA consumed: Notify RM Manager
- 90% SLA consumed: Notify DCE COO
- SLA breach: Log event + weekly COO review

---

### DEFERRED
**Criteria** (ALL of the following):
- Client tier = Bronze or below
- No revenue impact if delayed
- Client explicitly agrees to deferred timeline
- Non-critical product set (e.g., test account, sandbox access)
**SLA Windows** (best-effort, no hard deadlines):
- N-0 Intake: 4 hours
- N-1 Document Collection: 5 business days
- N-2 KYC/CDD: 2 business days
- N-3a/N-3b: 3 business days each (sequential if resource-constrained)
- N-5/N-7 HITL: 3 business days each
- **Total End-to-End**: 20 business days (target)
**Escalation Triggers**:
- No auto-escalation; manual review only if >30 business days
- RM may upgrade to STANDARD at any time via Workbench

---

## Client Tier Definitions

| Tier | Criteria | Priority Override Capability |
|------|----------|-----------------------------|
| **Diamond** | AUM > USD 500M OR annual revenue impact > USD 5M | Can override to URGENT for any account type |
| **Platinum** | AUM USD 100-500M OR revenue impact USD 1-5M | Can override to URGENT for INSTITUTIONAL_FUTURES, OTC_DERIVATIVES, MULTI_PRODUCT |
| **Gold** | AUM USD 25-100M OR revenue impact USD 250K-1M | Standard priority; can request URGENT with COO approval |
| **Silver** | AUM USD 5-25M OR revenue impact USD 50-250K | Standard priority only |
| **Bronze** | AUM < USD 5M OR revenue impact < USD 50K | Default to DEFERRED unless RM justifies STANDARD |

*Note: Client tier is sourced from ABS CRM system. If tier unavailable, default to Silver for classification.*

---

## Node-Specific SLA Details

### N-0: Case Intake & Triage (All Priorities)
- **Window**: 2 hours from submission receipt
- **Start Trigger**: Email received / Portal form submitted / API POST received
- **End Trigger**: N0Output published to Kafka + checkpoint written
- **Failure Handling**: 
  - Classification confidence <0.70: Flag for RM review (does not stop SLA clock)
  - Case creation API failure: Retry 2x within window; if failed, escalate to Operations (SLA breach logged)

### N-1: Document Collection
| Priority | SLA Window | Retry Policy | Escalation |
|----------|-----------|--------------|------------|
| URGENT | 8 hours | Max 2 RM chases (4h apart) | After Retry 2: RM Branch Manager HITL |
| STANDARD | 24 hours | Max 3 RM chases (8h apart) | After Retry 2: RM Branch Manager HITL |
| DEFERRED | 5 business days | Max 2 RM chases (24h apart) | After Retry 2: Manual review queue |

### N-2: KYC/CDD Assessment
| Priority | SLA Window | Screening Requirements | Escalation |
|----------|-----------|----------------------|------------|
| URGENT | 2 hours | Parallel screening (sanctions + PEP + adverse media) | Any PEP/sanctions hit: Immediate Compliance Officer HITL |
| STANDARD | 4 hours | Sequential screening with 1 retry on API failure | PEP/sanctions hit: Compliance Officer HITL within 1h |
| DEFERRED | 2 business days | Standard screening; batch processing allowed | PEP/sanctions hit: Next-business-day Compliance review |

### N-3a/N-3b: Parallel Streams (Credit + TMO)
| Priority | SLA Window | Parallel Execution Rule | Join Gate Rule |
|----------|-----------|------------------------|----------------|
| URGENT | 4 hours | Both streams MUST start within 30 min of N-2 completion | JOIN proceeds only when BOTH complete; if one HITL, hold both |
| STANDARD | 8 hours | Streams may start within 2 hours of N-2 completion | Same as URGENT |
| DEFERRED | 3 business days each | Streams may run sequentially if resource-constrained | Same as URGENT |

### N-5: Signature Verification (HITL)
| Priority | SLA Window | Reviewer Assignment | Escalation |
|----------|-----------|-------------------|------------|
| URGENT | 12 hours | Dedicated Compliance Officer (pre-assigned) | No response in 6h: Auto-escalate to Senior Compliance |
| STANDARD | 24 hours | Compliance pool (first-available) | No response in 18h: Notify Compliance Manager |
| DEFERRED | 3 business days | Compliance pool (batch processing) | No response in 2 days: Manual follow-up |

### N-7: Activation Review (HITL)
| Priority | SLA Window | Approver Level | Escalation |
|----------|-----------|---------------|------------|
| URGENT | 12 hours | DCE COO or delegated VP | No decision in 6h: Auto-notify Group COO |
| STANDARD | 24 hours | DCE COO or delegated Director | No decision in 18h: Notify DCE COO |
| DEFERRED | 3 business days | Relationship Head or delegated Manager | No decision in 2 days: RM follow-up |

---

## Priority Determination Logic (for SKL-03 LLM)

### Step 1: Evaluate Client Tier
IF client_tier IN [Diamond, Platinum] AND account_type IN [INSTITUTIONAL_FUTURES, OTC_DERIVATIVES, MULTI_PRODUCT]:
→ Candidate: URGENT
ELIF client_tier = Gold AND rm_urgency_flag = true:
→ Candidate: URGENT (requires COO approval flag in output)
ELIF client_tier IN [Bronze, Silver] AND no revenue impact:
→ Candidate: DEFERRED
ELSE:
→ Candidate: STANDARD

### Step 2: Apply Override Indicators
IF ANY of the following present:
regulatory_deadline < 72 hours
product_launch_dependency = true
coo_escalation_flag = true
rm_notes CONTAINS "urgent", "time-sensitive", "regulatory deadline"
→ Override to URGENT (document reason in priority_reason field)

### Step 3: Jurisdiction Adjustments
IF jurisdiction = CHN AND account_type IN [OTC_DERIVATIVES, COMMODITIES_PHYSICAL]:
→ Add +24 hours to all SLA windows (regulatory approval buffer)
→ Note in priority_reason: "CHN regulatory buffer applied"

### Step 4: Final Priority Assignment
IF URGENT candidate AND no blocking constraints:
→ priority = "URGENT"
→ sla_deadline = received_at + URGENT window for N-0 (2 hours)
ELIF DEFERRED candidate AND client agrees to defer:
→ priority = "DEFERRED"
→ sla_deadline = received_at + 20 business days (target, not hard)
ELSE:
→ priority = "STANDARD"
→ sla_deadline = received_at + STANDARD window for N-0 (2 hours)

*Note: SLA deadline is computed per-node; N-0 deadline is always 2h for all priorities to ensure rapid triage.*

---

## Escalation Timeline Reference

| SLA Consumption | Action | Recipients |
|----------------|--------|-----------|
| 75% | Warning notification | RM Manager (all priorities); DCE COO (URGENT only) |
| 90% | Critical alert | DCE COO (all priorities); Risk Management (URGENT) |
| 100% (breach) | Breach event logged + post-mortem trigger | Risk Management, Internal Audit, COO Office |
| Any PEP/Sanctions hit | Immediate compliance escalation | MLRO, Compliance Officer, Legal (regardless of priority) |

*All escalation events logged to dce_ao_event_log with event_type = SLA_WARNING / SLA_CRITICAL / SLA_BREACHED*