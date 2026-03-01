# Gap Analysis — Architecture v1.0 vs DCE Current Situation Document

**Date:** February 2026
**Trigger:** DCE-current-situation.md was introduced, revealing 6 critical errors in the Account Opening Agent Architecture v1.0
**Outcome:** ACCOUNT-OPENING-AGENT-ARCHITECTURE.md upgraded to v2.0

---

## Summary

The DCE Current Situation Document (`DCE-current-situation.md`) is a discovery-phase document that captures the actual current-state workflow, personas, systems, and document logic for the DCE desk. When cross-referenced against the Agent Architecture v1.0, it revealed that **6 of 9 agents require MAJOR rework** and **0 agents require NO change**.

---

## Critical Errors Found (6)

### 1. Initiating Role Was WRONG

| | v1.0 | Reality (DCE-current-situation.md) |
|---|---|---|
| Who initiates Account Opening? | RM Copilot | **Sales Dealer** |
| Evidence | RM Copilot spec: "Initiate account opening request" | Section 4: "FO -- Sales Dealer: Initiates process: collects docs from customer, submits application, determines applicable document schedules" |
| Impact | Wrong entry point for the entire system |

### 2. COO Desk Support Role Was ENTIRELY MISSING

| | v1.0 | Reality |
|---|---|---|
| Who orchestrates? | Generic "Operations Copilot" with minimal role | **COO Desk Support** is the PRIMARY human orchestrator |
| What they do | "Doc verify, Tasks, Status" | Doc verification, signature verification, completeness check, signing authority confirmation, coordinates ALL teams, tracks physical copy compliance, sends Welcome Kit |
| Impact | Missing the most critical human role |

### 3. Workflow Sequence Was WRONG

| | v1.0 | Reality |
|---|---|---|
| Steps | Linear 10-state machine | **5 steps** with Steps 4A + 4B running in PARALLEL |
| Parallel execution | None | Credit Team (4A) and TMO Static (4B) work concurrently |
| Impact | Sequential provisioning would take 2x longer |

### 4. Document Intelligence Agent Scope Was WRONG

| | v1.0 | Reality |
|---|---|---|
| Schedule determination | DI Agent determines which schedules are needed | **Sales Dealer** determines schedules manually based on customer requirements |
| Missing capabilities | N/A | Signature extraction + verification, physical/digital dual-tracking, mandate letter OCR |
| Impact | Wrong division of responsibility; missing critical compliance function |

### 5. RM's Role Scope Was WRONG

| | v1.0 | Reality |
|---|---|---|
| RM role | Initiator + primary driver | **Step 3 only**: KYC, CDD, BCAP, credit assessment recommendation |
| Impact | Would have built wrong UI and capabilities for RM |

### 6. Systems List Was Incomplete

| System | v1.0 | v2.0 |
|---|---|---|
| CLS (Central Limit System) | **MISSING** | Added -- Credit team updates DCE Limit + DCE-PCE Limit |
| SharePoint | **MISSING** | Added -- Document storage, soft copies, signatures |
| IDB Platforms | **MISSING** | Added -- Enabled for customer by Credit team |
| Murex MX.3 | Confirmed | **Demoted to TBC** -- not confirmed for Account Opening scope |

---

## New Information Items (11)

| # | Item | Source Section | Impact on Architecture |
|---|---|---|---|
| 1 | Signature verification is manual with specific verification types (against ID doc + signing authority) | Section 10 | Added to Document Intelligence Agent + Operations Copilot HITL |
| 2 | Physical/digital dual-status tracking per document | Section 9 | Added to Document Intelligence Agent |
| 3 | CLS (Central Limit System) exists | Section 5 | Added to systems list, Credit Assessment Agent |
| 4 | SharePoint stores all soft copies and signatures | Section 5 | Added to systems list, System Provisioning Agent |
| 5 | Pipeline Management boundary defined | Section 7 | Clarified in orchestrator state machine |
| 6 | Additional non-schedule documents (ID Proofs, GTA, CDD Clearance, ACRA, etc.) | Section 8 | Added to Document Intelligence Agent |
| 7 | Authorised Traders management via mandate letter | Section 11 | Added OCR capability to Document Intelligence Agent |
| 8 | Signature reuse for Funds Withdrawal and Authorised Traders | Section 10 | Architecture scales to future modules |
| 9 | Volume: 15-20 per MONTH (not per week) | Section 3 | Corrected in architecture |
| 10 | "AI assists, human decides" is non-negotiable for signature verification | Section 10 | HITL mandatory for all signature decisions |
| 11 | Credit Assessment Approach: IRB or SA recommendation by RM | Section 6 | Added to RM Copilot and Credit Assessment Agent |

---

## Agent Impact Assessment

| Agent | Change Required | Severity |
|---|---|---|
| Sales Dealer Copilot | MAJOR REWORK — upgraded to INITIATOR | Critical |
| RM Copilot | MAJOR REWORK — downgraded to Step 3 only | Critical |
| Operations Copilot | MAJOR REWORK — upgraded to PRIMARY ORCHESTRATOR interface | Critical |
| Credit Copilot | Minor update — CLS integration | Low |
| Account Opening Orchestrator | MAJOR REWORK — 5-step workflow, fork/join, signature HITL state | Critical |
| Document Intelligence Agent | MAJOR REWORK — remove schedule determination, add signature/physical-digital/mandate OCR | Critical |
| KYC & Compliance Agent | Minor update — credit approach pass-through | Low |
| Credit Assessment Agent | Moderate update — add CLS, remove CQG/IDB (those are Credit team operational tasks) | Medium |
| System Provisioning Agent | MAJOR REWORK — parallel streams 4A/4B, remove Murex, add CLS/SharePoint/IDB | Critical |

**Summary: 6 of 9 agents need MAJOR rework. 0 agents require NO change.**

---

## Resolution

All corrections have been applied in `ACCOUNT-OPENING-AGENT-ARCHITECTURE.md` v2.0. See Section 11 (Change Log) of that document for the complete correction record.

---

*This gap analysis is a point-in-time document. Discovery themes 4-8 remain incomplete and may trigger further corrections.*
