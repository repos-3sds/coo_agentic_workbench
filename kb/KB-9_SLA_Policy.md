# KB-9 — DCE SLA Policy & Escalation Matrix
## Knowledge Base for All Specialist Agents (N-0 through N-8)

| Field | Value |
|---|---|
| **KB ID** | KB-9 |
| **KB Name** | SLA Policy & Escalation Matrix |
| **Version** | 1.0.0 |
| **Effective Date** | 2026-03-01 |
| **Owner** | DCE Operations — Service Level Management |
| **Classification** | DBS Internal — Restricted |
| **Used By** | All nodes (N-0 through N-8), Domain Orchestrator |
| **Chunk Size** | 500 tokens |
| **Chunk Overlap** | 50 tokens |
| **Max Chunks** | 5 |
| **Relevance Threshold** | 0.75 |

---

## 1. SLA Tier Definitions

The DCE Account Opening system operates under three priority tiers. Priority is assigned by SA-1 (N-0) during intake classification and propagated to all downstream nodes via the AO Case State Block.

| Priority Tier | Code | End-to-End SLA | Description | Assignment Criteria |
|---|---|---|---|---|
| **URGENT** | `URGENT` | 24 hours | Time-critical account openings requiring expedited processing across all nodes | VIP client (Tier 1 RM), regulatory deadline, large-value trade pending, management escalation |
| **STANDARD** | `STANDARD` | 72 hours | Normal processing flow — majority of cases | Default for all new submissions not meeting URGENT or DEFERRED criteria |
| **DEFERRED** | `DEFERRED` | 120 hours (5 business days) | Low-priority cases with no immediate trading requirement | Prospective client (no active mandate), dormant reactivation, administrative account changes |

### 1.1 Business Hours Definition

| Parameter | Value |
|---|---|
| **Business Day** | Monday to Friday, excluding SGP/HKG public holidays |
| **Business Hours** | 08:00 — 18:00 SGT (Singapore Time, UTC+8) |
| **SLA Clock Start** | Timestamp of `SUBMISSION_RECEIVED` event in `dce_ao_event_log` |
| **SLA Clock Pause** | When case status transitions to `HITL_PENDING` (awaiting human action) |
| **SLA Clock Resume** | When HITL action is recorded and case status returns to `ACTIVE` |
| **SLA Clock Stop** | Timestamp of final `NODE_COMPLETED` event at N-8 or `CASE_DEAD` event |

### 1.2 SLA Calculation Formula

```
sla_consumed_pct = (elapsed_business_hours / total_sla_hours) * 100

Where:
  elapsed_business_hours = SUM(active_processing_intervals)
  total_sla_hours = priority_tier.end_to_end_sla_hours
  active_processing_intervals exclude HITL_PENDING periods
```

---

## 2. Per-Node SLA Windows

Each DAG node has an independent SLA window. The per-node SLA is consumed from the total end-to-end SLA budget.

| Node | Agent | URGENT Window | STANDARD Window | DEFERRED Window | Max Retries | Retry Adds |
|---|---|---|---|---|---|---|
| **N-0** | SA-1 Intake & Triage | 1 hour | 2 hours | 4 hours | 2 | +1 hour per retry |
| **N-1** | SA-2 Document Collection | 8 hours | 24 hours | 48 hours | 3 | +4 hours per retry (RM response time) |
| **N-2** | SA-4 KYC/CDD Assessment | 2 hours | 4 hours | 8 hours | 1 | No retry — escalate immediately on AML/sanctions |
| **N-3a** | SA-6 Credit Assessment | 4 hours | 8 hours | 16 hours | 2 | +2 hours per retry |
| **N-3b** | SA-7 TMO Static Data | 4 hours | 8 hours | 16 hours | 3 | +2 hours per retry |
| **N-4** | Fork/Join Barrier | 0 (instant) | 0 (instant) | 0 (instant) | 0 | N/A |
| **N-5** | SA-5 Signature Verification | 12 hours | 24 hours | 48 hours | 0 | HITL mandatory — no agent retry |
| **N-6** | SA-8 Regulatory Configuration | 2 hours | 4 hours | 8 hours | 2 | +1 hour per retry |
| **N-7** | SA-9 Activation Review | 12 hours | 24 hours | 48 hours | 0 | HITL mandatory — no agent retry |
| **N-8** | SA-3 Downstream Provisioning | 2 hours | 4 hours | 8 hours | 2 | +1 hour per retry |

### 2.1 Node SLA Budgeting Rules

1. **Sum of per-node SLAs may exceed end-to-end SLA** — the end-to-end SLA is the binding constraint. Per-node SLAs are targets, not guarantees.
2. **Parallel nodes (N-3a, N-3b) share a single SLA slot** — the slot duration equals the MAX of the two parallel node SLAs, not the sum.
3. **HITL nodes (N-5, N-7) consume the most SLA budget** — agents should complete pre-HITL processing as fast as possible to leave maximum time for human review.
4. **SLA consumed percentage is injected into every agent context** — each agent receives `sla_pct_consumed` in the AO Case State Block and must factor this into its decisions.

---

## 3. Escalation Matrix

### 3.1 Per-Node Escalation Paths

| Node | Retry 1 Escalation | Retry 2 Escalation | Retry 3 / Ceiling Escalation | SLA Breach Escalation |
|---|---|---|---|---|
| **N-0** | Auto-retry (silent) | RM Manager notified | DCE Operations Manager | DCE COO |
| **N-1** | RM notified (chase email) | RM + RM Branch Manager notified | CASE marked DEAD — RM Manager alerted | DCE Operations Manager |
| **N-2** | Compliance Officer (immediate for AML/PEP) | Senior Compliance Officer | Compliance Head + Legal | Compliance Head + DCE COO |
| **N-3a** | Auto-retry with additional data | Senior Credit Officer review | Credit Committee referral | Credit Head + DCE COO |
| **N-3b** | Auto-retry with TMO correction | TMO Operations Manager | TMO Head — manual data entry | TMO Head + DCE COO |
| **N-5** | N/A (HITL mandatory) | N/A | Legal Officer (invalid signatures) | Legal + DCE COO |
| **N-6** | Auto-retry with config adjustment | Compliance Officer review | Compliance Head — manual config | Compliance Head + DCE COO |
| **N-7** | N/A (HITL mandatory) | N/A | DCE COO rejects — case DEAD | Board Notification (if systemic) |
| **N-8** | Auto-retry (system recovery) | IT Operations notified | IT Head — manual provisioning | IT Head + DCE COO |

### 3.2 Escalation Trigger Rules

| Trigger Type | Condition | Action | Notification Channel |
|---|---|---|---|
| **RETRY_CEILING** | `retry_count >= max_retries` for node | Route to next escalation tier | EMAIL + IN_APP_TOAST + KAFKA_EVENT |
| **SLA_WARNING** | `sla_pct_consumed >= 60%` | Alert current handler + RM | IN_APP_TOAST + WORKBENCH_BADGE |
| **SLA_CRITICAL** | `sla_pct_consumed >= 80%` | Escalate one tier above current handler | EMAIL + IN_APP_TOAST + KAFKA_EVENT |
| **SLA_BREACH** | `sla_pct_consumed >= 100%` | Escalate to DCE COO + trigger MAS/HKMA incident log | EMAIL + SMS + KAFKA_EVENT + INCIDENT_LOG |
| **AML_SANCTIONS_HIT** | Any PEP/sanctions match at N-2 | Immediate Compliance Officer escalation | EMAIL (priority) + KAFKA_EVENT |
| **SIGNATURE_INVALID** | Signature verification failure at N-5 | Legal Officer escalation | EMAIL + KAFKA_EVENT |
| **HITL_TIMEOUT** | HITL pending > 50% of node SLA window | Re-notify assignee + escalate to their manager | EMAIL + SMS |

### 3.3 SLA Pressure Decision Modifiers

When `sla_pct_consumed` exceeds thresholds, agent decision-making is modified:

| SLA Band | sla_pct_consumed | Agent Behaviour Modification |
|---|---|---|
| **GREEN** | 0% — 40% | Normal processing. Full validation, all optional checks enabled. |
| **AMBER** | 40% — 60% | Expedited processing. Skip optional document checks. Reduce KB retrieval depth. |
| **ORANGE** | 60% — 80% | Aggressive expediting. Accept lower confidence thresholds (0.70 instead of 0.80). Flag for post-completion review. |
| **RED** | 80% — 100% | Critical path only. Skip all optional validations. Escalate simultaneously. Auto-accept marginal documents with post-review flag. |
| **BREACH** | > 100% | SLA breached. Log incident. Continue processing but notify DCE COO. All subsequent HITL assignments tagged URGENT regardless of original priority. |

---

## 4. Priority Reassignment Rules

Priority may be upgraded (never downgraded) during case lifecycle:

| Rule ID | Trigger | New Priority | Authority | Audit |
|---|---|---|---|---|
| PR-01 | RM requests urgent processing via Workbench | URGENT | RM (with RM Manager approval) | Event: `PRIORITY_UPGRADED` |
| PR-02 | SLA at 80%+ consumed on STANDARD case | URGENT | System (automatic) | Event: `PRIORITY_AUTO_ESCALATED` |
| PR-03 | Compliance flag at N-2 (PEP/sanctions) | URGENT | Compliance Officer | Event: `PRIORITY_COMPLIANCE_OVERRIDE` |
| PR-04 | DCE COO override | Any | DCE COO | Event: `PRIORITY_EXECUTIVE_OVERRIDE` |
| PR-05 | Regulatory deadline approaching (MAS/HKMA filing) | URGENT | System (calendar-triggered) | Event: `PRIORITY_REGULATORY_DEADLINE` |

---

## 5. Notification Templates by SLA Event

### 5.1 SLA Warning (60% consumed)

| Field | Value |
|---|---|
| **Template ID** | TPL-SLA-WARNING |
| **Channel** | IN_APP_TOAST, WORKBENCH_BADGE |
| **Recipients** | Current node handler, assigned RM |
| **Subject Pattern** | `[{case_id}] SLA Warning — {sla_pct_consumed}% consumed` |
| **Body Pattern** | Case {case_id} for client {client_name} has consumed {sla_pct_consumed}% of its {priority} SLA. Current node: {current_node}. Deadline: {sla_deadline}. Please expedite processing. |

### 5.2 SLA Critical (80% consumed)

| Field | Value |
|---|---|
| **Template ID** | TPL-SLA-CRITICAL |
| **Channel** | EMAIL, IN_APP_TOAST, KAFKA_EVENT |
| **Recipients** | Current node handler, handler's manager, assigned RM, RM Manager |
| **Subject Pattern** | `[CRITICAL] [{case_id}] SLA at {sla_pct_consumed}% — Escalation Required` |
| **Body Pattern** | URGENT: Case {case_id} ({client_name}, {account_type}) has consumed {sla_pct_consumed}% of its {priority} SLA. Deadline: {sla_deadline}. Node {current_node} must complete within {remaining_hours} hours. Escalating to {escalation_target}. |

### 5.3 SLA Breach (100% consumed)

| Field | Value |
|---|---|
| **Template ID** | TPL-SLA-BREACH |
| **Channel** | EMAIL, SMS, KAFKA_EVENT, INCIDENT_LOG |
| **Recipients** | DCE COO, current node handler, handler's manager, assigned RM, RM Manager |
| **Subject Pattern** | `[BREACH] [{case_id}] SLA Breached — Incident Logged` |
| **Body Pattern** | SLA BREACH: Case {case_id} ({client_name}, {account_type}, {priority}) has exceeded its {total_sla_hours}-hour SLA. Current node: {current_node}. Elapsed: {elapsed_hours} hours. This incident has been logged for MAS/HKMA reporting. Immediate action required. |

### 5.4 RM Document Chase (N-1 specific)

| Field | Value |
|---|---|
| **Template ID** | TPL-RM-CHASE |
| **Channel** | EMAIL |
| **Recipients** | Assigned RM (retry 1), RM + RM Branch Manager (retry 2+) |
| **Subject Pattern** | `[{case_id}] Missing Documents — Action Required` |
| **Body Pattern** | Regarding case {case_id} for client {client_name}, the following mandatory documents are still required: {missing_docs_list}. Please submit within {remaining_hours} hours to meet the SLA deadline of {sla_deadline}. |

### 5.5 HITL Assignment

| Field | Value |
|---|---|
| **Template ID** | TPL-HITL-ASSIGN |
| **Channel** | EMAIL, IN_APP_TOAST, WORKBENCH_BADGE |
| **Recipients** | HITL assignee |
| **Subject Pattern** | `[{case_id}] Human Review Required — {node_name}` |
| **Body Pattern** | Case {case_id} ({client_name}, {account_type}) requires your review at {node_name}. Priority: {priority}. SLA deadline: {sla_deadline}. SLA consumed: {sla_pct_consumed}%. Please review and approve/reject within {hitl_sla_window} hours. |

---

## 6. SLA Monitoring Metrics

### 6.1 Real-Time KPIs

| Metric | Formula | Target | Alert Threshold |
|---|---|---|---|
| **Average TAT (Turnaround Time)** | AVG(case_completed_at - case_created_at) | < 48 hours (STANDARD) | > 60 hours |
| **SLA Compliance Rate** | COUNT(cases completed within SLA) / COUNT(total completed cases) * 100 | >= 95% | < 90% |
| **HITL Response Time** | AVG(hitl_completed_at - hitl_assigned_at) | < 4 hours (URGENT), < 12 hours (STANDARD) | > 8 hours (URGENT), > 18 hours (STANDARD) |
| **Retry Rate per Node** | COUNT(retried cases at node) / COUNT(total cases at node) * 100 | < 15% | > 25% |
| **Escalation Rate** | COUNT(escalated cases) / COUNT(total cases) * 100 | < 5% | > 10% |
| **Dead Case Rate** | COUNT(DEAD cases) / COUNT(total cases) * 100 | < 2% | > 5% |
| **Document First-Pass Rate (N-1)** | COUNT(complete on first attempt) / COUNT(total N-1 executions) * 100 | >= 70% | < 60% |

### 6.2 SLA Consumed Calculation per Node

```
node_sla_consumed_pct = (node_elapsed_hours / node_sla_window_hours) * 100

global_sla_consumed_pct = (total_elapsed_hours / end_to_end_sla_hours) * 100

Where:
  node_elapsed_hours = NOW() - node_started_at (excluding HITL_PENDING intervals)
  total_elapsed_hours = NOW() - case_created_at (excluding all HITL_PENDING intervals)
```

---

## 7. Regulatory Reporting Requirements

### 7.1 MAS Reporting Obligations (Singapore)

| Obligation | Trigger | Reporting Window | Report To |
|---|---|---|---|
| **AML/CFT Suspicious Transaction Report (STR)** | PEP/Sanctions hit at N-2 | Within 1 business day | STRO (Suspicious Transaction Reporting Office) |
| **Technology Risk Incident** | SLA breach on > 5 cases in 24 hours | Within 1 hour of detection | MAS Technology Risk Supervision Division |
| **Operational Risk Event** | System failure causing > 2 hour processing delay | Within 24 hours | MAS Operational Risk Division |
| **Customer Complaint** | Client escalation regarding AO delay | Within 5 business days | MAS Consumer Relations |

### 7.2 HKMA Reporting Obligations (Hong Kong)

| Obligation | Trigger | Reporting Window | Report To |
|---|---|---|---|
| **Suspicious Transaction Report** | PEP/Sanctions hit at N-2 (HKG client) | Within 3 business days | JFIU (Joint Financial Intelligence Unit) |
| **Technology Incident** | System outage > 30 minutes | Within 1 hour | HKMA Banking Supervision |
| **Operational Risk Event** | Breach of internal processing SLA | Quarterly reporting | HKMA Operational Risk Division |

---

## 8. SLA Exception Handling

### 8.1 Legitimate SLA Pause Events

The SLA clock is paused (not breached) under these conditions:

| Exception Code | Description | Max Pause Duration | Approval Required |
|---|---|---|---|
| `EXC_HITL` | Case in HITL_PENDING status | Per-node HITL SLA window | Automatic |
| `EXC_CLIENT_DELAY` | Client/RM has not responded to document chase | 72 hours | RM Manager sign-off |
| `EXC_SYSTEM_OUTAGE` | Platform outage (Dify, MariaDB, external API) | Duration of outage | IT Operations confirmation |
| `EXC_REGULATORY_HOLD` | Compliance has placed a regulatory hold on the case | Unlimited (until cleared) | Compliance Officer |
| `EXC_EXTERNAL_DEPENDENCY` | Waiting on external party (e.g., ACRA, SFC, SAFE) | 120 hours | Operations Manager |

### 8.2 SLA Override Authority

| Authority Level | Can Override | Maximum Extension |
|---|---|---|
| RM Manager | STANDARD → +24 hours | Once per case |
| Operations Manager | Any priority → +48 hours | Twice per case |
| DCE COO | Any priority → unlimited | Unlimited |
| Compliance Officer | Regulatory hold — SLA paused indefinitely | Until compliance clearance |
