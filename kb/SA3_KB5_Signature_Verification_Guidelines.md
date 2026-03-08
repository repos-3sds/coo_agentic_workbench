# KB-5 — Signature Verification Guidelines
## DCE Account Opening | SA-3 Signature Verification Agent
### ABS Bank — COO Desk Support Reference

---

## 1. Purpose and Regulatory Basis

This knowledge base defines the mandatory guidelines for signature verification during corporate account opening. SA-3 applies these standards to every signatory on every execution-required document before a case may advance to KYC/CDD preparation (N-3).

**Regulatory References:**
- MAS Notice SFA 02-N13 — Signature Specimen and Identity Verification for Corporate Accounts
- HKMA AML/CFT Guidelines (November 2023) — Section 4.3: Document Integrity and Signatory Authority
- ABS Internal Policy SVP-2024-003 — Signature Verification Procedure for Corporate Account Opening
- MAS TRM Notice (Technology Risk Management) — Biometric/AI-assisted verification audit trail requirements

---

## 2. Confidence Score Tiers — Definitive Thresholds

The signature comparator model (API-7) produces a confidence score between 0.00 and 100.00 representing the probability match between the submitted signature and the ID document specimen.

### 2.1 Tier Definitions

| Tier | Score Range | Auto-Decision | Required Action |
|---|---|---|---|
| **HIGH** | ≥ 85.00 | Auto-PASS flagged | Present to Desk Support with HIGH badge. Desk Support may approve without extended review. |
| **MEDIUM** | 60.00 – 84.99 | Flag for Review | Present to Desk Support with MEDIUM badge. Desk Support must review side-by-side overlay before approving. Written notes required. |
| **LOW** | < 60.00 | Immediate Escalation | **NEVER present to Desk Support for approval.** Route immediately to ESCALATE_COMPLIANCE. Notify Compliance + COO Desk Management. |

### 2.2 Threshold Rationale

The 85% HIGH threshold corresponds to a False Acceptance Rate (FAR) of < 0.1% under ABS model validation (Model Validation Report MV-2024-SA3-001). This rate meets MAS's acceptable error rate for AI-assisted signature matching in banking contexts.

The 60% MEDIUM threshold allows Desk Support to exercise professional judgment for borderline cases where visual inspection may resolve ambiguity (e.g., signing style variation, aged vs. current signature).

Below 60% the model FAR exceeds 5% — too high for unassisted Desk Support approval. Compliance oversight is mandatory at this threshold.

### 2.3 Boundary Cases

- Score of exactly **85.00** → HIGH tier (≥ 85.00)
- Score of exactly **60.00** → MEDIUM tier (≥ 60.00)
- Score of **59.99** or below → LOW tier (< 60.00) → ESCALATE_COMPLIANCE

---

## 3. Authority Check — Mandate Validation Rules

Every signatory must be validated against the company mandate (Board Resolution or equivalent authorisation document).

### 3.1 Authority Status Outcomes

| Status | Meaning | Action |
|---|---|---|
| `AUTHORISED` | Signatory name found in mandate authorised signatory list with matching role | Proceed with confidence scoring |
| `UNAUTHORISED` | Signatory name found but role mismatch or signing limit exceeded | Flag for Desk Support — cannot approve; requires mandate amendment or re-execution |
| `NOT_IN_MANDATE` | Signatory name not found in mandate at all | Immediate ESCALATE_COMPLIANCE — potential fraud risk |

### 3.2 Name Matching Rules

- **Exact match** required against mandate signatory list (case-insensitive, whitespace-normalised)
- **Alias matching**: Chinese name variants (Traditional/Simplified/Romanised) must be cross-referenced against NRIC/Passport name on file
- **Discrepancies**: Middle name omission is acceptable only if NRIC/Passport has been verified and matches without middle name
- **Initials only**: Not acceptable. Full given name must match.

### 3.3 Signing Authority Levels (Per Mandate)

| Level | Description | Minimum Signatories Required |
|---|---|---|
| Single Authorised Signatory | One authorised signatory sufficient | 1 |
| Joint Authorised Signatories | Two signatories required — any 2 from the authorised list | 2 |
| Director + Secretary | Specific role pairing required | 2 (1 Director + 1 Secretary) |
| Board Resolution Required | Specific resolution for this transaction type | Board quorum (per articles) |

---

## 4. Acceptable Identity Document Types by Jurisdiction

### 4.1 Singapore (SGP)

| Document Type | Acceptable for Comparison | Notes |
|---|---|---|
| NRIC (National Registration Identity Card) | **Primary** | Singapore Citizens and PRs |
| Singapore Employment Pass (EP) | **Primary** | Foreign nationals working in SG |
| Singapore Dependant's Pass (DP) | Secondary | With EP holder verification |
| Singapore Long-Term Visit Pass | Secondary | With additional KYC check |
| Passport (any nationality) | **Primary** | For foreign directors not holding SG pass |

### 4.2 Hong Kong (HKG)

| Document Type | Acceptable for Comparison | Notes |
|---|---|---|
| HKID (Hong Kong Identity Card) | **Primary** | All HK residents |
| Passport (any nationality) | **Primary** | Foreign signatories |
| BN(O) British National Overseas Passport | **Primary** | Treated as passport |
| One-way Permit | Secondary | With additional supporting verification |

### 4.3 China Mainland (CHN)

| Document Type | Acceptable for Comparison | Notes |
|---|---|---|
| Resident Identity Card (居民身份证, PRC ID) | **Primary** | PRC citizens |
| Chinese Passport | **Primary** | All PRC nationals |
| Home Return Permit (回乡证) | Secondary | Cross-reference with PRC ID |

### 4.4 Other Jurisdictions

For signatories from jurisdictions not listed above, use:
- Valid national passport (any country) — **Primary**
- Government-issued photo ID with signature panel — Secondary (requires RM approval)

---

## 5. Evidence Packaging Standards

All signature verification outcomes must produce an audit-complete evidence package. This is a mandatory regulatory requirement — not optional.

### 5.1 Required Evidence per Signatory

| Evidence Item | Mandatory? | Storage Location | Retention |
|---|---|---|---|
| Original signature crop (extracted from execution document) | **YES** | MongoDB GridFS (via Signature Repository API) | 7 years |
| ID document specimen (page with signature) | **YES** | MongoDB GridFS | 7 years |
| Side-by-side comparison overlay image | **YES** | MongoDB GridFS (`comparison_overlay_ref`) | 7 years |
| Confidence score (numeric, 0–100) | **YES** | MariaDB `dce_ao_signature_verification` | 7 years |
| Confidence tier (HIGH/MEDIUM/LOW) | **YES** | MariaDB `dce_ao_signature_verification` | 7 years |
| Authority status (AUTHORISED/UNAUTHORISED/NOT_IN_MANDATE) | **YES** | MariaDB `dce_ao_signature_verification` | 7 years |
| Approving Desk Support Officer ID | **YES** (post-approval) | MariaDB `dce_ao_signature_specimen` | 7 years |
| Specimen ID (SPEC-XXXXXX) | **YES** (post-approval) | MariaDB `dce_ao_signature_specimen` | 7 years |
| Desk Support approval notes | **YES** for MEDIUM tier | MariaDB `dce_ao_hitl_review_task.decision_payload` | 7 years |
| Rejection reason | **YES** for any rejection | MariaDB `dce_ao_hitl_review_task.decision_payload` | 7 years |

### 5.2 Specimen ID Format

Approved specimens receive a permanent Specimen ID in the format:

```
SPEC-{6-digit-zero-padded-sequence}
Example: SPEC-000031
```

This ID is stored in `dce_ao_signature_specimen.specimen_id` and referenced in N2Output. It is the primary audit reference for this signatory's verified signature.

### 5.3 Evidence Completeness Check

Before writing COMPLETE checkpoint (N-2 end), verify:
- [ ] Every approved signatory has a `specimen_id` written to `dce_ao_signature_specimen`
- [ ] Every signatory (approved or rejected) has a row in `dce_ao_signature_verification`
- [ ] All `mongodb_specimen_ref` values are populated (not null)
- [ ] `dce_ao_node_checkpoint` has COMPLETE status written for N-2
- [ ] N2Output contains `specimens_stored[]` array with all SPEC-IDs

---

## 6. Desk Support Review Protocol

### 6.1 What Desk Support Reviews

For each signatory in the HITL workbench queue, Desk Support receives:

1. **Identity Card**: Signatory name, role in mandate, confidence score, tier badge (HIGH/MEDIUM)
2. **Side-by-side comparison**: Submitted signature (left) | ID document specimen (right)
3. **Reviewer guidance** (auto-generated by SA-3 LLM):
   - For HIGH: "Automated comparison high-confidence. Visual spot-check recommended."
   - For MEDIUM: "Review signature pressure, letter formation, and proportions. Check for: [specific flags from model]"
4. **Document references**: Which documents were signed, page references
5. **HITL deadline**: When decision is due (URGENT/STANDARD/DEFERRED)

### 6.2 Decision Options per Signatory

| Decision | When to Use | Consequence |
|---|---|---|
| **APPROVE** | Signature matches ID specimen. Signatory is authorised. Execution documents are correctly signed. | Specimen stored as SPEC-XXXXXX. If all approved → N-3 advance. |
| **REJECT** | Signature does not match. Or: signatory not authorised for this transaction type. | Entire case returns to `SIGNATURE_REJECTED`. Full re-execution required. |
| **CLARIFY** | Unable to determine — need additional information from customer (e.g., signing style variation due to injury, marriage name change, etc.) | SA-7 sends clarification email to RM. Case parks. HITL remains PENDING until resubmission. |

### 6.3 MEDIUM Confidence — Required Desk Support Actions

When a signatory has MEDIUM confidence (60–84.99%):
1. **Mandatory visual review** of side-by-side overlay
2. **Written notes required** — approval or rejection must include officer notes explaining decision
3. **Escalation option**: If Desk Support is uncertain, they may escalate to COO Desk Management

### 6.4 Decision Completeness Rule

All signatories from Phase 1 must receive a decision before submission. Partial submissions are rejected by SA-3. The workbench will highlight missing decisions with a red indicator.

---

## 7. SLA Schedule for HITL Review

| Priority | HITL Review Window | Trigger Condition |
|---|---|---|
| **URGENT** | 4 hours | URGENT case (Tier 1 client, regulatory deadline, or case flagged by RM) |
| **STANDARD** | 24 hours | Standard corporate account opening case |
| **DEFERRED** | 48 hours | Low-priority case with deferred SLA agreement |

### 7.1 SLA Breach Escalation Chain

| SLA % Used | Action |
|---|---|
| 75% (3h / 18h / 36h) | First reminder notification to Desk Support officer |
| 90% (3.6h / 21.6h / 43.2h) | Second reminder + notify Desk Support Team Lead |
| 100% (4h / 24h / 48h) | Alert Desk Support Manager + COO Desk Management |

---

## 8. Escalation Criteria — ESCALATE_COMPLIANCE Triggers

The following conditions ALWAYS route to ESCALATE_COMPLIANCE. Desk Support cannot override these gates:

| Trigger | Code | Description |
|---|---|---|
| LOW confidence score | `CONF_LOW` | Any signatory confidence < 60.00 — potential fraud or quality issue |
| NOT_IN_MANDATE status | `NOT_AUTHORISED` | Signatory not found in mandate at all — potential unauthorised execution |
| Model API failure | `MODEL_FAIL` | Signature comparator failed after 1 retry — confidence = 0 → LOW tier → escalate |
| Mandate document missing | `NO_MANDATE` | Mandate not found — all signatories treated as NOT_IN_MANDATE |
| Suspected forgery | `SUSPECTED_FORGERY` | Model returns forgery probability > 30% (sub-score from API-7) |

---

## 9. Model Performance Benchmarks — API-7 Signature Comparator

These benchmarks are for Desk Support awareness when reviewing MEDIUM confidence cases:

| Metric | Value | Source |
|---|---|---|
| False Acceptance Rate (FAR) @ HIGH tier (≥85%) | < 0.1% | ABS Model Validation MV-2024-SA3-001 |
| False Rejection Rate (FRR) @ HIGH tier (≥85%) | 3.2% | ABS Model Validation MV-2024-SA3-001 |
| FAR @ MEDIUM tier (60–84%) | 0.1% – 5.0% | Proportional to score within range |
| FAR @ LOW tier (< 60%) | > 5.0% | Requires Compliance review |
| Model training data | SGP, HKG, CHN corporate signatories, 2019–2024 | ABS Model Card MC-2024-SA3 |
| Model version | API-7 v3.2.1 | Updated Q4 2024 |

**Key Insight for Desk Support:** A MEDIUM confidence score of 75% means the model is ~99% certain it's not a forgery, but ~25% uncertainty about exact match — usually due to natural signing style variation. Visual inspection of letter forms and proportions resolves most MEDIUM cases.

---

## 10. Common Desk Support Decision Scenarios

### Scenario A — All HIGH, All Authorised (Most Common)
- All confidence scores ≥ 85%, all signatories in mandate
- Expected action: Approve all. Notes optional.
- Outcome: SIGNATURE_APPROVED → N-3

### Scenario B — MEDIUM Confidence, Clear Visual Match
- Score 70–84%, side-by-side shows consistent letter formation and proportions
- Expected action: Approve with notes (e.g., "Visual review confirms match. Style variation within normal range.")
- Outcome: SIGNATURE_APPROVED → N-3

### Scenario C — MEDIUM Confidence, Visual Mismatch
- Score 60–70%, side-by-side shows noticeably different strokes
- Expected action: Clarify (request fresh signature sample from customer) or Reject (if mandate authority also questionable)
- Outcome: HITL_PENDING (clarify) or SIGNATURE_REJECTED

### Scenario D — One Signatory Rejected, Others Approved
- One signatory fails visual check
- Expected action: Reject that signatory; other decisions still submitted
- Outcome: SIGNATURE_REJECTED (entire case — full re-execution required)

### Scenario E — Signing Style Change Due to Injury/Age
- Desk Support notes RM flag: customer recently underwent surgery affecting dominant hand
- Expected action: Approve with detailed notes + request medical statutory declaration for file
- Outcome: SIGNATURE_APPROVED → N-3 (with medical declaration flagged as follow-up)

---

## 11. Integration Points

| System | API | Purpose |
|---|---|---|
| Signature Repository (Spring Boot) | `POST /api/signatures` | Store approved specimen in MongoDB GridFS |
| Workbench Queue | `POST /api/workbench/signature-queue` | Post HITL review task to Desk Support workbench |
| DCE Orchestrator | `PATCH /api/cases/{case_id}` | Update case status on rejection |
| Notification Service | `POST /api/notifications/inapp` | Desk Support in-app notification |
| SA-7 (Communication Agent) | `POST /api/workflows/sa7/trigger` | Customer clarification email |
| Kafka | `dce.ao.events` topic, `dce.signature.approved` event | Downstream N-3 trigger |
