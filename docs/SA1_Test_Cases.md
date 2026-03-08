# SA-1 Intake & Triage Agent — Comprehensive Test Case Document

**Document ID:** DCE-AO-SA1-QA-001
**Version:** 1.0.0
**Date:** 2026-03-03
**Classification:** Internal — QA Engineering
**Status:** Production-Ready

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Test Environment Configuration](#2-test-environment-configuration)
3. [Test Data Reference](#3-test-data-reference)
4. [Category A — Happy Path / Success Scenarios](#category-a--happy-path--success-scenarios)
5. [Category B — Edge Cases](#category-b--edge-cases)
6. [Category C — Retry / Resume Scenarios](#category-c--retry--resume-scenarios)
7. [Category D — Boundary and Negative Tests](#category-d--boundary-and-negative-tests)
8. [Category E — Channel-Specific Routing Tests](#category-e--channel-specific-routing-tests)
9. [Test Execution Checklist](#9-test-execution-checklist)
10. [Defect Classification Matrix](#10-defect-classification-matrix)

---

## 1. Executive Summary

### Purpose

This document specifies production-grade test cases for the DCE Account Opening SA-1 Intake & Triage Agent (Node N-0), deployed as a Dify workflow (`DCE-AO-SA1-Intake-Triage`, version 0.6.0). It provides structured, repeatable test procedures for validating all functional paths of the SA-1 workflow prior to and during production operation.

### Scope

The SA-1 agent performs the following functions within a single workflow execution:

1. **Context Injection** — Parses and sanitises the raw incoming payload (strips BOM, smart quotes, markdown fences, handles double-escaped JSON).
2. **Channel Routing** — Routes submissions through the appropriate normaliser (Email, Portal, or API) based on `submission_source`.
3. **Account Type Classification** — Invokes KB-1 (Document Taxonomy) and `claude-sonnet-4-6` to classify submissions into one of five account types with a confidence score.
4. **Confidence Gating** — Blocks submissions with confidence below 0.70; flags submissions with confidence 0.70–0.79 for review.
5. **Priority Assessment** — Invokes KB-9 (SLA Policy) and `claude-sonnet-4-6` to assign URGENT / STANDARD / DEFERRED priority with an SLA deadline.
6. **Output Validation** — Validates all output fields (account_type, priority, entity_type, jurisdiction, confidence, client_name) against permitted ENUM values.
7. **MCP Tool Execution** — Calls `sa1_create_case_full` and `sa1_complete_node` via the MCP endpoint at `https://dcemcptools-production.up.railway.app/mcp`.
8. **Final Output Assembly** — Returns a structured N0Output JSON with case_id, account_type, priority, client_name, confidence, and next_node pointer.

### Out of Scope

- SA-2 Document Collection (Node N-1) — tested separately.
- SA-2 MCP tools (`sa2_*`) — not invoked by this workflow.
- Kafka event delivery confirmation — validated via event_log DB query only.

### Test Categories Summary

| Category | Description | Test Case Count |
|---|---|---|
| A | Happy Path / Success Scenarios | 15 (5 account types x 3 channels) |
| B | Edge Cases | 8 |
| C | Retry / Resume Scenarios | 4 |
| D | Boundary and Negative Tests | 6 |
| E | Channel-Specific Routing Tests | 3 |
| **Total** | | **36** |

---

## 2. Test Environment Configuration

### API Endpoint

```
POST https://api.dify.ai/v1/workflows/run
```

### Authentication

```
Authorization: Bearer {{API_KEY}}
Content-Type: application/json
```

Replace `{{API_KEY}}` with the Dify workflow API key obtained from the Dify application settings for `DCE-AO-SA1-Intake-Triage`.

### MCP Endpoint (called internally by the workflow)

```
https://dcemcptools-production.up.railway.app/mcp
```

This endpoint is configured as the environment variable `MCP_ENDPOINT` within the Dify workflow. Testers do not call this directly; it is invoked by the workflow's "MCP: Execute SA-1 Tools" code node.

### Dify Workflow Run Mode

All test cases use the blocking execution mode (`response_mode: "blocking"`). The workflow returns a single JSON response upon completion.

### Standard Request Wrapper

All curl commands use the following outer structure:

```json
{
  "inputs": {
    "submission_source": "...",
    "raw_payload_json": "...",
    "received_at": "...",
    "rm_employee_id": "...",
    "case_id": ""
  },
  "response_mode": "blocking",
  "user": "qa-tester"
}
```

### Database Verification Queries

After each test execution, the following queries validate persistence:

```sql
-- Verify case creation
SELECT case_id, status, current_node, case_type, priority, rm_id, client_name
FROM dce_ao_case_state
WHERE created_at >= NOW() - INTERVAL 5 MINUTE
ORDER BY created_at DESC LIMIT 5;

-- Verify classification
SELECT c.case_id, c.account_type, c.account_type_confidence, c.client_name,
       c.priority, c.flagged_for_review
FROM dce_ao_classification_result c
JOIN dce_ao_case_state s ON c.case_id = s.case_id
WHERE c.classified_at >= NOW() - INTERVAL 5 MINUTE
ORDER BY c.classified_at DESC LIMIT 5;

-- Verify checkpoint
SELECT case_id, node_id, status, next_node, duration_seconds
FROM dce_ao_node_checkpoint
WHERE started_at >= NOW() - INTERVAL 5 MINUTE
ORDER BY started_at DESC LIMIT 5;
```

---

## 3. Test Data Reference

### Relationship Managers (from DB Seed)

| RM ID | Name | Email | Branch | Desk | Manager ID | Manager Name | Manager Email |
|---|---|---|---|---|---|---|---|
| RM-0042 | John Tan | rm.john@abs.com | Marina Bay Financial Centre | DCE Sales Desk SGP | MGR-0012 | Sarah Lim | sarah.lim@abs.com |
| RM-0055 | (Lee) | rm.lee@abs.com | — | — | — | — | — |
| RM-0073 | — | — | — | DCE Sales Desk SGP | — | — | — |
| RM-0091 | — | rm.chan@abs.com | — | — | — | — | — |
| RM-0118 | David Wong | david.wong@abs.com | Central HK Branch | DCE Sales Desk HKG | MGR-0045 | Michael Chan | michael.chan@abs.com |
| RM-0134 | Annie | rm.annie@abs.com | — | — | — | — | — |
| RM-9999 | INVALID | unknown@abs.com | N/A — not in HR system | N/A | N/A | N/A | N/A |

### Existing Cases (from DB Seed — do not recreate in test)

| Case ID | Client | Account Type | Priority | Status | Source |
|---|---|---|---|---|---|
| AO-2026-000101 | ABC Trading Pte Ltd | INSTITUTIONAL_FUTURES | URGENT | ACTIVE (at N-1) | EMAIL |
| AO-2026-000102 | Global Commodities HK Ltd | OTC_DERIVATIVES | STANDARD | ACTIVE (at N-0) | PORTAL |
| AO-2026-000103 | Tan Wei Ming | RETAIL_FUTURES | DEFERRED | ACTIVE (at N-0 FAILED) | EMAIL |
| AO-2026-000104 | Zhonghua Resources Trading Co Ltd | COMMODITIES_PHYSICAL | STANDARD | ACTIVE (at N-1) | EMAIL |
| AO-2026-000105 | Asiatic Growth Fund LP | MULTI_PRODUCT | URGENT | ACTIVE (at N-1) | PORTAL |
| AO-2026-000106 | Pacific Securities Ltd | INSTITUTIONAL_FUTURES | STANDARD | ACTIVE (at N-1) | EMAIL |
| AO-2026-000108 | Li Mei Ling | RETAIL_FUTURES | STANDARD | ACTIVE (at N-1) | EMAIL |

### Account Type Classification Rules (from KB-1)

| Account Type | Primary Product Signals | Entity Types | Confidence Range (clear) |
|---|---|---|---|
| INSTITUTIONAL_FUTURES | FUTURES, OPTIONS, SGX, CME, HKEX + board res | CORP, FI | 0.90–0.98 |
| RETAIL_FUTURES | FUTURES, PERSONAL_INVESTMENT, retail wording | INDIVIDUAL | 0.90–0.99 |
| OTC_DERIVATIVES | OTC, IRS, CCS, FX_FORWARD, SWAP, ISDA | CORP, FUND, SPV | 0.90–0.99 |
| COMMODITIES_PHYSICAL | PHYSICAL, WAREHOUSE, DELIVERY, METALS, ENERGY | CORP | 0.90–0.98 |
| MULTI_PRODUCT | 2+ distinct families: futures + OTC + physical | FUND, CORP | 0.88–0.97 |

### SLA Windows (from KB-9)

| Account Type | URGENT (hours) | STANDARD (hours) | DEFERRED (hours) |
|---|---|---|---|
| INSTITUTIONAL_FUTURES | 2 | 24 | 72 |
| RETAIL_FUTURES | 8 | 24 | 72 |
| OTC_DERIVATIVES | 2 | 16 | 48 |
| COMMODITIES_PHYSICAL | 4 | 20 | 72 |
| MULTI_PRODUCT | 2 | 18 | 72 |

### Case ID Format

New cases are assigned by `sa1_create_case_full` using the format:

```
AO-{YEAR}-{SEQUENCE:06d}
e.g. AO-2026-000109
```

The sequence is auto-incremented from the highest existing `case_id` in `dce_ao_case_state`.

---

## Category A — Happy Path / Success Scenarios

These test cases validate the end-to-end success path for all five account types across all three submission channels (EMAIL, PORTAL, API). A successful run must produce:

- `status: "success"` in the workflow output
- A valid `case_id` matching pattern `AO-2026-\d{6}`
- An `n0_output` JSON with populated account_type, priority, client_name, and confidence
- DB records written to: `dce_ao_case_state`, `dce_ao_submission_raw`, `dce_ao_classification_result`, `dce_ao_rm_hierarchy`, `dce_ao_node_checkpoint`, `dce_ao_event_log`

---

### SA1-TC-001

**Title:** INSTITUTIONAL_FUTURES via EMAIL — Corporate SGP Futures Account, URGENT Priority

**Objective:** Verify that a well-formed EMAIL submission for a Singapore-domiciled corporate entity requesting exchange-traded futures is correctly classified as INSTITUTIONAL_FUTURES with URGENT priority, and that all downstream DB writes complete atomically.

**Preconditions:**
- RM-0042 (John Tan) exists in `dce_ao_rm_hierarchy` and HR system.
- No duplicate `raw_payload_hash` exists for this payload in `dce_ao_submission_raw`.
- MCP endpoint `https://dcemcptools-production.up.railway.app/mcp` is reachable.
- KB-1 dataset is indexed in Dify with score threshold 0.75.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"email_message_id":"MSG-TC001-001","sender_email":"rm.john@abs.com","subject":"URGENT: New DCE Account Opening - XYZ Futures Trading Pte Ltd - Institutional Futures SGP","body_text":"Dear DCE Team, Please urgently initiate AO for XYZ Futures Trading Pte Ltd. Corporate entity, SGP domiciled. Client requests SGX and CME futures trading. Regulatory reporting deadline is approaching within 48h. Board resolution and corporate profile attached. Regards, John Tan RM-0042","attachments":[{"filename":"AO_Form_Signed.pdf","size_bytes":245760},{"filename":"Board_Resolution.pdf","size_bytes":102400}]}` |
| received_at | 2026-03-03 09:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | INSTITUTIONAL_FUTURES |
| confidence | 0.88–1.00 |
| priority | URGENT |
| client_name | XYZ Futures Trading Pte Ltd (or similar extraction) |
| case_id | Matches `AO-2026-\d{6}` |
| flagged_for_review | false |
| next_node | N-1 |

**Validation Criteria:**
1. Workflow output `status` equals `"success"`.
2. `n0_output.account_type` equals `"INSTITUTIONAL_FUTURES"`.
3. `n0_output.confidence` is in range [0.88, 1.00].
4. `n0_output.priority` equals `"URGENT"` (triggered by "regulatory deadline approaching within 48h" signal).
5. `case_id` is present and matches pattern `AO-2026-\d{6}`.
6. `dce_ao_case_state` record: `status=ACTIVE`, `current_node=N-1`, `case_type=INSTITUTIONAL_FUTURES`, `priority=URGENT`, `rm_id=RM-0042`.
7. `dce_ao_classification_result` record: `account_type=INSTITUTIONAL_FUTURES`, `flagged_for_review=0`.
8. `dce_ao_node_checkpoint` record: `node_id=N-0`, `status=COMPLETE`, `next_node=N-1`.
9. `dce_ao_event_log` contains events: `SUBMISSION_RECEIVED`, `CASE_CLASSIFIED`, `CASE_CREATED`, `NODE_COMPLETED`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"MSG-TC001-001\",\"sender_email\":\"rm.john@abs.com\",\"subject\":\"URGENT: New DCE Account Opening - XYZ Futures Trading Pte Ltd - Institutional Futures SGP\",\"body_text\":\"Dear DCE Team, Please urgently initiate AO for XYZ Futures Trading Pte Ltd. Corporate entity, SGP domiciled. Client requests SGX and CME futures trading. Regulatory reporting deadline is approaching within 48h. Board resolution and corporate profile attached. Regards, John Tan RM-0042\",\"attachments\":[{\"filename\":\"AO_Form_Signed.pdf\",\"size_bytes\":245760},{\"filename\":\"Board_Resolution.pdf\",\"size_bytes\":102400}]}","received_at":"2026-03-03 09:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-002

**Title:** INSTITUTIONAL_FUTURES via PORTAL — FI Entity HKG, STANDARD Priority

**Objective:** Verify that a PORTAL form submission for a Hong Kong financial institution (SFC-licensed) requesting exchange-traded futures is classified as INSTITUTIONAL_FUTURES, routed through the Portal Normaliser, and assigned STANDARD priority.

**Preconditions:**
- RM-0118 (David Wong) exists with HKG branch assignment.
- Portal form ID `PF-TC002-001` has not been previously submitted.

**Input:**

| Field | Value |
|---|---|
| submission_source | PORTAL |
| raw_payload_json | `{"portal_form_id":"PF-TC002-001","form_data_json":{"client_name":"Pacific Capital Markets Ltd","entity_type":"FI","jurisdiction":"HKG","products":["FUTURES","OPTIONS","HKEX"],"lei":"254900HXUXVBR7SRCK15","notes":"SFC-licensed financial institution. CMF + derivatives mandate."}}` |
| received_at | 2026-03-03 10:00:00 |
| rm_employee_id | RM-0118 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | INSTITUTIONAL_FUTURES |
| confidence | 0.88–1.00 |
| priority | STANDARD |
| client_name | Pacific Capital Markets Ltd |
| case_id | Matches `AO-2026-\d{6}` |
| flagged_for_review | false |
| next_node | N-1 |

**Validation Criteria:**
1. Workflow output `status` equals `"success"`.
2. Portal Normaliser path was exercised: `dce_ao_submission_raw.portal_form_id = 'PF-TC002-001'`.
3. `n0_output.account_type` equals `"INSTITUTIONAL_FUTURES"`.
4. `n0_output.priority` equals `"STANDARD"` (no urgency signals present).
5. `dce_ao_classification_result.client_entity_type` equals `"FI"`.
6. `dce_ao_classification_result.jurisdiction` equals `"HKG"`.
7. `dce_ao_node_checkpoint.status` equals `"COMPLETE"`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"PORTAL","raw_payload_json":"{\"portal_form_id\":\"PF-TC002-001\",\"form_data_json\":{\"client_name\":\"Pacific Capital Markets Ltd\",\"entity_type\":\"FI\",\"jurisdiction\":\"HKG\",\"products\":[\"FUTURES\",\"OPTIONS\",\"HKEX\"],\"lei\":\"254900HXUXVBR7SRCK15\",\"notes\":\"SFC-licensed financial institution. CMF + derivatives mandate.\"}}","received_at":"2026-03-03 10:00:00","rm_employee_id":"RM-0118","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-003

**Title:** INSTITUTIONAL_FUTURES via API — Corporate SGP, Direct API Submission

**Objective:** Verify that a well-formed API submission for a Singapore corporate entity (default/else routing path in Source Router) is normalised via the API Normaliser and correctly classified as INSTITUTIONAL_FUTURES.

**Preconditions:**
- RM-0091 (rm.chan@abs.com) is a valid RM.
- API source triggers the `false` branch (else) of the Source Router if-else node.

**Input:**

| Field | Value |
|---|---|
| submission_source | API |
| raw_payload_json | `{"client_name":"Meridian Capital SGP Corp","entity_type":"CORP","jurisdiction":"SGP","products":["FUTURES","OPTIONS","SGX_DERIVATIVES"],"lei":"529900T8BM49AURSDO55","request_type":"NEW_ACCOUNT"}` |
| received_at | 2026-03-03 11:00:00 |
| rm_employee_id | RM-0091 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | INSTITUTIONAL_FUTURES |
| confidence | 0.88–1.00 |
| priority | STANDARD |
| client_name | Meridian Capital SGP Corp |
| case_id | Matches `AO-2026-\d{6}` |
| flagged_for_review | false |
| next_node | N-1 |

**Validation Criteria:**
1. Workflow output `status` equals `"success"`.
2. `dce_ao_submission_raw.submission_source` equals `"API"`.
3. `dce_ao_submission_raw.email_message_id` is NULL (API submissions have no email fields).
4. `dce_ao_submission_raw.portal_form_id` is NULL.
5. `n0_output.account_type` equals `"INSTITUTIONAL_FUTURES"`.
6. API Normaliser correctly sets `attachments_count = 0` (no attachments in API source).

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"API","raw_payload_json":"{\"client_name\":\"Meridian Capital SGP Corp\",\"entity_type\":\"CORP\",\"jurisdiction\":\"SGP\",\"products\":[\"FUTURES\",\"OPTIONS\",\"SGX_DERIVATIVES\"],\"lei\":\"529900T8BM49AURSDO55\",\"request_type\":\"NEW_ACCOUNT\"}","received_at":"2026-03-03 11:00:00","rm_employee_id":"RM-0091","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-004

**Title:** RETAIL_FUTURES via EMAIL — Individual SGP Resident, STANDARD Priority

**Objective:** Verify that an email submission for a Singapore individual retail client requesting personal futures trading is classified as RETAIL_FUTURES with STANDARD priority, and the entity type is correctly identified as INDIVIDUAL.

**Preconditions:**
- RM-0134 (rm.annie@abs.com) is a valid RM.
- NRIC/passport reference in email body should trigger INDIVIDUAL entity classification.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"email_message_id":"MSG-TC004-001","sender_email":"rm.annie@abs.com","subject":"New DCE Retail AO - Chen Wei Jian - Individual SGP Futures","body_text":"Dear DCE Team, Please initiate retail futures account for Chen Wei Jian, Singapore citizen (NRIC S8812345A). Individual client, personal investment account. Interested in SGX futures trading. Risk disclosure signed. AO form and NRIC copy attached.","attachments":[{"filename":"AO_Form_Individual.pdf","size_bytes":184320},{"filename":"NRIC_ChenWeiJian.pdf","size_bytes":61440}]}` |
| received_at | 2026-03-03 09:30:00 |
| rm_employee_id | RM-0134 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | RETAIL_FUTURES |
| confidence | 0.88–1.00 |
| priority | STANDARD |
| client_name | Chen Wei Jian |
| client_entity_type | INDIVIDUAL |
| jurisdiction | SGP |
| case_id | Matches `AO-2026-\d{6}` |
| flagged_for_review | false |

**Validation Criteria:**
1. `n0_output.account_type` equals `"RETAIL_FUTURES"`.
2. `dce_ao_classification_result.client_entity_type` equals `"INDIVIDUAL"`.
3. `dce_ao_classification_result.jurisdiction` equals `"SGP"`.
4. `n0_output.priority` equals `"STANDARD"` (no same-day activation signal).
5. SLA deadline is approximately `received_at + 24h` = `2026-03-04 09:30:00`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"MSG-TC004-001\",\"sender_email\":\"rm.annie@abs.com\",\"subject\":\"New DCE Retail AO - Chen Wei Jian - Individual SGP Futures\",\"body_text\":\"Dear DCE Team, Please initiate retail futures account for Chen Wei Jian, Singapore citizen (NRIC S8812345A). Individual client, personal investment account. Interested in SGX futures trading. Risk disclosure signed. AO form and NRIC copy attached.\",\"attachments\":[{\"filename\":\"AO_Form_Individual.pdf\",\"size_bytes\":184320},{\"filename\":\"NRIC_ChenWeiJian.pdf\",\"size_bytes\":61440}]}","received_at":"2026-03-03 09:30:00","rm_employee_id":"RM-0134","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-005

**Title:** RETAIL_FUTURES via PORTAL — Individual HKG Client, STANDARD Priority

**Objective:** Verify that a PORTAL submission for a Hong Kong individual retail client is classified as RETAIL_FUTURES with jurisdiction HKG, and that jurisdiction-specific document requirements (HKID) are reflected in the classification output.

**Preconditions:**
- RM-0118 (David Wong) with HKG desk assignment.
- Portal form includes `entity_type: INDIVIDUAL` and `jurisdiction: HKG`.

**Input:**

| Field | Value |
|---|---|
| submission_source | PORTAL |
| raw_payload_json | `{"portal_form_id":"PF-TC005-001","form_data_json":{"client_name":"Wong Mei Ling","entity_type":"INDIVIDUAL","jurisdiction":"HKG","products":["FUTURES","HKEX"],"notes":"Individual HKG client. HKID and proof of address uploaded."},"uploaded_doc_ids":["UPLOAD-001","UPLOAD-002"]}` |
| received_at | 2026-03-03 10:30:00 |
| rm_employee_id | RM-0118 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | RETAIL_FUTURES |
| confidence | 0.88–1.00 |
| priority | STANDARD |
| client_name | Wong Mei Ling |
| client_entity_type | INDIVIDUAL |
| jurisdiction | HKG |
| case_id | Matches `AO-2026-\d{6}` |

**Validation Criteria:**
1. `n0_output.account_type` equals `"RETAIL_FUTURES"`.
2. `dce_ao_classification_result.jurisdiction` equals `"HKG"`.
3. `dce_ao_classification_result.client_entity_type` equals `"INDIVIDUAL"`.
4. Portal Normaliser correctly extracts `attachments_count = 2` from `uploaded_doc_ids`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"PORTAL","raw_payload_json":"{\"portal_form_id\":\"PF-TC005-001\",\"form_data_json\":{\"client_name\":\"Wong Mei Ling\",\"entity_type\":\"INDIVIDUAL\",\"jurisdiction\":\"HKG\",\"products\":[\"FUTURES\",\"HKEX\"],\"notes\":\"Individual HKG client. HKID and proof of address uploaded.\"},\"uploaded_doc_ids\":[\"UPLOAD-001\",\"UPLOAD-002\"]}","received_at":"2026-03-03 10:30:00","rm_employee_id":"RM-0118","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-006

**Title:** RETAIL_FUTURES via API — Individual Client Direct API Submission

**Objective:** Verify that an API channel submission for a retail individual client is classified correctly as RETAIL_FUTURES, with the API Normaliser properly handling the absence of email and portal fields.

**Preconditions:**
- RM-0042 is a valid RM.
- API payload explicitly identifies entity_type as INDIVIDUAL.

**Input:**

| Field | Value |
|---|---|
| submission_source | API |
| raw_payload_json | `{"client_name":"Ng Boon Hwee","entity_type":"INDIVIDUAL","jurisdiction":"SGP","products":["FUTURES","SGX"],"nric":"S7534521B","request_type":"NEW_RETAIL_ACCOUNT"}` |
| received_at | 2026-03-03 11:30:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | RETAIL_FUTURES |
| confidence | 0.88–1.00 |
| priority | STANDARD |
| client_name | Ng Boon Hwee |
| client_entity_type | INDIVIDUAL |
| case_id | Matches `AO-2026-\d{6}` |

**Validation Criteria:**
1. `n0_output.account_type` equals `"RETAIL_FUTURES"`.
2. `dce_ao_classification_result.client_entity_type` equals `"INDIVIDUAL"`.
3. `dce_ao_submission_raw.attachments_count` equals `0` (API Normaliser default).
4. `dce_ao_node_checkpoint.status` equals `"COMPLETE"`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"API","raw_payload_json":"{\"client_name\":\"Ng Boon Hwee\",\"entity_type\":\"INDIVIDUAL\",\"jurisdiction\":\"SGP\",\"products\":[\"FUTURES\",\"SGX\"],\"nric\":\"S7534521B\",\"request_type\":\"NEW_RETAIL_ACCOUNT\"}","received_at":"2026-03-03 11:30:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-007

**Title:** OTC_DERIVATIVES via EMAIL — Corporate SGP IRS/CCS Request, URGENT Priority

**Objective:** Verify that an email submission explicitly referencing OTC products (interest rate swaps, currency swaps) is classified as OTC_DERIVATIVES, and that the presence of a counterparty deadline triggers URGENT priority per KB-9.

**Preconditions:**
- RM-0042 (John Tan) is a valid RM.
- OTC-specific signals (IRS, CCS, ISDA, counterparty deadline) must be present in the email body.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"email_message_id":"MSG-TC007-001","sender_email":"rm.john@abs.com","subject":"URGENT: OTC Derivatives AO - Northstar Capital SGP - Counterparty Deadline","body_text":"Dear DCE Team, Please initiate OTC derivatives account for Northstar Capital Pte Ltd. Corporate entity, SGP domiciled. Client requires IRS and CCS capability under ISDA Master. Counterparty (Goldman Sachs) has imposed a 24h deadline for GTA Schedule 9 execution. GTA and board docs attached. Regards, John Tan RM-0042","attachments":[{"filename":"GTA_Schedule9_Draft.pdf","size_bytes":307200},{"filename":"Board_Resolution.pdf","size_bytes":102400},{"filename":"ISDA_Master_Signed.pdf","size_bytes":450560}]}` |
| received_at | 2026-03-03 08:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | OTC_DERIVATIVES |
| confidence | 0.90–1.00 |
| priority | URGENT |
| client_name | Northstar Capital Pte Ltd |
| client_entity_type | CORP |
| jurisdiction | SGP |
| case_id | Matches `AO-2026-\d{6}` |
| flagged_for_review | false |

**Validation Criteria:**
1. `n0_output.account_type` equals `"OTC_DERIVATIVES"`.
2. `n0_output.priority` equals `"URGENT"` (counterparty deadline within 24h is a hard urgency signal per KB-9 `priority_override_urgency` rule).
3. SLA deadline is approximately `received_at + 2h` = `2026-03-03 10:00:00`.
4. `dce_ao_classification_result.products_requested` contains `["IRS","CCS"]` or similar OTC terms.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"MSG-TC007-001\",\"sender_email\":\"rm.john@abs.com\",\"subject\":\"URGENT: OTC Derivatives AO - Northstar Capital SGP - Counterparty Deadline\",\"body_text\":\"Dear DCE Team, Please initiate OTC derivatives account for Northstar Capital Pte Ltd. Corporate entity, SGP domiciled. Client requires IRS and CCS capability under ISDA Master. Counterparty (Goldman Sachs) has imposed a 24h deadline for GTA Schedule 9 execution. GTA and board docs attached. Regards, John Tan RM-0042\",\"attachments\":[{\"filename\":\"GTA_Schedule9_Draft.pdf\",\"size_bytes\":307200},{\"filename\":\"Board_Resolution.pdf\",\"size_bytes\":102400},{\"filename\":\"ISDA_Master_Signed.pdf\",\"size_bytes\":450560}]}","received_at":"2026-03-03 08:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-008

**Title:** OTC_DERIVATIVES via PORTAL — SPV Entity OTHER Jurisdiction, STANDARD Priority

**Objective:** Verify that a PORTAL submission for an SPV entity with OTC hedging mandate in a non-standard jurisdiction (OTHER) is correctly classified as OTC_DERIVATIVES, with jurisdiction set to OTHER and enhanced due diligence flags noted in the reasoning.

**Preconditions:**
- RM-0055 (rm.lee@abs.com) is a valid RM.
- Payload contains SPV entity type and OTC hedging product signals.

**Input:**

| Field | Value |
|---|---|
| submission_source | PORTAL |
| raw_payload_json | `{"portal_form_id":"PF-TC008-001","form_data_json":{"client_name":"Cayman Structured Finance SPV Ltd","entity_type":"SPV","jurisdiction":"OTHER","products":["OTC_DERIVATIVES","DERIVATIVE_HEDGE","STRUCTURED"],"notes":"Cayman Islands SPV. OTC hedging mandate. GTA Sch 9 and UBO declaration provided."},"uploaded_doc_ids":["UPLOAD-SPV-001","UPLOAD-SPV-002","UPLOAD-SPV-003"]}` |
| received_at | 2026-03-03 13:00:00 |
| rm_employee_id | RM-0055 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | OTC_DERIVATIVES |
| confidence | 0.78–0.92 |
| priority | STANDARD |
| client_name | Cayman Structured Finance SPV Ltd |
| client_entity_type | SPV |
| jurisdiction | OTHER |
| case_id | Matches `AO-2026-\d{6}` |

**Validation Criteria:**
1. `n0_output.account_type` equals `"OTC_DERIVATIVES"`.
2. `dce_ao_classification_result.client_entity_type` equals `"SPV"`.
3. `dce_ao_classification_result.jurisdiction` equals `"OTHER"`.
4. `dce_ao_classification_result.flagged_for_review` may be `1` if confidence falls below 0.80 (acceptable per KB-1 SPV confidence range 0.78–0.92).

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"PORTAL","raw_payload_json":"{\"portal_form_id\":\"PF-TC008-001\",\"form_data_json\":{\"client_name\":\"Cayman Structured Finance SPV Ltd\",\"entity_type\":\"SPV\",\"jurisdiction\":\"OTHER\",\"products\":[\"OTC_DERIVATIVES\",\"DERIVATIVE_HEDGE\",\"STRUCTURED\"],\"notes\":\"Cayman Islands SPV. OTC hedging mandate. GTA Sch 9 and UBO declaration provided.\"},\"uploaded_doc_ids\":[\"UPLOAD-SPV-001\",\"UPLOAD-SPV-002\",\"UPLOAD-SPV-003\"]}","received_at":"2026-03-03 13:00:00","rm_employee_id":"RM-0055","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-009

**Title:** OTC_DERIVATIVES via API — Corporate HKG Direct Submission, STANDARD Priority

**Objective:** Verify that an API submission for a Hong Kong corporate entity with explicit OTC derivatives product scope is classified correctly, exercising the API Normaliser path for OTC accounts.

**Preconditions:**
- RM-0091 (rm.chan@abs.com) is a valid RM.

**Input:**

| Field | Value |
|---|---|
| submission_source | API |
| raw_payload_json | `{"client_name":"Sino Capital Management HK Ltd","entity_type":"CORP","jurisdiction":"HKG","products":["OTC_DERIVATIVES","FX_FORWARD","FX_OPTION"],"lei":"529900GKFG8E0HKWJB23","request_type":"NEW_OTC_ACCOUNT"}` |
| received_at | 2026-03-03 14:00:00 |
| rm_employee_id | RM-0091 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | OTC_DERIVATIVES |
| confidence | 0.88–1.00 |
| priority | STANDARD |
| client_name | Sino Capital Management HK Ltd |
| client_entity_type | CORP |
| jurisdiction | HKG |
| case_id | Matches `AO-2026-\d{6}` |

**Validation Criteria:**
1. `n0_output.account_type` equals `"OTC_DERIVATIVES"`.
2. `dce_ao_classification_result.jurisdiction` equals `"HKG"`.
3. `n0_output.priority` equals `"STANDARD"` (no urgency signals).

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"API","raw_payload_json":"{\"client_name\":\"Sino Capital Management HK Ltd\",\"entity_type\":\"CORP\",\"jurisdiction\":\"HKG\",\"products\":[\"OTC_DERIVATIVES\",\"FX_FORWARD\",\"FX_OPTION\"],\"lei\":\"529900GKFG8E0HKWJB23\",\"request_type\":\"NEW_OTC_ACCOUNT\"}","received_at":"2026-03-03 14:00:00","rm_employee_id":"RM-0091","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-010

**Title:** COMMODITIES_PHYSICAL via EMAIL — PRC Corporate, Warehouse and Delivery Signals, STANDARD Priority

**Objective:** Verify that an email submission for a PRC corporate entity with explicit physical commodity delivery and warehouse language (matching KB-1 CHN/CORP pattern for COMMODITIES_PHYSICAL) is classified correctly with CHN jurisdiction.

**Preconditions:**
- RM-0055 (rm.lee@abs.com) is a valid RM with Chinese client book.
- Email body contains warehouse, delivery, and physical settlement signals.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"email_message_id":"MSG-TC010-001","sender_email":"rm.lee@abs.com","subject":"New DCE AO - Huatai Energy Resources Corp - Commodities Physical CHN","body_text":"Dear DCE Team, Please initiate physical commodities account for Huatai Energy Resources Corp. PRC entity, CHN jurisdiction. Client requires physical delivery of base metals and energy commodities. Warehouse agreement attached, delivery instructions and GTA Schedule 10 to follow. English translations of PRC corporate docs attached.","attachments":[{"filename":"Cert_Incorp_Huatai_EN.pdf","size_bytes":307200},{"filename":"Warehouse_Agreement_Draft.pdf","size_bytes":204800}]}` |
| received_at | 2026-03-03 11:00:00 |
| rm_employee_id | RM-0055 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | COMMODITIES_PHYSICAL |
| confidence | 0.88–1.00 |
| priority | STANDARD |
| client_name | Huatai Energy Resources Corp |
| client_entity_type | CORP |
| jurisdiction | CHN |
| case_id | Matches `AO-2026-\d{6}` |
| flagged_for_review | false |

**Validation Criteria:**
1. `n0_output.account_type` equals `"COMMODITIES_PHYSICAL"`.
2. `dce_ao_classification_result.jurisdiction` equals `"CHN"`.
3. `n0_output.priority` equals `"STANDARD"` (no shipment/delivery deadline imminent).
4. `dce_ao_classification_result.account_type_reasoning` references physical delivery and/or warehouse terms.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"MSG-TC010-001\",\"sender_email\":\"rm.lee@abs.com\",\"subject\":\"New DCE AO - Huatai Energy Resources Corp - Commodities Physical CHN\",\"body_text\":\"Dear DCE Team, Please initiate physical commodities account for Huatai Energy Resources Corp. PRC entity, CHN jurisdiction. Client requires physical delivery of base metals and energy commodities. Warehouse agreement attached, delivery instructions and GTA Schedule 10 to follow. English translations of PRC corporate docs attached.\",\"attachments\":[{\"filename\":\"Cert_Incorp_Huatai_EN.pdf\",\"size_bytes\":307200},{\"filename\":\"Warehouse_Agreement_Draft.pdf\",\"size_bytes\":204800}]}","received_at":"2026-03-03 11:00:00","rm_employee_id":"RM-0055","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-011

**Title:** COMMODITIES_PHYSICAL via PORTAL — SGP Corporate, URGENT Priority (Shipment Deadline)

**Objective:** Verify that a PORTAL submission for a Singapore corporate entity with a shipment/delivery deadline triggers URGENT priority for COMMODITIES_PHYSICAL per KB-9 SLA rule (4-hour SLA window).

**Preconditions:**
- RM-0073 is a valid RM.
- Portal form contains delivery deadline urgency signal.

**Input:**

| Field | Value |
|---|---|
| submission_source | PORTAL |
| raw_payload_json | `{"portal_form_id":"PF-TC011-001","form_data_json":{"client_name":"Eastgate Commodities Pte Ltd","entity_type":"CORP","jurisdiction":"SGP","products":["PHYSICAL_COMMODITIES","DELIVERABLE","WAREHOUSE"],"notes":"URGENT: Shipment slot dependency. Client has warehouse booking in 4h. Physical commodities account required immediately for delivery processing. Commodity trading licence attached."},"uploaded_doc_ids":["UPLOAD-COM-001","UPLOAD-COM-002","UPLOAD-COM-003"]}` |
| received_at | 2026-03-03 09:00:00 |
| rm_employee_id | RM-0073 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | COMMODITIES_PHYSICAL |
| confidence | 0.86–1.00 |
| priority | URGENT |
| client_name | Eastgate Commodities Pte Ltd |
| client_entity_type | CORP |
| jurisdiction | SGP |
| case_id | Matches `AO-2026-\d{6}` |

**Validation Criteria:**
1. `n0_output.account_type` equals `"COMMODITIES_PHYSICAL"`.
2. `n0_output.priority` equals `"URGENT"` (shipment/warehouse slot dependency is a hard urgency signal per KB-9).
3. SLA deadline is approximately `received_at + 4h` = `2026-03-03 13:00:00`.
4. `dce_ao_classification_result.jurisdiction` equals `"SGP"`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"PORTAL","raw_payload_json":"{\"portal_form_id\":\"PF-TC011-001\",\"form_data_json\":{\"client_name\":\"Eastgate Commodities Pte Ltd\",\"entity_type\":\"CORP\",\"jurisdiction\":\"SGP\",\"products\":[\"PHYSICAL_COMMODITIES\",\"DELIVERABLE\",\"WAREHOUSE\"],\"notes\":\"URGENT: Shipment slot dependency. Client has warehouse booking in 4h. Physical commodities account required immediately for delivery processing. Commodity trading licence attached.\"},\"uploaded_doc_ids\":[\"UPLOAD-COM-001\",\"UPLOAD-COM-002\",\"UPLOAD-COM-003\"]}","received_at":"2026-03-03 09:00:00","rm_employee_id":"RM-0073","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-012

**Title:** COMMODITIES_PHYSICAL via API — Direct API Submission, DEFERRED Priority

**Objective:** Verify that an API submission for a planned physical commodities account (future activation, no immediate delivery window) is classified as COMMODITIES_PHYSICAL with DEFERRED priority.

**Preconditions:**
- RM-0042 is a valid RM.
- API payload includes a planned activation note indicating no immediate requirement.

**Input:**

| Field | Value |
|---|---|
| submission_source | API |
| raw_payload_json | `{"client_name":"Pacific Grain Holdings Corp","entity_type":"CORP","jurisdiction":"SGP","products":["COMMODITIES_PHYSICAL","AGRICULTURAL_COMMODITIES"],"activation_target":"2026-06-01","request_type":"NEW_ACCOUNT","notes":"Planned activation Q2 2026. No immediate delivery window."}` |
| received_at | 2026-03-03 15:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | COMMODITIES_PHYSICAL |
| confidence | 0.86–1.00 |
| priority | DEFERRED |
| client_name | Pacific Grain Holdings Corp |
| client_entity_type | CORP |
| case_id | Matches `AO-2026-\d{6}` |

**Validation Criteria:**
1. `n0_output.account_type` equals `"COMMODITIES_PHYSICAL"`.
2. `n0_output.priority` equals `"DEFERRED"` (planned activation, no near-term delivery window per KB-9).
3. `dce_ao_classification_result.priority_reason` references planned activation or future-dated signals.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"API","raw_payload_json":"{\"client_name\":\"Pacific Grain Holdings Corp\",\"entity_type\":\"CORP\",\"jurisdiction\":\"SGP\",\"products\":[\"COMMODITIES_PHYSICAL\",\"AGRICULTURAL_COMMODITIES\"],\"activation_target\":\"2026-06-01\",\"request_type\":\"NEW_ACCOUNT\",\"notes\":\"Planned activation Q2 2026. No immediate delivery window.\"}","received_at":"2026-03-03 15:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-013

**Title:** MULTI_PRODUCT via EMAIL — Fund Entity SGP, Multiple GTA Schedules, URGENT Priority

**Objective:** Verify that an email submission explicitly spanning multiple product families (listed futures + OTC derivatives + physical commodities) for a fund entity is classified as MULTI_PRODUCT with URGENT priority, matching the DB seed case AO-2026-000105 profile (Asiatic Growth Fund LP archetype).

**Preconditions:**
- RM-0073 is a valid RM.
- Email body contains explicit multi-product signals (futures + OTC + physical).

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"email_message_id":"MSG-TC013-001","sender_email":"rm.client@abs.com","subject":"URGENT: Multi-Product DCE AO - Eastbourne Capital Fund LP - Strategic Go-Live Deadline","body_text":"Dear DCE Team, Please initiate multi-product account for Eastbourne Capital Fund LP. SGP-domiciled fund. Client requires: (1) SGX futures and options trading, (2) OTC derivatives including IRS and FX forwards under ISDA, (3) physical commodities with warehouse delivery. Strategic client with multiple product enablement deadline of 2026-03-05. PPM and IMA attached.","attachments":[{"filename":"Fund_PPM_Eastbourne.pdf","size_bytes":512000},{"filename":"Fund_IMA_Eastbourne.pdf","size_bytes":307200}]}` |
| received_at | 2026-03-03 09:00:00 |
| rm_employee_id | RM-0073 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | MULTI_PRODUCT |
| confidence | 0.88–1.00 |
| priority | URGENT |
| client_name | Eastbourne Capital Fund LP |
| client_entity_type | FUND |
| jurisdiction | SGP |
| case_id | Matches `AO-2026-\d{6}` |
| flagged_for_review | false |

**Validation Criteria:**
1. `n0_output.account_type` equals `"MULTI_PRODUCT"`.
2. `dce_ao_classification_result.client_entity_type` equals `"FUND"`.
3. `n0_output.priority` equals `"URGENT"` (strategic client + multiple product enablement deadline per KB-9 MULTI_PRODUCT/URGENT rule).
4. `dce_ao_classification_result.products_requested` contains multiple product categories.
5. SLA deadline is approximately `received_at + 2h`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"MSG-TC013-001\",\"sender_email\":\"rm.client@abs.com\",\"subject\":\"URGENT: Multi-Product DCE AO - Eastbourne Capital Fund LP - Strategic Go-Live Deadline\",\"body_text\":\"Dear DCE Team, Please initiate multi-product account for Eastbourne Capital Fund LP. SGP-domiciled fund. Client requires: (1) SGX futures and options trading, (2) OTC derivatives including IRS and FX forwards under ISDA, (3) physical commodities with warehouse delivery. Strategic client with multiple product enablement deadline of 2026-03-05. PPM and IMA attached.\",\"attachments\":[{\"filename\":\"Fund_PPM_Eastbourne.pdf\",\"size_bytes\":512000},{\"filename\":\"Fund_IMA_Eastbourne.pdf\",\"size_bytes\":307200}]}","received_at":"2026-03-03 09:00:00","rm_employee_id":"RM-0073","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-014

**Title:** MULTI_PRODUCT via PORTAL — Corporate HKG, Combined Listed and OTC, STANDARD Priority

**Objective:** Verify that a PORTAL submission for a Hong Kong corporate entity requesting a combined listed derivatives and OTC product scope is classified as MULTI_PRODUCT per KB-1 HKG/CORP multi-product decision rule.

**Preconditions:**
- RM-0118 (David Wong) with HKG desk assignment.
- Portal form contains both FUTURES and OTC_DERIVATIVES product selections.

**Input:**

| Field | Value |
|---|---|
| submission_source | PORTAL |
| raw_payload_json | `{"portal_form_id":"PF-TC014-001","form_data_json":{"client_name":"HK Multi Asset Trading Corp","entity_type":"CORP","jurisdiction":"HKG","products":["FUTURES","OTC_DERIVATIVES","STRUCTURED","HKEX"],"notes":"Combined listed and OTC scope. Board resolution and multi-schedule GTA package to be submitted."},"uploaded_doc_ids":["UPLOAD-MP-001","UPLOAD-MP-002","UPLOAD-MP-003","UPLOAD-MP-004"]}` |
| received_at | 2026-03-03 14:00:00 |
| rm_employee_id | RM-0118 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | MULTI_PRODUCT |
| confidence | 0.84–1.00 |
| priority | STANDARD |
| client_name | HK Multi Asset Trading Corp |
| client_entity_type | CORP |
| jurisdiction | HKG |
| case_id | Matches `AO-2026-\d{6}` |

**Validation Criteria:**
1. `n0_output.account_type` equals `"MULTI_PRODUCT"`.
2. `dce_ao_classification_result.jurisdiction` equals `"HKG"`.
3. `n0_output.priority` equals `"STANDARD"` (no immediate deadline signals).

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"PORTAL","raw_payload_json":"{\"portal_form_id\":\"PF-TC014-001\",\"form_data_json\":{\"client_name\":\"HK Multi Asset Trading Corp\",\"entity_type\":\"CORP\",\"jurisdiction\":\"HKG\",\"products\":[\"FUTURES\",\"OTC_DERIVATIVES\",\"STRUCTURED\",\"HKEX\"],\"notes\":\"Combined listed and OTC scope. Board resolution and multi-schedule GTA package to be submitted.\"},\"uploaded_doc_ids\":[\"UPLOAD-MP-001\",\"UPLOAD-MP-002\",\"UPLOAD-MP-003\",\"UPLOAD-MP-004\"]}","received_at":"2026-03-03 14:00:00","rm_employee_id":"RM-0118","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-015

**Title:** MULTI_PRODUCT via API — Fund SGP Direct API, DEFERRED Priority (Long-Horizon Activation)

**Objective:** Verify that an API submission for a Singapore fund requesting multi-product access with a long-horizon activation date (Q3 2026) is classified as MULTI_PRODUCT with DEFERRED priority.

**Preconditions:**
- RM-0042 is a valid RM.
- Payload includes multi-product signals and a distant go-live target.

**Input:**

| Field | Value |
|---|---|
| submission_source | API |
| raw_payload_json | `{"client_name":"Emerald Multi Strategy Fund LP","entity_type":"FUND","jurisdiction":"SGP","products":["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL","MULTI_ASSET"],"activation_target":"2026-09-01","request_type":"NEW_ACCOUNT","notes":"Long-horizon activation Q3 2026. No near-term trading intent."}` |
| received_at | 2026-03-03 16:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| account_type | MULTI_PRODUCT |
| confidence | 0.88–1.00 |
| priority | DEFERRED |
| client_name | Emerald Multi Strategy Fund LP |
| client_entity_type | FUND |
| jurisdiction | SGP |
| case_id | Matches `AO-2026-\d{6}` |

**Validation Criteria:**
1. `n0_output.account_type` equals `"MULTI_PRODUCT"`.
2. `n0_output.priority` equals `"DEFERRED"` (long-horizon activation per KB-9 MULTI_PRODUCT/DEFERRED rule).
3. `dce_ao_classification_result.client_entity_type` equals `"FUND"`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"API","raw_payload_json":"{\"client_name\":\"Emerald Multi Strategy Fund LP\",\"entity_type\":\"FUND\",\"jurisdiction\":\"SGP\",\"products\":[\"FUTURES\",\"OTC_DERIVATIVES\",\"COMMODITIES_PHYSICAL\",\"MULTI_ASSET\"],\"activation_target\":\"2026-09-01\",\"request_type\":\"NEW_ACCOUNT\",\"notes\":\"Long-horizon activation Q3 2026. No near-term trading intent.\"}","received_at":"2026-03-03 16:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

## Category B — Edge Cases

These test cases exercise boundary conditions and exceptional input scenarios that the SA-1 workflow must handle gracefully without crashing.

---

### SA1-TC-016

**Title:** Low Confidence (0.70–0.79) — Terse Email Body Triggers Flagged-for-Review

**Objective:** Verify that a deliberately sparse email body with ambiguous product signals produces a classification confidence in the 0.70–0.79 range, which the Confidence Gate node correctly marks as `flagged_for_review = true` while still allowing the workflow to proceed (no blocking).

**Preconditions:**
- RM-0042 is a valid RM.
- Email body is intentionally sparse — only generic "derivatives" mention, no specific product codes.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"email_message_id":"MSG-TC016-001","sender_email":"rm.john@abs.com","subject":"AO Request - Vague Corp","body_text":"Hi, please open a derivatives trading account for Vague Corp. Thanks.","attachments":[]}` |
| received_at | 2026-03-03 10:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| confidence | 0.70–0.79 |
| flagged_for_review | true |
| workflow_status | success (workflow proceeds, does not block) |
| case_id | Matches `AO-2026-\d{6}` |

**Validation Criteria:**
1. Workflow output `status` is `"success"` — low confidence alone does not abort the workflow (0.70 is the minimum pass threshold per the Confidence Gate node: `is_valid = confidence >= 0.70`).
2. `dce_ao_classification_result.flagged_for_review` equals `1` (true).
3. `dce_ao_classification_result.account_type_confidence` is in range [0.70, 0.79].
4. `n0_output` contains a valid `case_id`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"MSG-TC016-001\",\"sender_email\":\"rm.john@abs.com\",\"subject\":\"AO Request - Vague Corp\",\"body_text\":\"Hi, please open a derivatives trading account for Vague Corp. Thanks.\",\"attachments\":[]}","received_at":"2026-03-03 10:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-017

**Title:** Missing Optional Fields — No Attachments, No Subject Line

**Objective:** Verify that an EMAIL submission with minimal fields (no attachments array, no subject, only body_text and sender_email) is processed without error, with the Email Normaliser gracefully defaulting missing fields.

**Preconditions:**
- RM-0118 is a valid RM.
- Email Normaliser uses `.get()` with empty defaults for all optional fields.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"sender_email":"david.wong@abs.com","body_text":"Please open institutional futures account for Atlas Trading Corp. SGP entity. Board docs to follow."}` |
| received_at | 2026-03-03 11:00:00 |
| rm_employee_id | RM-0118 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| workflow_status | success |
| case_id | Matches `AO-2026-\d{6}` |
| account_type | INSTITUTIONAL_FUTURES (inferred from context) |
| attachments_count | 0 (defaulted) |
| email_message_id | empty string (gracefully missing) |
| email_subject | empty string (gracefully missing) |

**Validation Criteria:**
1. Workflow does not error out due to missing optional JSON fields.
2. `dce_ao_submission_raw.attachments_count` equals `0`.
3. `dce_ao_submission_raw.email_message_id` is NULL.
4. `dce_ao_submission_raw.email_subject` is NULL.
5. Classification is produced despite minimal input.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"sender_email\":\"david.wong@abs.com\",\"body_text\":\"Please open institutional futures account for Atlas Trading Corp. SGP entity. Board docs to follow.\"}","received_at":"2026-03-03 11:00:00","rm_employee_id":"RM-0118","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-018

**Title:** Invalid RM Employee ID (RM-9999) — HR System Failure Path

**Objective:** Verify the behaviour when an invalid RM ID (RM-9999, which is not registered in the HR system) is provided, replicating the known failure scenario seeded in `AO-2026-000103`. The MCP tool `sa1_create_case_full` should still execute (RM validation is performed within the tool), and the result should reflect the RM resolution outcome.

**Preconditions:**
- RM-9999 is confirmed absent from `dce_ao_rm_hierarchy` in the seed data.
- Case AO-2026-000103 exists with status FAILED for reference context.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"email_message_id":"MSG-TC018-001","sender_email":"unknown@abs.com","subject":"AO Request - New Individual Client","body_text":"Please open retail futures account for Lim Ah Kow. Individual client, Singapore resident.","attachments":[{"filename":"NRIC_LimAhKow.pdf","size_bytes":61440}]}` |
| received_at | 2026-03-03 10:00:00 |
| rm_employee_id | RM-9999 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| workflow_status | success OR escalation (acceptable) |
| rm_employee_id in DB | RM-9999 (stored as-is) |
| rm_name / rm_email | empty strings (RM not in HR) |
| flagged_for_review | true (recommended) |

**Validation Criteria:**
1. The workflow does not throw an unhandled exception.
2. If a case is created, `dce_ao_case_state.rm_id` equals `"RM-9999"`.
3. `dce_ao_rm_hierarchy.resolution_source` may be `"HR_SYSTEM"` but `rm_name` will be empty.
4. If the N0Output Validator blocks due to a downstream validation error (not strictly RM-ID validation but possible confidence failure), the End: Escalation node is triggered and `validation_errors` are returned.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"MSG-TC018-001\",\"sender_email\":\"unknown@abs.com\",\"subject\":\"AO Request - New Individual Client\",\"body_text\":\"Please open retail futures account for Lim Ah Kow. Individual client, Singapore resident.\",\"attachments\":[{\"filename\":\"NRIC_LimAhKow.pdf\",\"size_bytes\":61440}]}","received_at":"2026-03-03 10:00:00","rm_employee_id":"RM-9999","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-019

**Title:** Empty Attachments Array — Portal Submission with No Documents Uploaded

**Objective:** Verify that a PORTAL submission with an empty `uploaded_doc_ids` array (no documents staged at intake) is processed without error, with `attachments_count = 0` and the case created normally for subsequent SA-2 document chasing.

**Preconditions:**
- RM-0042 is a valid RM.
- Portal form data is complete but no documents have been uploaded yet.

**Input:**

| Field | Value |
|---|---|
| submission_source | PORTAL |
| raw_payload_json | `{"portal_form_id":"PF-TC019-001","form_data_json":{"client_name":"Beta Futures Corp","entity_type":"CORP","jurisdiction":"SGP","products":["FUTURES","SGX"]},"uploaded_doc_ids":[]}` |
| received_at | 2026-03-03 12:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| workflow_status | success |
| case_id | Matches `AO-2026-\d{6}` |
| attachments_count | 0 |
| account_type | INSTITUTIONAL_FUTURES |

**Validation Criteria:**
1. Workflow completes without error despite zero attachments.
2. `dce_ao_submission_raw.attachments_count` equals `0`.
3. `dce_ao_case_state.status` equals `"ACTIVE"` and `current_node` equals `"N-1"`.
4. No document records created in `dce_ao_document_staged` for this case.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"PORTAL","raw_payload_json":"{\"portal_form_id\":\"PF-TC019-001\",\"form_data_json\":{\"client_name\":\"Beta Futures Corp\",\"entity_type\":\"CORP\",\"jurisdiction\":\"SGP\",\"products\":[\"FUTURES\",\"SGX\"]},\"uploaded_doc_ids\":[]}","received_at":"2026-03-03 12:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-020

**Title:** Smart Quotes and BOM Characters in raw_payload_json — Context Injector Sanitisation

**Objective:** Verify that the Context Injector node's sanitisation logic correctly strips BOM characters (`\ufeff`), replaces smart/curly quotes (`\u201c`, `\u201d`, `\u2018`, `\u2019`) with straight quotes, and strips markdown code fences before parsing the JSON payload.

**Preconditions:**
- Payload is crafted to contain smart quotes around JSON string values.
- No other test should produce duplicate `raw_payload_hash` for this payload.

**Input:**

| Field | Value |
|---|---|
| submission_source | API |
| raw_payload_json | `{"client_name":"\u201cSmartQuote Corp\u201d","entity_type":"CORP","jurisdiction":"SGP","products":["\u2018FUTURES\u2019","SGX"]}` |
| received_at | 2026-03-03 13:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| workflow_status | success |
| client_name | SmartQuote Corp (smart quotes stripped) |
| parse_error | empty string |
| case_id | Matches `AO-2026-\d{6}` |

**Validation Criteria:**
1. Workflow does not return a JSON parse error.
2. `client_name` in classification result is `"SmartQuote Corp"` (quotes removed by sanitiser).
3. Classification proceeds normally after sanitisation.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"API","raw_payload_json":"{\"client_name\":\"\u201cSmartQuote Corp\u201d\",\"entity_type\":\"CORP\",\"jurisdiction\":\"SGP\",\"products\":[\"\u2018FUTURES\u2019\",\"SGX\"]}","received_at":"2026-03-03 13:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-021

**Title:** Duplicate Submission Hash — Idempotency Deduplication Test

**Objective:** Verify that submitting the same raw payload a second time results in a database-level unique key violation on `raw_payload_hash` in `dce_ao_submission_raw`, which the MCP tool `sa1_create_case_full` handles via rollback, returning `status: "error"`.

**Preconditions:**
- SA1-TC-001 has already been executed and created a case.
- The identical payload from SA1-TC-001 is resubmitted without changing `case_id` (this is not a retry — it is an unintended duplicate).

**Input:** Use the identical `raw_payload_json` and `received_at` from SA1-TC-001.

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | (identical to SA1-TC-001 payload) |
| received_at | 2026-03-03 09:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| workflow_status | success (workflow) / error in mcp_create |
| mcp_create field | Contains "Duplicate entry" or similar DB error message |
| new case_id created | false (no new record in dce_ao_case_state) |

**Validation Criteria:**
1. The Dify workflow itself may return `status: "success"` (the workflow node completes) but the `mcp_create` field in the output will contain the MySQL duplicate key error.
2. No new row is inserted into `dce_ao_case_state` — row count in the table is unchanged.
3. `case_id` in workflow output is `"UNKNOWN"` (the MCP tool's error return sets `case_id: null`).

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"MSG-TC001-001\",\"sender_email\":\"rm.john@abs.com\",\"subject\":\"URGENT: New DCE Account Opening - XYZ Futures Trading Pte Ltd - Institutional Futures SGP\",\"body_text\":\"Dear DCE Team, Please urgently initiate AO for XYZ Futures Trading Pte Ltd. Corporate entity, SGP domiciled. Client requests SGX and CME futures trading. Regulatory reporting deadline is approaching within 48h. Board resolution and corporate profile attached. Regards, John Tan RM-0042\",\"attachments\":[{\"filename\":\"AO_Form_Signed.pdf\",\"size_bytes\":245760},{\"filename\":\"Board_Resolution.pdf\",\"size_bytes\":102400}]}","received_at":"2026-03-03 09:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-022

**Title:** Markdown Code Fence Wrapping in raw_payload_json — Context Injector Fence Stripping

**Objective:** Verify that the Context Injector node's `re.sub` logic correctly strips markdown code fences (` ```json ... ``` `) from the raw payload before JSON parsing, preventing parse failures from LLM-formatted payloads.

**Preconditions:**
- Payload is wrapped in markdown code fences as may occur when an LLM or CRM system auto-formats the JSON.

**Input:**

| Field | Value |
|---|---|
| submission_source | API |
| raw_payload_json | ` ```json {"client_name":"Fenced Corp","entity_type":"CORP","jurisdiction":"SGP","products":["FUTURES"]} ``` ` |
| received_at | 2026-03-03 14:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| workflow_status | success |
| parse_error | empty |
| client_name | Fenced Corp |
| case_id | Matches `AO-2026-\d{6}` |

**Validation Criteria:**
1. The Context Injector strips the ` ```json ` and ` ``` ` wrappers before `json.loads()`.
2. No `parse_error` is returned in the Context Injector output.
3. Classification proceeds normally.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"API","raw_payload_json":"```json {\"client_name\":\"Fenced Corp\",\"entity_type\":\"CORP\",\"jurisdiction\":\"SGP\",\"products\":[\"FUTURES\"]} ```","received_at":"2026-03-03 14:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

## Category C — Retry / Resume Scenarios

These test cases validate the workflow's ability to handle resubmission of an existing case by providing a `case_id` (the `is_retry = true` branch).

---

### SA1-TC-023

**Title:** Retry with Existing Case ID — Resume from Known FAILED State (AO-2026-000103)

**Objective:** Verify that providing an existing `case_id` from a previously FAILED case (`AO-2026-000103`, Tan Wei Ming, RM-9999) sets `is_retry = "True"` in the Context Injector output, and that the workflow processes the retry with the updated RM (providing a valid RM ID on retry).

**Preconditions:**
- Case `AO-2026-000103` exists in `dce_ao_case_state` with `status=ACTIVE`, `current_node=N-0`, `failed_nodes=[{"node":"N-0","reason":"RM not found in HR system"}]`.
- This test provides a corrected RM ID to simulate manual RM assignment on retry.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"email_message_id":"BBNkBHF3YzI1ZDk4LTk4MzItNGViOC1iNDU2LWM1ZDZlZmRmYjU4Mw","sender_email":"rm.annie@abs.com","subject":"AO Request - Tan Wei Ming - RETRY with corrected RM","body_text":"Please open retail futures account for Tan Wei Ming. Individual client, Singapore resident. This is a corrected resubmission with valid RM assignment.","attachments":[{"filename":"NRIC_TanWeiMing.pdf","size_bytes":61440}]}` |
| received_at | 2026-03-03 10:00:00 |
| rm_employee_id | RM-0134 |
| case_id | AO-2026-000103 |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| is_retry | "True" |
| workflow_status | success |
| case_id in output | AO-2026-000103 (existing, not a new case) |
| account_type | RETAIL_FUTURES |
| dce_ao_node_checkpoint attempt_number | 2 |

**Validation Criteria:**
1. Context Injector sets `is_retry = "True"` because `case_id` is non-empty.
2. The workflow does NOT create a new `dce_ao_case_state` record (existing case is updated).
3. A new `dce_ao_node_checkpoint` record is created with `attempt_number = 2` for case `AO-2026-000103`.
4. `dce_ao_case_state.retry_counts` is updated: `{"N-0": 1}`.
5. `dce_ao_event_log` contains a new `NODE_COMPLETED` event for `AO-2026-000103`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"BBNkBHF3YzI1ZDk4LTk4MzItNGViOC1iNDU2LWM1ZDZlZmRmYjU4Mw\",\"sender_email\":\"rm.annie@abs.com\",\"subject\":\"AO Request - Tan Wei Ming - RETRY with corrected RM\",\"body_text\":\"Please open retail futures account for Tan Wei Ming. Individual client, Singapore resident. This is a corrected resubmission with valid RM assignment.\",\"attachments\":[{\"filename\":\"NRIC_TanWeiMing.pdf\",\"size_bytes\":61440}]}","received_at":"2026-03-03 10:00:00","rm_employee_id":"RM-0134","case_id":"AO-2026-000103"},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-024

**Title:** Retry with IN_PROGRESS Case — Portal Submission Resume (AO-2026-000102)

**Objective:** Verify that providing the `case_id` of a case currently in `IN_PROGRESS` state at N-0 (`AO-2026-000102`, Global Commodities HK Ltd, RM-0118) correctly triggers the retry path, re-runs classification on the fresh portal payload, and updates the checkpoint with `attempt_number = 2`.

**Preconditions:**
- Case `AO-2026-000102` exists with `status=ACTIVE`, `current_node=N-0`, and the N-0 checkpoint `status=IN_PROGRESS`.

**Input:**

| Field | Value |
|---|---|
| submission_source | PORTAL |
| raw_payload_json | `{"portal_form_id":"PF-20260302-007","form_data_json":{"client_name":"Global Commodities HK Ltd","entity_type":"CORP","products":["OTC_DERIVATIVES","COMMODITIES_PHYSICAL"],"jurisdiction":"HKG"}}` |
| received_at | 2026-03-03 09:00:00 |
| rm_employee_id | RM-0118 |
| case_id | AO-2026-000102 |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| is_retry | "True" |
| workflow_status | success |
| case_id in output | AO-2026-000102 |
| account_type | OTC_DERIVATIVES |
| dce_ao_node_checkpoint attempt_number | 2 |

**Validation Criteria:**
1. No new `dce_ao_case_state` record is created.
2. New `dce_ao_node_checkpoint` with `attempt_number = 2`, `status = COMPLETE`, `node_id = N-0`.
3. `dce_ao_case_state.current_node` advances to `"N-1"`.
4. A `NODE_COMPLETED` event is written to `dce_ao_event_log`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"PORTAL","raw_payload_json":"{\"portal_form_id\":\"PF-20260302-007\",\"form_data_json\":{\"client_name\":\"Global Commodities HK Ltd\",\"entity_type\":\"CORP\",\"products\":[\"OTC_DERIVATIVES\",\"COMMODITIES_PHYSICAL\"],\"jurisdiction\":\"HKG\"}}","received_at":"2026-03-03 09:00:00","rm_employee_id":"RM-0118","case_id":"AO-2026-000102"},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-025

**Title:** Third Retry Attempt — Max Retry Reached, Escalation Triggered

**Objective:** Verify that when `attempt_number = 3` (the maximum per `SA1_MAX_RETRIES`), a failure triggers the escalation path in `sa1_complete_node`: the event_payload includes `"escalation": "ESCALATE_RM_MANAGER"` instead of `"retry"`.

**Preconditions:**
- Case `AO-2026-000103` has been retried once already (SA1-TC-023 has been run).
- `retry_counts` for N-0 on this case is `{"N-0": 1}`.
- This test simulates a second manual retry that also fails (e.g., still ambiguous payload).

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"email_message_id":"MSG-TC025-001","sender_email":"unknown@abs.com","subject":"AO","body_text":"open account","attachments":[]}` |
| received_at | 2026-03-03 11:00:00 |
| rm_employee_id | RM-9999 |
| case_id | AO-2026-000103 |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| is_retry | "True" |
| escalation in event_log | "ESCALATE_RM_MANAGER" |
| validation_errors | Contains at least one error (low confidence or missing client_name) |
| End node triggered | End: Escalation |

**Validation Criteria:**
1. The N0Output Validator returns `is_valid = "false"` due to sub-0.70 confidence or missing client_name from terse body.
2. The Validation Pass? if-else node routes to the `false` branch — triggering `End: Escalation`.
3. `dce_ao_event_log` event for this attempt has `event_payload.escalation = "ESCALATE_RM_MANAGER"` (because `attempt_number >= SA1_MAX_RETRIES = 3`).
4. `validation_errors` output lists the specific blocking errors.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"MSG-TC025-001\",\"sender_email\":\"unknown@abs.com\",\"subject\":\"AO\",\"body_text\":\"open account\",\"attachments\":[]}","received_at":"2026-03-03 11:00:00","rm_employee_id":"RM-9999","case_id":"AO-2026-000103"},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-026

**Title:** Retry with COMPLETE Case — Already Processed Case Provided as case_id

**Objective:** Verify the workflow behaviour when `case_id` refers to a case that has already completed N-0 (e.g., `AO-2026-000101`, status ACTIVE at N-1). This simulates an accidental double-submit of a case that already passed SA-1.

**Preconditions:**
- Case `AO-2026-000101` exists with `completed_nodes=["N-0"]`, `current_node=N-1`.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"email_message_id":"MSG-TC026-001","sender_email":"rm.john@abs.com","subject":"Re-submit AO-2026-000101 (already complete)","body_text":"Accidentally re-submitting AO for ABC Trading Pte Ltd. Case already created.","attachments":[]}` |
| received_at | 2026-03-03 12:00:00 |
| rm_employee_id | RM-0042 |
| case_id | AO-2026-000101 |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| is_retry | "True" |
| workflow_status | success (workflow completes) |
| case_id in output | AO-2026-000101 (existing) |
| dce_ao_node_checkpoint attempt_number | 2 (new attempt record written) |

**Validation Criteria:**
1. No new `dce_ao_case_state` record is created.
2. `sa1_complete_node` writes a new checkpoint with `attempt_number = 2`.
3. `dce_ao_case_state.current_node` remains `"N-1"` (no regression).
4. The UNIQUE KEY constraint `(case_id, node_id, attempt_number)` in `dce_ao_node_checkpoint` prevents duplicate attempt records.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"MSG-TC026-001\",\"sender_email\":\"rm.john@abs.com\",\"subject\":\"Re-submit AO-2026-000101 (already complete)\",\"body_text\":\"Accidentally re-submitting AO for ABC Trading Pte Ltd. Case already created.\",\"attachments\":[]}","received_at":"2026-03-03 12:00:00","rm_employee_id":"RM-0042","case_id":"AO-2026-000101"},"response_mode":"blocking","user":"qa-tester"}'
```

---

## Category D — Boundary and Negative Tests

These test cases verify that the workflow handles malformed, empty, or out-of-range inputs without producing unhandled exceptions or data corruption.

---

### SA1-TC-027

**Title:** Empty raw_payload_json — Empty String Input

**Objective:** Verify that the Context Injector's sanitisation handles an empty `raw_payload_json` string gracefully: `json.loads("")` should fail, `parse_error` is populated, `payload = {}`, and the workflow continues with empty-field defaults.

**Input:**

| Field | Value |
|---|---|
| submission_source | API |
| raw_payload_json | `` (empty string) |
| received_at | 2026-03-03 10:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| parse_error | non-empty (JSON parse error message) |
| payload_parsed | `{}` |
| workflow_outcome | Either produces low-confidence classification OR routes to End: Escalation |

**Validation Criteria:**
1. Workflow does not crash with an unhandled exception.
2. Context Injector returns `parse_error` as a non-empty string.
3. `payload_parsed` equals `"{}"`.
4. The LLM classifier receives an empty normalised intake and either produces a very low confidence classification (triggering Confidence Gate block) or the N0Output Validator blocks with `"Missing client_name"` error.
5. End: Escalation is triggered with `validation_errors` populated.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"API","raw_payload_json":"","received_at":"2026-03-03 10:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-028

**Title:** Malformed JSON in raw_payload_json — Syntax Error (Unclosed Brace)

**Objective:** Verify that a syntactically invalid JSON string (e.g., a missing closing brace) is caught by the Context Injector's `try/except` block, populates `parse_error`, and the workflow routes to the Escalation endpoint rather than crashing.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"sender_email":"rm.john@abs.com","subject":"Malformed Test","body_text":"test` |
| received_at | 2026-03-03 10:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| parse_error | non-empty (e.g., "Expecting ',' delimiter: line 1 column ...") |
| payload_parsed | `{}` |
| workflow_outcome | End: Escalation (validation_errors contain "Missing client_name") |

**Validation Criteria:**
1. Context Injector `parse_error` output is non-empty.
2. No unhandled exception raised at the Dify workflow level.
3. End: Escalation is triggered.
4. No `dce_ao_case_state` record is created for this malformed submission.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"sender_email\":\"rm.john@abs.com\",\"subject\":\"Malformed Test\",\"body_text\":\"test","received_at":"2026-03-03 10:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-029

**Title:** Invalid submission_source Value — Not in Permitted ENUM

**Objective:** Verify that providing an invalid `submission_source` value (e.g., `"FAX"`) that is not in the permitted list (`EMAIL`, `PORTAL`, `API`) is handled by the workflow. The Source Router if-else node will not match any case and will fall through to the `false` (API Normaliser / else) branch.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"client_name":"FAX Test Corp","entity_type":"CORP","jurisdiction":"SGP","products":["FUTURES"]}` |
| received_at | 2026-03-03 10:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Note:** The Dify `Start` node enforces a `select` type for `submission_source` with options `EMAIL`, `PORTAL`, `API`. Attempting to pass `"FAX"` via the API will either be rejected by Dify input validation or default to a valid option. This test verifies the Dify input validation layer. Use `"EMAIL"` as the actual value and document the Dify validation behaviour.

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| Dify validation | Returns HTTP 400 or input validation error if "FAX" is passed |
| Fallback behaviour | If bypassed, API Normaliser (else) handles the payload |

**Validation Criteria:**
1. Dify rejects the submission at the Start node level with a validation error if `"FAX"` is passed directly.
2. Document the HTTP response code and error message body.
3. No `dce_ao_case_state` record is created.

**curl Command (using valid source to verify else-branch fallback):**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"API","raw_payload_json":"{\"client_name\":\"API Test Corp\",\"entity_type\":\"CORP\",\"jurisdiction\":\"SGP\",\"products\":[\"FUTURES\"]}","received_at":"2026-03-03 10:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-030

**Title:** Confidence Below 0.70 Threshold — Escalation Path via Confidence Gate

**Objective:** Verify that when the Account Type Classifier returns a confidence below 0.70 (minimum valid threshold), the Confidence Gate sets `is_valid = "false"` and the N0Output Validator then appends `"Confidence too low"` to the errors list, routing the workflow to the `End: Escalation` node.

**Preconditions:**
- Payload must be deliberately ambiguous, containing conflicting or absent classification signals.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"email_message_id":"MSG-TC030-001","sender_email":"rm.john@abs.com","subject":"AO - Unknown Type","body_text":"Please open some kind of financial account for Mystery Holdings. Not sure what type. Maybe futures or physical or OTC? Just set it up somehow.","attachments":[]}` |
| received_at | 2026-03-03 10:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| is_valid (Confidence Gate) | "false" |
| validation_errors | Contains "Confidence too low" |
| End node triggered | End: Escalation |
| validation_errors output | Non-empty JSON array |
| partial_output | JSON with low-confidence classification data |

**Validation Criteria:**
1. The `Confidence Gate` code node sets `is_valid = "false"` when `confidence < 0.70`.
2. The `N0Output Validator` includes `"Confidence too low"` in the errors list.
3. The `Validation Pass?` if-else node routes to the `false` branch (End: Escalation).
4. No new `dce_ao_case_state` record is created (MCP tools are not called on escalation path).
5. The Dify workflow output contains `validation_errors` (array) and `partial_output` (partial classification).

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"MSG-TC030-001\",\"sender_email\":\"rm.john@abs.com\",\"subject\":\"AO - Unknown Type\",\"body_text\":\"Please open some kind of financial account for Mystery Holdings. Not sure what type. Maybe futures or physical or OTC? Just set it up somehow.\",\"attachments\":[]}","received_at":"2026-03-03 10:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-031

**Title:** Invalid account_type in LLM Output — N0Output Validator Rejection

**Objective:** Verify that if the Account Type Classifier LLM were to return a non-ENUM account_type value (e.g., `"DERIVATIVES_MISC"`), the N0Output Validator detects `account_type not in VALID_ACCT` and appends `"Invalid account_type"` to errors, routing to escalation.

**Note:** This is a synthetic test that cannot be triggered via normal payload alone, as the LLM is instructed to return only valid ENUM values. This test is intended for use with a mock/stub of the LLM output or as a documentation scenario for the N0Output Validator logic coverage.

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| validation_errors | Contains "Invalid account_type" |
| End node | End: Escalation |

**Validation Criteria (for stub/mock testing):**
1. N0Output Validator code node logic correctly rejects any value outside `VALID_ACCT = ["INSTITUTIONAL_FUTURES","RETAIL_FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL","MULTI_PRODUCT"]`.
2. Review the code node directly: inject a test classification_json with `"account_type": "DERIVATIVES_MISC"` and verify `errors` output.

---

### SA1-TC-032

**Title:** Missing rm_employee_id — Empty String

**Objective:** Verify the workflow handles a completely absent `rm_employee_id` field. The MCP tool `sa1_create_case_full` should still execute (RM ID is stored as-is), but the resulting RM hierarchy record will have no valid RM linkage.

**Input:**

| Field | Value |
|---|---|
| submission_source | API |
| raw_payload_json | `{"client_name":"Orphan Account Corp","entity_type":"CORP","jurisdiction":"SGP","products":["FUTURES"]}` |
| received_at | 2026-03-03 10:00:00 |
| rm_employee_id | `` (empty) |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| workflow_outcome | success (workflow) |
| dce_ao_case_state.rm_id | empty string |
| dce_ao_rm_hierarchy.rm_id | empty string |

**Validation Criteria:**
1. Workflow completes without crashing.
2. `dce_ao_case_state.rm_id` is stored as empty string or NULL.
3. A classification is produced and a case is created.
4. `dce_ao_rm_hierarchy` record has empty `rm_id` and `rm_name`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"API","raw_payload_json":"{\"client_name\":\"Orphan Account Corp\",\"entity_type\":\"CORP\",\"jurisdiction\":\"SGP\",\"products\":[\"FUTURES\"]}","received_at":"2026-03-03 10:00:00","rm_employee_id":"","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

## Category E — Channel-Specific Routing Tests

These test cases explicitly validate the Source Router if-else node's branching logic and confirm that each normaliser path is exercised correctly based on `submission_source`.

---

### SA1-TC-033

**Title:** EMAIL Channel — Verifies Email Normaliser Path (source-case-email branch)

**Objective:** Verify that when `submission_source = "EMAIL"`, the Source Router routes to the `source-case-email` branch (node ID `1000000004`, Email Normaliser), and the normalised intake contains email-specific fields: `email_message_id`, `sender_email`, `subject`, `body_text`, `attachments_count`.

**Preconditions:**
- RM-0042 is a valid RM.
- Payload is a well-formed EMAIL schema with all email-specific fields present.

**Input:**

| Field | Value |
|---|---|
| submission_source | EMAIL |
| raw_payload_json | `{"email_message_id":"MSG-TC033-ROUTE-EMAIL","sender_email":"rm.john@abs.com","subject":"Channel Routing Test - EMAIL Path","body_text":"Testing EMAIL normaliser path. Corporate futures account for Alpha Routing Corp. SGP entity.","attachments":[{"filename":"Test_Doc.pdf","size_bytes":102400}]}` |
| received_at | 2026-03-03 10:00:00 |
| rm_employee_id | RM-0042 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| normaliser_path | Email Normaliser (source-case-email) |
| source in normalised_intake | "EMAIL" |
| email_message_id | "MSG-TC033-ROUTE-EMAIL" |
| sender_email | "rm.john@abs.com" |
| attachments_count | 1 |
| workflow_status | success |

**Validation Criteria:**
1. `dce_ao_submission_raw.submission_source` equals `"EMAIL"`.
2. `dce_ao_submission_raw.email_message_id` equals `"MSG-TC033-ROUTE-EMAIL"`.
3. `dce_ao_submission_raw.sender_email` equals `"rm.john@abs.com"`.
4. `dce_ao_submission_raw.portal_form_id` is NULL (Email Normaliser does not extract portal fields).
5. `dce_ao_submission_raw.attachments_count` equals `1`.
6. End: Success node is triggered.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"EMAIL","raw_payload_json":"{\"email_message_id\":\"MSG-TC033-ROUTE-EMAIL\",\"sender_email\":\"rm.john@abs.com\",\"subject\":\"Channel Routing Test - EMAIL Path\",\"body_text\":\"Testing EMAIL normaliser path. Corporate futures account for Alpha Routing Corp. SGP entity.\",\"attachments\":[{\"filename\":\"Test_Doc.pdf\",\"size_bytes\":102400}]}","received_at":"2026-03-03 10:00:00","rm_employee_id":"RM-0042","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-034

**Title:** PORTAL Channel — Verifies Portal Normaliser Path (source-case-portal branch)

**Objective:** Verify that when `submission_source = "PORTAL"`, the Source Router routes to the `source-case-portal` branch (node ID `1000000005`, Portal Normaliser), and the normalised intake contains portal-specific fields: `portal_form_id`, `client_name`, `entity_type`, `jurisdiction`, `products`, `attachments_count` (from `uploaded_doc_ids`).

**Preconditions:**
- RM-0118 is a valid RM.
- Payload is a well-formed PORTAL schema with `portal_form_id` and `form_data_json`.

**Input:**

| Field | Value |
|---|---|
| submission_source | PORTAL |
| raw_payload_json | `{"portal_form_id":"PF-TC034-ROUTE-PORTAL","form_data_json":{"client_name":"Portal Routing Test Corp","entity_type":"CORP","jurisdiction":"HKG","products":["FUTURES"]},"uploaded_doc_ids":["DOC-PORTAL-001","DOC-PORTAL-002","DOC-PORTAL-003"]}` |
| received_at | 2026-03-03 11:00:00 |
| rm_employee_id | RM-0118 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| normaliser_path | Portal Normaliser (source-case-portal) |
| source in normalised_intake | "PORTAL" |
| portal_form_id | "PF-TC034-ROUTE-PORTAL" |
| attachments_count | 3 (length of uploaded_doc_ids) |
| email_message_id in DB | NULL |
| workflow_status | success |

**Validation Criteria:**
1. `dce_ao_submission_raw.submission_source` equals `"PORTAL"`.
2. `dce_ao_submission_raw.portal_form_id` equals `"PF-TC034-ROUTE-PORTAL"`.
3. `dce_ao_submission_raw.email_message_id` is NULL (Portal Normaliser does not extract email fields).
4. `dce_ao_submission_raw.attachments_count` equals `3` (count of `uploaded_doc_ids`).
5. `dce_ao_submission_raw.portal_form_data` contains the `form_data_json` JSON object.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"PORTAL","raw_payload_json":"{\"portal_form_id\":\"PF-TC034-ROUTE-PORTAL\",\"form_data_json\":{\"client_name\":\"Portal Routing Test Corp\",\"entity_type\":\"CORP\",\"jurisdiction\":\"HKG\",\"products\":[\"FUTURES\"]},\"uploaded_doc_ids\":[\"DOC-PORTAL-001\",\"DOC-PORTAL-002\",\"DOC-PORTAL-003\"]}","received_at":"2026-03-03 11:00:00","rm_employee_id":"RM-0118","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-035

**Title:** API Channel — Verifies API Normaliser Path (false / else branch)

**Objective:** Verify that when `submission_source = "API"`, the Source Router routes to the `false` (else) branch (node ID `1000000006`, API Normaliser), and the normalised intake contains API-specific fields: `client_name`, `entity_type`, `jurisdiction`, `products`, `lei`, with `attachments_count` hard-coded to `0`.

**Preconditions:**
- RM-0091 is a valid RM.
- Payload is a well-formed API schema with all structured fields.

**Input:**

| Field | Value |
|---|---|
| submission_source | API |
| raw_payload_json | `{"client_name":"API Routing Test Corp","entity_type":"CORP","jurisdiction":"SGP","products":["FUTURES","OPTIONS"],"lei":"API123456789LEI","request_type":"NEW_ACCOUNT"}` |
| received_at | 2026-03-03 12:00:00 |
| rm_employee_id | RM-0091 |
| case_id | (empty) |

**Expected Results:**

| Attribute | Expected Value |
|---|---|
| normaliser_path | API Normaliser (false/else) |
| source in normalised_intake | "API" |
| attachments_count | 0 (API Normaliser hardcoded default) |
| email_message_id in DB | NULL |
| portal_form_id in DB | NULL |
| workflow_status | success |

**Validation Criteria:**
1. `dce_ao_submission_raw.submission_source` equals `"API"`.
2. `dce_ao_submission_raw.email_message_id` is NULL.
3. `dce_ao_submission_raw.portal_form_id` is NULL.
4. `dce_ao_submission_raw.attachments_count` equals `0`.
5. The API Normaliser code sets `attachments_count: 0` explicitly in its output JSON (confirmed in the YAML source at node 1000000006: `"attachments_count\": 0`).
6. `dce_ao_classification_result.client_name` equals `"API Routing Test Corp"`.

**curl Command:**

```bash
curl -s -X POST "https://api.dify.ai/v1/workflows/run" \
  -H "Authorization: Bearer {{API_KEY}}" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"submission_source":"API","raw_payload_json":"{\"client_name\":\"API Routing Test Corp\",\"entity_type\":\"CORP\",\"jurisdiction\":\"SGP\",\"products\":[\"FUTURES\",\"OPTIONS\"],\"lei\":\"API123456789LEI\",\"request_type\":\"NEW_ACCOUNT\"}","received_at":"2026-03-03 12:00:00","rm_employee_id":"RM-0091","case_id":""},"response_mode":"blocking","user":"qa-tester"}'
```

---

### SA1-TC-036

**Title:** Variable Aggregator Merge — All Three Normalisers Produce Consistent Output Schema

**Objective:** Confirm that the Merge Intake variable aggregator (node ID `1000000007`) successfully merges `normalised_intake` from whichever normaliser path was activated, and the resulting `output` string is correctly passed to KB-1 retrieval and the Account Type Classifier LLM. This is validated by confirming that all three channel paths produce a case with identical required classification fields.

**Preconditions:**
- TC-033 (EMAIL), TC-034 (PORTAL), TC-035 (API) have all been executed.

**Validation Criteria (cross-test comparison):**
1. All three cases in `dce_ao_classification_result` have non-null `account_type`, `account_type_confidence`, `client_name`, `client_entity_type`, `jurisdiction`.
2. All three `dce_ao_node_checkpoint` records for the three cases have `status = "COMPLETE"` and `next_node = "N-1"`.
3. The `n0_output` structure from all three is identical in schema (though values differ by client name and jurisdiction).

**DB Verification Query:**

```sql
SELECT c.case_id, s.submission_source, c.account_type, c.account_type_confidence,
       c.client_name, c.client_entity_type, c.jurisdiction, cp.status, cp.next_node
FROM dce_ao_classification_result c
JOIN dce_ao_submission_raw s ON c.case_id = s.case_id
JOIN dce_ao_node_checkpoint cp ON c.case_id = cp.case_id AND cp.node_id = 'N-0'
WHERE c.client_name IN ('Alpha Routing Corp', 'Portal Routing Test Corp', 'API Routing Test Corp')
ORDER BY c.classified_at;
```

---

## 9. Test Execution Checklist

Use this checklist for each test cycle (pre-UAT, UAT, regression):

### Pre-Execution Setup

- [ ] Obtain valid `{{API_KEY}}` from Dify application settings.
- [ ] Confirm MCP endpoint health: `curl https://dcemcptools-production.up.railway.app/health` returns `{"status":"ok"}`.
- [ ] Confirm database is reachable and seed data is present: run the DB verification query in Section 2.
- [ ] Confirm KB-1 and KB-9 datasets are indexed in Dify with at least one chunk retrievable at score threshold 0.75.
- [ ] Note the current highest `case_id` in `dce_ao_case_state` (to track new cases created during testing).

### Execution Order

1. Execute Category E tests (SA1-TC-033 through SA1-TC-035) first to validate routing.
2. Execute Category A tests (SA1-TC-001 through SA1-TC-015) for each account type.
3. Execute Category B tests (SA1-TC-016 through SA1-TC-022) for edge cases.
4. Execute Category C tests (SA1-TC-023 through SA1-TC-026) for retry scenarios (order-dependent on prior test execution).
5. Execute Category D tests (SA1-TC-027 through SA1-TC-032) for negative tests.

### Post-Execution Verification

- [ ] Run DB verification queries from Section 2 to confirm all expected records were written.
- [ ] Confirm `dce_ao_event_log` event counts match expected totals (3 events per new case: SUBMISSION_RECEIVED, CASE_CLASSIFIED, CASE_CREATED; plus NODE_COMPLETED or NODE_FAILED).
- [ ] Confirm no orphaned `dce_ao_submission_raw` records without a corresponding `dce_ao_case_state` record (except for failed deduplication tests).
- [ ] Verify `dce_ao_notification_log` is not populated by SA-1 workflow directly (notifications are written by `sa1_notify_stakeholders` which is separate from the Dify workflow's MCP call pattern — the Dify workflow only calls `sa1_create_case_full` and `sa1_complete_node`).

---

## 10. Defect Classification Matrix

| Severity | Definition | Examples from SA-1 Context |
|---|---|---|
| P1 — Critical | Workflow crashes, data corruption, case not created when it should be | Unhandled exception in Context Injector; `sa1_create_case_full` rollback fails and partial write remains; `dce_ao_case_state` corrupted |
| P2 — High | Wrong classification outcome, wrong priority, SLA deadline miscalculated | INSTITUTIONAL_FUTURES classified as RETAIL_FUTURES; URGENT case assigned STANDARD priority; `sla_deadline` more than 15 minutes off |
| P3 — Medium | Correct outcome but data quality issue | `flagged_for_review` not set when confidence is 0.75; `products_requested` empty despite product signals in payload; `dce_ao_event_log` missing one of three events |
| P4 — Low | Non-critical cosmetic or formatting issue | `account_type_reasoning` is truncated; `priority_reason` does not cite specific KB-9 rule; `case_id` in `n0_output` is populated but `mcp_create` field shows a truncated response |

### Escalation Contacts

| Issue Type | Contact |
|---|---|
| Dify API / Workflow Configuration | DCE Platform Engineering |
| MCP Server / Railway Deployment | DCE Platform Engineering |
| Database / Schema Issues | DCE Data Engineering |
| KB-1 / KB-9 Content Issues | DCE Operations / Risk |
| Production Defects (P1/P2) | DCE AO Programme Manager |

---

*Document generated for DCE Account Opening Programme — SA-1 Intake & Triage Agent Quality Assurance.*
*Maintained by: DCE QA Engineering Team.*
*Next review: Prior to each major workflow version deployment.*
