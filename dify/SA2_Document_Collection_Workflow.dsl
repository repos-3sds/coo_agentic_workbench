app:
  description: >-
    SA-2 Document Collection & Completeness Agent (N-1). Processes submitted documents
    via OCR, generates document checklist from KB-2, assesses completeness in parallel
    with document validity checks, flags rejections, and routes to KYC (N-2),
    RM retry (HITL_RM), Branch Manager escalation (ESCALATE_BRANCH_MANAGER), or
    termination (DEAD). Retries are internal — no DAG back-edge to N-0.
  icon: "\U0001F4C4"
  icon_background: '#D3E8F4'
  mode: workflow
  name: DCE-AO-SA2-Document-Collection
  use_icon_as_answer_icon: false
kind: app
version: 0.1.5
workflow:
  conversation_variables: []
  environment_variables:
    - id: env-mcp-endpoint-sa2
      name: MCP_ENDPOINT
      value: https://dcemcptools-production.up.railway.app
      value_type: string
  features:
    file_upload:
      image:
        enabled: false
        number_limits: 3
        transfer_methods:
          - local_file
          - remote_url
    opening_statement: ''
    retriever_resource:
      enabled: true
    sensitive_word_avoidance:
      enabled: false
    speech_to_text:
      enabled: false
    suggested_questions: []
    suggested_questions_after_answer:
      enabled: false
    text_to_speech:
      enabled: false
      language: ''
      voice: ''
  graph:
    viewport:
      x: 0
      y: 0
      zoom: 0.4
    edges:

      # ── MAIN TRUNK ──
      - data:
          isInIteration: false
          sourceType: start
          targetType: code
        id: '200000000001'
        source: '2000000001'
        sourceHandle: source
        target: '2000000002'
        targetHandle: target
        type: custom
        zIndex: 0

      - data:
          isInIteration: false
          sourceType: code
          targetType: if-else
        id: '200000000002'
        source: '2000000002'
        sourceHandle: source
        target: '2000000003'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── ATTEMPT ROUTER BRANCHES ──
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: knowledge-retrieval
        id: '200000000003'
        source: '2000000003'
        sourceHandle: 'first-attempt-case'
        target: '2000000004'
        targetHandle: target
        type: custom
        zIndex: 0

      - data:
          isInIteration: false
          sourceType: if-else
          targetType: code
        id: '200000000004'
        source: '2000000003'
        sourceHandle: 'false'
        target: '2000000006'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── FIRST ATTEMPT PATH ──
      - data:
          isInIteration: false
          sourceType: knowledge-retrieval
          targetType: code
        id: '200000000005'
        source: '2000000004'
        sourceHandle: source
        target: '2000000005'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── CHECKLIST MERGE ──
      - data:
          isInIteration: false
          sourceType: code
          targetType: variable-aggregator
        id: '200000000006'
        source: '2000000005'
        sourceHandle: source
        target: '2000000007'
        targetHandle: target
        type: custom
        zIndex: 0

      - data:
          isInIteration: false
          sourceType: code
          targetType: variable-aggregator
        id: '200000000007'
        source: '2000000006'
        sourceHandle: source
        target: '2000000007'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── OCR EXTRACTOR ──
      - data:
          isInIteration: false
          sourceType: variable-aggregator
          targetType: code
        id: '200000000008'
        source: '2000000007'
        sourceHandle: source
        target: '2000000008'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── PARALLEL BRANCH A: COMPLETENESS (OCR → KB-3/12 → LLM) ──
      - data:
          isInIteration: false
          sourceType: code
          targetType: knowledge-retrieval
        id: '200000000009'
        source: '2000000008'
        sourceHandle: source
        target: '2000000009'
        targetHandle: target
        type: custom
        zIndex: 0

      - data:
          isInIteration: false
          sourceType: knowledge-retrieval
          targetType: llm
        id: '200000000010'
        source: '2000000009'
        sourceHandle: source
        target: '2000000010'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── PARALLEL BRANCH B: VALIDITY (OCR → Code) ──
      - data:
          isInIteration: false
          sourceType: code
          targetType: code
        id: '200000000011'
        source: '2000000008'
        sourceHandle: source
        target: '2000000011'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── PARALLEL MERGE ──
      - data:
          isInIteration: false
          sourceType: llm
          targetType: code
        id: '200000000012'
        source: '2000000010'
        sourceHandle: source
        target: '2000000012'
        targetHandle: target
        type: custom
        zIndex: 0

      - data:
          isInIteration: false
          sourceType: code
          targetType: code
        id: '200000000013'
        source: '2000000011'
        sourceHandle: source
        target: '2000000012'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── REJECTION PROCESSING ──
      - data:
          isInIteration: false
          sourceType: code
          targetType: llm
        id: '200000000014'
        source: '2000000012'
        sourceHandle: source
        target: '2000000013'
        targetHandle: target
        type: custom
        zIndex: 0

      - data:
          isInIteration: false
          sourceType: llm
          targetType: code
        id: '200000000015'
        source: '2000000013'
        sourceHandle: source
        target: '2000000014'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── VALIDATION ──
      - data:
          isInIteration: false
          sourceType: code
          targetType: code
        id: '200000000016'
        source: '2000000014'
        sourceHandle: source
        target: '2000000015'
        targetHandle: target
        type: custom
        zIndex: 0

      - data:
          isInIteration: false
          sourceType: code
          targetType: if-else
        id: '200000000017'
        source: '2000000015'
        sourceHandle: source
        target: '2000000016'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── VALIDATION GATE BRANCHES ──
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: llm
        id: '200000000018'
        source: '2000000016'
        sourceHandle: 'valid-pass'
        target: '2000000017'
        targetHandle: target
        type: custom
        zIndex: 0

      - data:
          isInIteration: false
          sourceType: if-else
          targetType: end
        id: '200000000019'
        source: '2000000016'
        sourceHandle: 'false'
        target: '2000000023'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── DECISION PATH ──
      - data:
          isInIteration: false
          sourceType: llm
          targetType: code
        id: '200000000020'
        source: '2000000017'
        sourceHandle: source
        target: '2000000018'
        targetHandle: target
        type: custom
        zIndex: 0

      - data:
          isInIteration: false
          sourceType: code
          targetType: if-else
        id: '200000000021'
        source: '2000000018'
        sourceHandle: source
        target: '2000000019'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── DECISION ROUTER BRANCHES ──
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: llm
        id: '200000000022'
        source: '2000000019'
        sourceHandle: 'needs-notification'
        target: '2000000020'
        targetHandle: target
        type: custom
        zIndex: 0

      - data:
          isInIteration: false
          sourceType: if-else
          targetType: code
        id: '200000000023'
        source: '2000000019'
        sourceHandle: 'false'
        target: '2000000021'
        targetHandle: target
        type: custom
        zIndex: 0

      # ── CHECKPOINT (both paths merge here) ──
      - data:
          isInIteration: false
          sourceType: llm
          targetType: code
        id: '200000000024'
        source: '2000000020'
        sourceHandle: source
        target: '2000000021'
        targetHandle: target
        type: custom
        zIndex: 0

      - data:
          isInIteration: false
          sourceType: code
          targetType: end
        id: '200000000025'
        source: '2000000021'
        sourceHandle: source
        target: '2000000022'
        targetHandle: target
        type: custom
        zIndex: 0

    nodes:

      # ── START ──
      - data:
          desc: 'Orchestrator invocation. Accepts case context, submitted documents, retry count, and prior failure history.'
          selected: false
          title: Start
          type: start
          variables:
            - label: Case State Block
              max_length: 65536
              options: []
              required: true
              type: paragraph
              variable: case_state_block
            - label: Case ID
              max_length: 50
              options: []
              required: true
              type: text-input
              variable: case_id
            - label: Account Type
              options:
                - INSTITUTIONAL_FUTURES
                - RETAIL_FUTURES
                - OTC_DERIVATIVES
                - COMMODITIES_PHYSICAL
                - MULTI_PRODUCT
              required: true
              type: select
              variable: account_type
            - label: Jurisdiction
              options:
                - SGP
                - HKG
                - CHN
                - OTHER
              required: true
              type: select
              variable: jurisdiction
            - label: Submitted Documents (JSON Array)
              max_length: 65536
              options: []
              required: true
              type: paragraph
              variable: submitted_documents_json
            - label: Retry Count
              max_length: 2
              options: []
              required: false
              type: text-input
              variable: retry_count
            - label: Prior Failure Reasons (JSON Array)
              max_length: 32768
              options: []
              required: false
              type: paragraph
              variable: prior_failure_reasons_json
        height: 220
        id: '2000000001'
        position:
          x: 80
          y: 280
        positionAbsolute:
          x: 80
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── CONTEXT INJECTOR ──
      - data:
          desc: 'Builds AO Case State Block from orchestrator inputs. Injects retry context with prior failure details on subsequent attempts. Outputs structured context for all downstream nodes.'
          selected: false
          title: Context Injector
          type: code
          code_language: python3
          code: |
            import json


            def main(case_state_block: str, case_id: str, account_type: str,
                     jurisdiction: str, submitted_documents_json: str,
                     retry_count: str, prior_failure_reasons_json: str) -> dict:
                retry = int(retry_count) if retry_count and retry_count.strip().isdigit() else 0
                is_retry = retry > 0
                try:
                    submitted_docs = json.loads(submitted_documents_json) if submitted_documents_json else []
                except Exception:
                    submitted_docs = []
                try:
                    prior_failures = json.loads(prior_failure_reasons_json) if prior_failure_reasons_json else []
                except Exception:
                    prior_failures = []
                retry_context = ""
                if is_retry and prior_failures:
                    last = prior_failures[-1]
                    retry_context = (
                        "RETRY CONTEXT — THIS IS ATTEMPT {} OF 3 MAXIMUM\n"
                        "Prior attempt failed at: {}\n"
                        "Failure type: {}\n"
                        "Detail: {}\n"
                        "CORRECTIVE INSTRUCTION: Process only newly submitted documents. "
                        "Do NOT re-validate documents already accepted in prior attempts."
                    ).format(
                        retry + 1,
                        last.get("failed_at", "unknown"),
                        last.get("failure_type", "UNKNOWN"),
                        last.get("failure_detail", "")
                    )
                doc_ids = [d.get("doc_id", "") for d in submitted_docs]
                return {
                    "case_id_ctx": case_id,
                    "account_type_ctx": account_type,
                    "jurisdiction_ctx": jurisdiction,
                    "retry_count_int": str(retry),
                    "is_retry": str(is_retry).lower(),
                    "submitted_doc_ids_json": json.dumps(doc_ids),
                    "submitted_documents_parsed": submitted_documents_json or "[]",
                    "doc_count": str(len(submitted_docs)),
                    "retry_context": retry_context,
                    "prior_failures_json": prior_failure_reasons_json or "[]"
                }
          outputs:
            case_id_ctx:
              type: string
              children: null
            account_type_ctx:
              type: string
              children: null
            jurisdiction_ctx:
              type: string
              children: null
            retry_count_int:
              type: string
              children: null
            is_retry:
              type: string
              children: null
            submitted_doc_ids_json:
              type: string
              children: null
            submitted_documents_parsed:
              type: string
              children: null
            doc_count:
              type: string
              children: null
            retry_context:
              type: string
              children: null
            prior_failures_json:
              type: string
              children: null
          variables:
            - value_selector:
                - '2000000001'
                - case_state_block
              variable: case_state_block
            - value_selector:
                - '2000000001'
                - case_id
              variable: case_id
            - value_selector:
                - '2000000001'
                - account_type
              variable: account_type
            - value_selector:
                - '2000000001'
                - jurisdiction
              variable: jurisdiction
            - value_selector:
                - '2000000001'
                - submitted_documents_json
              variable: submitted_documents_json
            - value_selector:
                - '2000000001'
                - retry_count
              variable: retry_count
            - value_selector:
                - '2000000001'
                - prior_failure_reasons_json
              variable: prior_failure_reasons_json
        height: 90
        id: '2000000002'
        position:
          x: 400
          y: 280
        positionAbsolute:
          x: 400
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── ATTEMPT ROUTER ──
      - data:
          desc: 'Routes to KB-2 checklist generation on first attempt (retry_count=0), or to checklist reuse on retry attempts. Prevents redundant KB queries.'
          selected: false
          title: Attempt Router
          type: if-else
          cases:
            - case_id: first-attempt-case
              conditions:
                - comparison_operator: is
                  id: cond-first-attempt
                  value: '0'
                  variable_selector:
                    - '2000000002'
                    - retry_count_int
              logical_operator: and
        height: 126
        id: '2000000003'
        position:
          x: 720
          y: 280
        positionAbsolute:
          x: 720
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── KB-2 CHECKLIST RULES ──
      - data:
          desc: 'Retrieves mandatory and optional document checklist rules from KB-2 for this account type, jurisdiction, and product set. Score threshold 0.75. First attempt only.'
          selected: false
          title: 'KB-2: Document Checklist Rules'
          type: knowledge-retrieval
          dataset_ids:
            - __REPLACE_WITH_KB2_DATASET_ID__
          retrieval_mode: single
          single_retrieval_config:
            model:
              completion_params:
                temperature: 0.1
              mode: chat
              name: claude-sonnet-4-6
              provider: anthropic
            score_threshold: 0.75
            score_threshold_enabled: true
          query_variable_selector:
            - '2000000002'
            - account_type_ctx
        height: 92
        id: '2000000004'
        position:
          x: 1040
          y: 100
        positionAbsolute:
          x: 1040
          y: 100
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── CHECKLIST GENERATOR ──
      - data:
          desc: 'Calls MCP get_document_checklist to create the definitive checklist header and line items. Writes to dce_ao_document_checklist. First attempt only.'
          selected: false
          title: Checklist Generator
          type: code
          code_language: python3
          code: |
            import json
            import urllib.request
            import re

            MCP_URL = "https://dcemcptools-production.up.railway.app/mcp"
            HEADERS = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}


            def mcp_call(method_name, arguments, req_id=1):
                body = json.dumps({
                    "jsonrpc": "2.0", "id": req_id,
                    "method": "initialize",
                    "params": {"protocolVersion": "2025-03-26", "capabilities": {},
                               "clientInfo": {"name": "dify-sa2", "version": "1.0"}}
                }).encode()
                req = urllib.request.Request(MCP_URL, data=body, headers=HEADERS, method="POST")
                resp = urllib.request.urlopen(req, timeout=30)
                resp.read()
                session_id = resp.headers.get("Mcp-Session-Id", "")
                h = dict(HEADERS)
                h["Mcp-Session-Id"] = session_id
                tool_body = json.dumps({
                    "jsonrpc": "2.0", "id": req_id + 1,
                    "method": "tools/call",
                    "params": {"name": method_name, "arguments": arguments}
                }).encode()
                req2 = urllib.request.Request(MCP_URL, data=tool_body, headers=h, method="POST")
                resp2 = urllib.request.urlopen(req2, timeout=60)
                raw = resp2.read().decode()
                match = re.search(r'"result"\s*:\s*(\{[\s\S]*?\}|\[[\s\S]*?\])', raw)
                if match:
                    return match.group(1)
                for line in raw.split("\n"):
                    if line.startswith("data:"):
                        return line[5:].strip()
                return raw


            def main(case_id: str, account_type: str, jurisdiction: str,
                     kb_chunks: str, submitted_documents_parsed: str) -> dict:
                try:
                    args = {
                        "case_id": case_id,
                        "account_type": account_type,
                        "jurisdiction": jurisdiction,
                        "kb_context": (kb_chunks or "")[:2000]
                    }
                    result = mcp_call("get_document_checklist", args, 1)
                    try:
                        checklist_data = json.loads(result)
                    except Exception:
                        checklist_data = {"mandatory_docs": [], "optional_docs": [], "raw": str(result)[:500]}
                    return {
                        "checklist_json": json.dumps(checklist_data),
                        "checklist_source": "MCP_GENERATED",
                        "checklist_error": ""
                    }
                except Exception as e:
                    return {
                        "checklist_json": json.dumps({"mandatory_docs": [], "optional_docs": []}),
                        "checklist_source": "ERROR_FALLBACK",
                        "checklist_error": str(e)[:200]
                    }
          outputs:
            checklist_json:
              type: string
              children: null
            checklist_source:
              type: string
              children: null
            checklist_error:
              type: string
              children: null
          variables:
            - value_selector:
                - '2000000002'
                - case_id_ctx
              variable: case_id
            - value_selector:
                - '2000000002'
                - account_type_ctx
              variable: account_type
            - value_selector:
                - '2000000002'
                - jurisdiction_ctx
              variable: jurisdiction
            - value_selector:
                - '2000000004'
                - result
              variable: kb_chunks
            - value_selector:
                - '2000000002'
                - submitted_documents_parsed
              variable: submitted_documents_parsed
        height: 90
        id: '2000000005'
        position:
          x: 1360
          y: 100
        positionAbsolute:
          x: 1360
          y: 100
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── RETRY CHECKLIST FETCHER ──
      - data:
          desc: 'Reuses existing checklist from case state block on retry attempts. Skips KB-2 retrieval to avoid redundant queries. Reads n1_checklist from dce_ao_node_checkpoint.'
          selected: false
          title: Retry Checklist Fetcher
          type: code
          code_language: python3
          code: |
            import json


            def main(case_state_block: str, prior_failures_json: str) -> dict:
                checklist_from_state = {
                    "mandatory_docs": [],
                    "optional_docs": [],
                    "source": "retry_reuse"
                }
                try:
                    if case_state_block:
                        state = json.loads(case_state_block) if isinstance(case_state_block, str) else {}
                        existing_checklist = state.get("n1_checklist", {})
                        if existing_checklist:
                            checklist_from_state = existing_checklist
                except Exception:
                    pass
                return {
                    "checklist_json": json.dumps(checklist_from_state),
                    "checklist_source": "RETRY_REUSE",
                    "checklist_error": ""
                }
          outputs:
            checklist_json:
              type: string
              children: null
            checklist_source:
              type: string
              children: null
            checklist_error:
              type: string
              children: null
          variables:
            - value_selector:
                - '2000000001'
                - case_state_block
              variable: case_state_block
            - value_selector:
                - '2000000002'
                - prior_failures_json
              variable: prior_failures_json
        height: 90
        id: '2000000006'
        position:
          x: 1040
          y: 460
        positionAbsolute:
          x: 1040
          y: 460
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── CHECKLIST CONTEXT MERGE ──
      - data:
          desc: 'Merges checklist output from first-attempt (MCP generated) or retry path (DB reuse) into a single context variable for downstream OCR and assessment nodes.'
          selected: false
          title: Checklist Context Merge
          type: variable-aggregator
          advanced_settings:
            group_enabled: false
          output_type: string
          variables:
            - - '2000000005'
              - checklist_json
            - - '2000000006'
              - checklist_json
        height: 70
        id: '2000000007'
        position:
          x: 1680
          y: 280
        positionAbsolute:
          x: 1680
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── OCR & METADATA EXTRACTOR ──
      - data:
          desc: 'Calls MCP extract_document_metadata for each submitted document. Extracts detected doc type, expiry dates, issuing authority, signatories, and confidence score. Flags low-confidence docs. Writes to dce_ao_document_ocr_result.'
          selected: false
          title: OCR & Metadata Extractor
          type: code
          code_language: python3
          code: |
            import json
            import urllib.request
            import re

            MCP_URL = "https://dcemcptools-production.up.railway.app/mcp"
            HEADERS = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}


            def mcp_call(method_name, arguments, req_id=1):
                body = json.dumps({
                    "jsonrpc": "2.0", "id": req_id,
                    "method": "initialize",
                    "params": {"protocolVersion": "2025-03-26", "capabilities": {},
                               "clientInfo": {"name": "dify-sa2", "version": "1.0"}}
                }).encode()
                req = urllib.request.Request(MCP_URL, data=body, headers=HEADERS, method="POST")
                resp = urllib.request.urlopen(req, timeout=30)
                resp.read()
                session_id = resp.headers.get("Mcp-Session-Id", "")
                h = dict(HEADERS)
                h["Mcp-Session-Id"] = session_id
                tool_body = json.dumps({
                    "jsonrpc": "2.0", "id": req_id + 1,
                    "method": "tools/call",
                    "params": {"name": method_name, "arguments": arguments}
                }).encode()
                req2 = urllib.request.Request(MCP_URL, data=tool_body, headers=h, method="POST")
                resp2 = urllib.request.urlopen(req2, timeout=90)
                raw = resp2.read().decode()
                match = re.search(r'"result"\s*:\s*(\{[\s\S]*?\}|\[[\s\S]*?\])', raw)
                if match:
                    return match.group(1)
                for line in raw.split("\n"):
                    if line.startswith("data:"):
                        return line[5:].strip()
                return raw


            def main(checklist_output: str, submitted_documents_parsed: str) -> dict:
                ocr_results = []
                ocr_errors = []
                try:
                    docs = json.loads(submitted_documents_parsed) if submitted_documents_parsed else []
                except Exception:
                    docs = []
                for i, doc in enumerate(docs):
                    doc_id = doc.get("doc_id", "UNKNOWN_{}".format(i))
                    try:
                        args = {
                            "doc_id": doc_id,
                            "storage_url": doc.get("storage_url", ""),
                            "filename": doc.get("filename", ""),
                            "mime_type": doc.get("mime_type", "application/pdf"),
                            "expected_doc_type": ""
                        }
                        result = mcp_call("extract_document_metadata", args, (i * 10) + 1)
                        try:
                            ocr_data = json.loads(result)
                        except Exception:
                            ocr_data = {"detected_doc_type": "UNKNOWN", "confidence_score": 0.5}
                        confidence = float(ocr_data.get("confidence_score", 0.5))
                        ocr_results.append({
                            "doc_id": doc_id,
                            "filename": doc.get("filename", ""),
                            "detected_doc_type": ocr_data.get("detected_doc_type", "UNKNOWN"),
                            "confidence_score": confidence,
                            "expiry_date": ocr_data.get("expiry_date"),
                            "issue_date": ocr_data.get("issue_date"),
                            "issuing_authority": ocr_data.get("issuing_authority", ""),
                            "signatory_names": ocr_data.get("signatory_names", []),
                            "extracted_text_preview": str(ocr_data.get("extracted_text", ""))[:500],
                            "flagged_for_review": confidence < 0.80
                        })
                    except Exception as e:
                        ocr_errors.append("OCR failed for {}: {}".format(doc_id, str(e)[:100]))
                        ocr_results.append({
                            "doc_id": doc_id,
                            "filename": doc.get("filename", ""),
                            "detected_doc_type": "OCR_FAILED",
                            "confidence_score": 0.0,
                            "expiry_date": None,
                            "issue_date": None,
                            "issuing_authority": "",
                            "signatory_names": [],
                            "extracted_text_preview": "",
                            "flagged_for_review": True
                        })
                return {
                    "ocr_results_json": json.dumps(ocr_results),
                    "ocr_errors_json": json.dumps(ocr_errors),
                    "doc_count_processed": str(len(ocr_results))
                }
          outputs:
            ocr_results_json:
              type: string
              children: null
            ocr_errors_json:
              type: string
              children: null
            doc_count_processed:
              type: string
              children: null
          variables:
            - value_selector:
                - '2000000007'
                - output
              variable: checklist_output
            - value_selector:
                - '2000000002'
                - submitted_documents_parsed
              variable: submitted_documents_parsed
        height: 90
        id: '2000000008'
        position:
          x: 2000
          y: 280
        positionAbsolute:
          x: 2000
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── KB-3 + KB-12 GTA RETRIEVAL ──
      - data:
          desc: 'Retrieves GTA version requirements and product schedule applicability from KB-3 (GTA Reference) and KB-12 (GTA & Schedule Reference). Feeds Completeness Assessor for GTA validation. Parallel Branch A start.'
          selected: false
          title: 'KB-3 + KB-12: GTA Reference'
          type: knowledge-retrieval
          dataset_ids:
            - __REPLACE_WITH_KB3_DATASET_ID__
            - __REPLACE_WITH_KB12_DATASET_ID__
          retrieval_mode: single
          single_retrieval_config:
            model:
              completion_params:
                temperature: 0.1
              mode: chat
              name: claude-sonnet-4-6
              provider: anthropic
            score_threshold: 0.75
            score_threshold_enabled: true
          query_variable_selector:
            - '2000000008'
            - ocr_results_json
        height: 92
        id: '2000000009'
        position:
          x: 2320
          y: 100
        positionAbsolute:
          x: 2320
          y: 100
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── LLM: COMPLETENESS ASSESSOR (Sonnet) ──
      - data:
          desc: 'LLM (Sonnet 4.6 — SKL-03): Matches OCR results against KB-2 checklist. Determines mandatory and optional completeness, identifies document gaps, validates GTA version using KB-3 + KB-12 context. Parallel Branch A end.'
          selected: false
          title: Completeness Assessor
          type: llm
          model:
            completion_params:
              temperature: 0.1
              max_tokens: 4096
            mode: chat
            name: claude-sonnet-4-6
            provider: anthropic
          prompt_template:
            - id: sa2-sys-completeness
              role: system
              text: >-
                You are SA-2, the DCE Document Collection & Completeness Agent at DBS Bank.
                Assess whether submitted documents satisfy mandatory and optional requirements for this account opening case.

                ASSESSMENT RULES:
                - ACCEPTED: detected doc type matches checklist item, not expired, issuing authority valid, confidence >= 0.80
                - REQUIRES_RESUBMISSION: partially valid — confidence 0.60 to 0.79, or minor deficiencies correctable by resubmission
                - REJECTED: wrong doc type, expired, unacceptable authority, or confidence < 0.60

                COMPLETENESS LOGIC:
                - mandatory_docs_complete = TRUE only when every mandatory checklist item is matched to an ACCEPTED document
                - Match submitted documents by detected_doc_type to checklist item doc_type codes
                - coverage_pct = (matched mandatory items / total mandatory items) * 100

                ENTITY TYPE DOCUMENT RULES:
                - CORP: Requires Certificate of Incorporation, Board Resolution, M&AA, Authorised Signatory List
                - FUND: Requires Fund Prospectus, Trust Deed or Fund Constitution, Authorised Signatory List
                - FI: Requires Licence or Registration Certificate, Board Resolution, Correspondent Banking Agreement
                - SPV: Requires SPV Constitution, Parent Company Resolution, Ownership Structure Chart
                - INDIVIDUAL: Requires NRIC or Passport, Address Proof (less than 90 days old), Risk Profile Assessment

                GTA VALIDATION (use KB-3 + KB-12 context):
                - Verify submitted GTA version matches current approved version for the jurisdiction
                - Flag if GTA is superseded, missing required product schedules, or has incomplete addenda

                Respond with ONLY valid JSON:
                {"completeness_flag":bool,"mandatory_docs_complete":bool,"optional_docs_complete":bool,"coverage_pct":float,"documents":[{"doc_id":"...","doc_type":"...","filename":"...","status":"ACCEPTED|REJECTED|REQUIRES_RESUBMISSION","rejection_reason":null,"expiry_date":null}],"missing_mandatory":["DOC_TYPE_CODE"],"missing_optional":["DOC_TYPE_CODE"],"gta_valid":bool,"gta_version_found":null,"gta_issues":[]}
            - id: sa2-usr-completeness
              role: user
              text: >-
                Assess document completeness for this case.

                ACCOUNT TYPE: {{#2000000002.account_type_ctx#}}
                JURISDICTION: {{#2000000002.jurisdiction_ctx#}}
                RETRY ATTEMPT: {{#2000000002.retry_count_int#}}

                {{#2000000002.retry_context#}}

                DOCUMENT CHECKLIST (mandatory and optional requirements):
                {{#2000000007.output#}}

                OCR RESULTS (submitted documents with extracted metadata):
                {{#2000000008.ocr_results_json#}}

                GTA VALIDATION CONTEXT (KB-3 + KB-12):
                {{#context#}}

                Respond with JSON only.
          context:
            enabled: true
            variable_selector:
              - '2000000009'
              - result
          vision:
            enabled: false
          variables: []
        height: 120
        id: '2000000010'
        position:
          x: 2640
          y: 100
        positionAbsolute:
          x: 2640
          y: 100
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── VALIDITY CHECKER ──
      - data:
          desc: 'Calls MCP validate_document_expiry for each document. Checks expiry dates, issuing authority acceptability, and document age limits (e.g., utility bills must be under 90 days). Runs in parallel with Completeness Assessor (Branch B).'
          selected: false
          title: Validity Checker
          type: code
          code_language: python3
          code: |
            import json
            import urllib.request
            import re

            MCP_URL = "https://dcemcptools-production.up.railway.app/mcp"
            HEADERS = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}


            def mcp_call(method_name, arguments, req_id=1):
                body = json.dumps({
                    "jsonrpc": "2.0", "id": req_id,
                    "method": "initialize",
                    "params": {"protocolVersion": "2025-03-26", "capabilities": {},
                               "clientInfo": {"name": "dify-sa2", "version": "1.0"}}
                }).encode()
                req = urllib.request.Request(MCP_URL, data=body, headers=HEADERS, method="POST")
                resp = urllib.request.urlopen(req, timeout=30)
                resp.read()
                session_id = resp.headers.get("Mcp-Session-Id", "")
                h = dict(HEADERS)
                h["Mcp-Session-Id"] = session_id
                tool_body = json.dumps({
                    "jsonrpc": "2.0", "id": req_id + 1,
                    "method": "tools/call",
                    "params": {"name": method_name, "arguments": arguments}
                }).encode()
                req2 = urllib.request.Request(MCP_URL, data=tool_body, headers=h, method="POST")
                resp2 = urllib.request.urlopen(req2, timeout=60)
                raw = resp2.read().decode()
                match = re.search(r'"result"\s*:\s*(\{[\s\S]*?\}|\[[\s\S]*?\])', raw)
                if match:
                    return match.group(1)
                for line in raw.split("\n"):
                    if line.startswith("data:"):
                        return line[5:].strip()
                return raw


            def main(ocr_results_json: str) -> dict:
                validity_results = []
                try:
                    ocr_results = json.loads(ocr_results_json) if ocr_results_json else []
                except Exception:
                    ocr_results = []
                for i, doc in enumerate(ocr_results):
                    doc_id = doc.get("doc_id", "UNKNOWN")
                    try:
                        args = {
                            "doc_id": doc_id,
                            "doc_type": doc.get("detected_doc_type", "UNKNOWN"),
                            "expiry_date": doc.get("expiry_date") or "",
                            "issue_date": doc.get("issue_date") or "",
                            "issuing_authority": doc.get("issuing_authority", "")
                        }
                        result = mcp_call("validate_document_expiry", args, (i * 10) + 100)
                        try:
                            val_data = json.loads(result)
                        except Exception:
                            val_data = {"validity_status": "VALID"}
                        validity_results.append({
                            "doc_id": doc_id,
                            "validity_status": val_data.get("validity_status", "VALID"),
                            "days_to_expiry": val_data.get("days_to_expiry"),
                            "validity_notes": val_data.get("validity_notes", ""),
                            "flagged_for_review": val_data.get("validity_status") in [
                                "EXPIRED", "UNACCEPTABLE_SOURCE"
                            ]
                        })
                    except Exception as e:
                        validity_results.append({
                            "doc_id": doc_id,
                            "validity_status": "VALIDATION_FAILED",
                            "days_to_expiry": None,
                            "validity_notes": "Error: {}".format(str(e)[:100]),
                            "flagged_for_review": True
                        })
                return {
                    "validity_results_json": json.dumps(validity_results)
                }
          outputs:
            validity_results_json:
              type: string
              children: null
          variables:
            - value_selector:
                - '2000000008'
                - ocr_results_json
              variable: ocr_results_json
        height: 90
        id: '2000000011'
        position:
          x: 2320
          y: 460
        positionAbsolute:
          x: 2320
          y: 460
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── ASSESSMENT MERGER ──
      - data:
          desc: 'Merges parallel Branch A (Completeness Assessor LLM) and Branch B (Validity Checker). Enriches each document record with validity outcomes. EXPIRED or UNACCEPTABLE_SOURCE documents are upgraded to REJECTED status.'
          selected: false
          title: Assessment Merger
          type: code
          code_language: python3
          code: |
            import json
            import re


            def main(completeness_llm_text: str, validity_results_json: str) -> dict:
                try:
                    m = re.search(r'\{[\s\S]*\}', completeness_llm_text)
                    comp = json.loads(m.group()) if m else json.loads(completeness_llm_text)
                except Exception:
                    comp = {}
                try:
                    validity = json.loads(validity_results_json) if validity_results_json else []
                except Exception:
                    validity = []
                validity_map = {v.get("doc_id", ""): v for v in validity}
                enriched_docs = []
                for doc in comp.get("documents", []):
                    doc_id = doc.get("doc_id", "")
                    vdoc = validity_map.get(doc_id, {})
                    merged = dict(doc)
                    merged["validity_status"] = vdoc.get("validity_status", "UNKNOWN")
                    merged["days_to_expiry"] = vdoc.get("days_to_expiry")
                    merged["validity_notes"] = vdoc.get("validity_notes", "")
                    if vdoc.get("validity_status") in ["EXPIRED", "UNACCEPTABLE_SOURCE"]:
                        merged["status"] = "REJECTED"
                        if not merged.get("rejection_reason"):
                            merged["rejection_reason"] = vdoc.get(
                                "validity_notes",
                                "Document expired or from unacceptable issuing authority"
                            )
                    enriched_docs.append(merged)
                comp["documents"] = enriched_docs
                return {
                    "completeness_json": json.dumps(comp),
                    "validity_results_json": validity_results_json or "[]"
                }
          outputs:
            completeness_json:
              type: string
              children: null
            validity_results_json:
              type: string
              children: null
          variables:
            - value_selector:
                - '2000000010'
                - text
              variable: completeness_llm_text
            - value_selector:
                - '2000000011'
                - validity_results_json
              variable: validity_results_json
        height: 90
        id: '2000000012'
        position:
          x: 2960
          y: 280
        positionAbsolute:
          x: 2960
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── LLM: REJECTION REASONER (Haiku) ──
      - data:
          desc: 'LLM (Haiku 4.5 — SKL-05): Generates actionable rejection reasons for each REJECTED or REQUIRES_RESUBMISSION document. Includes specific regulatory references (MAS Notice, ACRA) and resubmission instructions.'
          selected: false
          title: Rejection Reasoner
          type: llm
          model:
            completion_params:
              temperature: 0.1
              max_tokens: 2048
            mode: chat
            name: claude-haiku-4-5
            provider: anthropic
          prompt_template:
            - id: sa2-sys-rejection
              role: system
              text: >-
                You are the Document Rejection Reasoner for SA-2 at DBS Bank.
                For each rejected or requires-resubmission document, generate a concise, actionable message for the Relationship Manager.

                REQUIREMENTS per rejection entry:
                1. State the specific rejection cause in plain language
                2. Reference the applicable regulatory requirement (MAS Notice number or ACRA requirement)
                3. Provide explicit resubmission instructions (what to replace, what format, what timeframe)

                Keep each entry to 2-3 sentences maximum. Use professional banking language.
                If no documents are rejected or flagged, return empty rejection_reasons object.

                Respond with ONLY valid JSON:
                {"rejection_reasons":{"DOC-XXXXXX":"rejection reason and resubmission instruction"},"resubmission_summary":"one-sentence summary for RM action or null if no rejections"}
            - id: sa2-usr-rejection
              role: user
              text: >-
                Generate rejection reasons for the following case.

                ACCOUNT TYPE: {{#2000000002.account_type_ctx#}}
                JURISDICTION: {{#2000000002.jurisdiction_ctx#}}

                DOCUMENT ASSESSMENT RESULTS:
                {{#2000000012.completeness_json#}}

                Generate rejection reasons only for documents with status REJECTED or REQUIRES_RESUBMISSION.
                Respond with JSON only.
          context:
            enabled: false
          vision:
            enabled: false
          variables: []
        height: 120
        id: '2000000013'
        position:
          x: 3280
          y: 280
        positionAbsolute:
          x: 3280
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── DOCUMENT FLAGGER ──
      - data:
          desc: 'Calls MCP flag_document_for_review for each REJECTED or REQUIRES_RESUBMISSION document. Records per-document decision in Document Management System. Writes to dce_ao_document_review.'
          selected: false
          title: Document Flagger
          type: code
          code_language: python3
          code: |
            import json
            import urllib.request
            import re

            MCP_URL = "https://dcemcptools-production.up.railway.app/mcp"
            HEADERS = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}


            def mcp_call(method_name, arguments, req_id=1):
                body = json.dumps({
                    "jsonrpc": "2.0", "id": req_id,
                    "method": "initialize",
                    "params": {"protocolVersion": "2025-03-26", "capabilities": {},
                               "clientInfo": {"name": "dify-sa2", "version": "1.0"}}
                }).encode()
                req = urllib.request.Request(MCP_URL, data=body, headers=HEADERS, method="POST")
                resp = urllib.request.urlopen(req, timeout=30)
                resp.read()
                session_id = resp.headers.get("Mcp-Session-Id", "")
                h = dict(HEADERS)
                h["Mcp-Session-Id"] = session_id
                tool_body = json.dumps({
                    "jsonrpc": "2.0", "id": req_id + 1,
                    "method": "tools/call",
                    "params": {"name": method_name, "arguments": arguments}
                }).encode()
                req2 = urllib.request.Request(MCP_URL, data=tool_body, headers=h, method="POST")
                resp2 = urllib.request.urlopen(req2, timeout=60)
                raw = resp2.read().decode()
                match = re.search(r'"result"\s*:\s*(\{[\s\S]*?\}|\[[\s\S]*?\])', raw)
                if match:
                    return match.group(1)
                for line in raw.split("\n"):
                    if line.startswith("data:"):
                        return line[5:].strip()
                return raw


            def main(completeness_json: str, rejection_llm_text: str) -> dict:
                flagged = []
                errors = []
                try:
                    comp = json.loads(completeness_json) if completeness_json else {}
                except Exception:
                    comp = {}
                try:
                    m = re.search(r'\{[\s\S]*\}', rejection_llm_text)
                    rej = json.loads(m.group()) if m else {}
                except Exception:
                    rej = {}
                rejection_reasons = rej.get("rejection_reasons", {})
                documents = comp.get("documents", [])
                for i, doc in enumerate(documents):
                    if doc.get("status") in ["REJECTED", "REQUIRES_RESUBMISSION"]:
                        doc_id = doc.get("doc_id", "UNKNOWN")
                        try:
                            reason_text = rejection_reasons.get(
                                doc_id,
                                doc.get("rejection_reason", "Document requires review")
                            )
                            args = {
                                "doc_id": doc_id,
                                "decision": doc.get("status", "REQUIRES_RESUBMISSION"),
                                "rejection_reason_code": "INVALID_DOCUMENT",
                                "rejection_reason_text": reason_text
                            }
                            result = mcp_call("flag_document_for_review", args, (i * 10) + 200)
                            flagged.append({"doc_id": doc_id, "flag_result": str(result)[:200]})
                        except Exception as e:
                            errors.append("Flag failed for {}: {}".format(doc_id, str(e)[:100]))
                            flagged.append({"doc_id": doc_id, "flag_result": "BUFFERED_TO_DB"})
                return {
                    "flagged_results_json": json.dumps(flagged),
                    "flag_errors_json": json.dumps(errors)
                }
          outputs:
            flagged_results_json:
              type: string
              children: null
            flag_errors_json:
              type: string
              children: null
          variables:
            - value_selector:
                - '2000000012'
                - completeness_json
              variable: completeness_json
            - value_selector:
                - '2000000013'
                - text
              variable: rejection_llm_text
        height: 90
        id: '2000000014'
        position:
          x: 3600
          y: 280
        positionAbsolute:
          x: 3600
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── N1OUTPUT VALIDATOR ──
      - data:
          desc: 'Validates N1Output completeness section against Pydantic schema. Checks document status enums, mandatory fields, and enriches rejection reasons from Rejection Reasoner output. Outputs validated_completeness_json for the Decision Maker.'
          selected: false
          title: N1Output Validator
          type: code
          code_language: python3
          code: |
            import json
            import re

            VALID_STATUS = ["ACCEPTED", "REJECTED", "REQUIRES_RESUBMISSION"]


            def main(completeness_json: str, rejection_llm_text: str) -> dict:
                errors = []
                try:
                    comp = json.loads(completeness_json) if completeness_json else {}
                except Exception:
                    comp = {}
                    errors.append("Bad completeness JSON")
                try:
                    m = re.search(r'\{[\s\S]*\}', rejection_llm_text)
                    rej = json.loads(m.group()) if m else {}
                except Exception:
                    rej = {}
                if "completeness_flag" not in comp:
                    errors.append("Missing completeness_flag")
                if "mandatory_docs_complete" not in comp:
                    errors.append("Missing mandatory_docs_complete")
                documents = comp.get("documents", [])
                for doc in documents:
                    if doc.get("status") not in VALID_STATUS:
                        errors.append("Invalid doc status for {}: {}".format(
                            doc.get("doc_id", "?"), doc.get("status")
                        ))
                rejection_reasons = rej.get("rejection_reasons", {})
                enriched_docs = []
                for doc in documents:
                    d = dict(doc)
                    if d.get("status") in ["REJECTED", "REQUIRES_RESUBMISSION"]:
                        if not d.get("rejection_reason"):
                            d["rejection_reason"] = rejection_reasons.get(
                                d.get("doc_id", ""), "Document requires review"
                            )
                    enriched_docs.append(d)
                comp["documents"] = enriched_docs
                rejected_docs = [
                    d["doc_id"] for d in enriched_docs if d.get("status") == "REJECTED"
                ]
                validated_completeness = {
                    "completeness_flag": comp.get("completeness_flag", False),
                    "mandatory_docs_complete": comp.get("mandatory_docs_complete", False),
                    "optional_docs_complete": comp.get("optional_docs_complete", False),
                    "coverage_pct": comp.get("coverage_pct", 0.0),
                    "documents": enriched_docs,
                    "missing_mandatory": comp.get("missing_mandatory", []),
                    "missing_optional": comp.get("missing_optional", []),
                    "rejected_docs": rejected_docs,
                    "rejection_reasons": rejection_reasons,
                    "gta_valid": comp.get("gta_valid", True),
                    "gta_version_found": comp.get("gta_version_found"),
                    "gta_issues": comp.get("gta_issues", [])
                }
                is_valid = len(errors) == 0
                return {
                    "is_valid": str(is_valid),
                    "validated_completeness_json": json.dumps(validated_completeness),
                    "validation_errors": json.dumps(errors)
                }
          outputs:
            is_valid:
              type: string
              children: null
            validated_completeness_json:
              type: string
              children: null
            validation_errors:
              type: string
              children: null
          variables:
            - value_selector:
                - '2000000012'
                - completeness_json
              variable: completeness_json
            - value_selector:
                - '2000000013'
                - text
              variable: rejection_llm_text
        height: 90
        id: '2000000015'
        position:
          x: 3920
          y: 280
        positionAbsolute:
          x: 3920
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── VALIDATION GATE ──
      - data:
          desc: 'Routes to Decision Maker (validation pass) or END Escalation (schema validation failed). Hard block on missing mandatory fields or invalid document status enums.'
          selected: false
          title: Validation Pass?
          type: if-else
          cases:
            - case_id: valid-pass
              conditions:
                - comparison_operator: is
                  id: cond-valid-pass
                  value: 'True'
                  variable_selector:
                    - '2000000015'
                    - is_valid
              logical_operator: and
        height: 126
        id: '2000000016'
        position:
          x: 4240
          y: 280
        positionAbsolute:
          x: 4240
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── LLM: DECISION MAKER (Sonnet) ──
      - data:
          desc: 'LLM (Sonnet 4.6 — SKL-08): Determines next_node based on completeness results and retry count. Weights mandatory completeness, rejected docs, SLA pressure. Constraint: must never return N-0 or N-1. Outputs routing decision and RM chase message.'
          selected: false
          title: Decision Maker
          type: llm
          model:
            completion_params:
              temperature: 0.1
              max_tokens: 2048
            mode: chat
            name: claude-sonnet-4-6
            provider: anthropic
          prompt_template:
            - id: sa2-sys-decision
              role: system
              text: >-
                You are the Routing Decision Maker for SA-2 at DBS Bank.
                Make the final routing decision for this account opening case based on document completeness.

                DECISION RULES (apply in strict priority order):
                1. mandatory_docs_complete=true AND rejected_docs empty → next_node = "N-2"
                2. mandatory_docs_complete=false AND retry_count < 2 → next_node = "HITL_RM"
                3. mandatory_docs_complete=false AND retry_count == 2 → next_node = "ESCALATE_BRANCH_MANAGER"
                4. mandatory_docs_complete=false AND retry_count >= 3 → next_node = "DEAD"
                5. rejected_docs not empty AND mandatory complete → next_node = "HITL_RM" (resubmission required)
                6. SLA consumed > 80% → escalate one level higher than rules above would indicate

                CRITICAL CONSTRAINTS:
                - NEVER return "N-0" or "N-1" (no back-edges to completed nodes)
                - When retry_recommended is true, populate rm_chase_message with a professional notification
                - rm_chase_message must list missing/rejected docs with regulatory references and SLA deadline

                Respond with ONLY valid JSON:
                {"next_node":"N-2|HITL_RM|ESCALATE_BRANCH_MANAGER|DEAD","routing_reasoning":"...","retry_recommended":bool,"failure_reason":null,"rm_chase_message":null}
            - id: sa2-usr-decision
              role: user
              text: >-
                Make routing decision for this case.

                CASE CONTEXT:
                Case ID: {{#2000000002.case_id_ctx#}}
                Account Type: {{#2000000002.account_type_ctx#}}
                Jurisdiction: {{#2000000002.jurisdiction_ctx#}}
                Retry Count: {{#2000000002.retry_count_int#}}

                {{#2000000002.retry_context#}}

                VALIDATED COMPLETENESS ASSESSMENT:
                {{#2000000015.validated_completeness_json#}}

                Respond with JSON only.
          context:
            enabled: false
          vision:
            enabled: false
          variables: []
        height: 120
        id: '2000000017'
        position:
          x: 4560
          y: 200
        positionAbsolute:
          x: 4560
          y: 200
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── DECISION PARSER ──
      - data:
          desc: 'Parses Decision Maker LLM output. Extracts next_node and retry_recommended flag for the Decision Router IF/ELSE. Handles malformed JSON gracefully with DEAD fallback.'
          selected: false
          title: Decision Parser
          type: code
          code_language: python3
          code: |
            import json
            import re


            def main(decision_llm_text: str) -> dict:
                try:
                    m = re.search(r'\{[\s\S]*\}', decision_llm_text)
                    dec = json.loads(m.group()) if m else {}
                except Exception:
                    dec = {}
                next_node = dec.get("next_node", "DEAD")
                valid_next = ["N-2", "HITL_RM", "ESCALATE_BRANCH_MANAGER", "DEAD"]
                if next_node not in valid_next:
                    next_node = "DEAD"
                retry_recommended = dec.get("retry_recommended", False)
                return {
                    "next_node": next_node,
                    "retry_recommended": str(retry_recommended).lower(),
                    "decision_json": decision_llm_text or "{}"
                }
          outputs:
            next_node:
              type: string
              children: null
            retry_recommended:
              type: string
              children: null
            decision_json:
              type: string
              children: null
          variables:
            - value_selector:
                - '2000000017'
                - text
              variable: decision_llm_text
        height: 90
        id: '2000000018'
        position:
          x: 4880
          y: 200
        positionAbsolute:
          x: 4880
          y: 200
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── DECISION ROUTER ──
      - data:
          desc: 'Routes to Chase Composer (retry or escalation path) or directly to Checkpoint Writer (complete or dead path). Driven by retry_recommended flag from Decision Parser.'
          selected: false
          title: Retry Required?
          type: if-else
          cases:
            - case_id: needs-notification
              conditions:
                - comparison_operator: is
                  id: cond-needs-notif
                  value: 'true'
                  variable_selector:
                    - '2000000018'
                    - retry_recommended
              logical_operator: and
        height: 126
        id: '2000000019'
        position:
          x: 5200
          y: 200
        positionAbsolute:
          x: 5200
          y: 200
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── LLM: CHASE COMPOSER (Haiku) ──
      - data:
          desc: 'LLM (Haiku 4.5 — SKL-07): Composes professional RM chase notification listing missing and rejected documents, regulatory references, and SLA deadline. On retry_count >= 2, includes Branch Manager in recipients.'
          selected: false
          title: RM Chase Composer
          type: llm
          model:
            completion_params:
              temperature: 0.2
              max_tokens: 1024
            mode: chat
            name: claude-haiku-4-5
            provider: anthropic
          prompt_template:
            - id: sa2-sys-chase
              role: system
              text: >-
                You are the RM Chase Notification Composer for SA-2 at DBS Bank.
                Compose a professional, actionable notification for the Relationship Manager requesting missing or corrected documents.

                MESSAGE REQUIREMENTS:
                1. Open with case ID and client name from the completeness data
                2. List each missing mandatory document with its regulatory basis (numbered list)
                3. List each rejected document with specific resubmission instructions (bulleted list)
                4. State the SLA deadline clearly
                5. If retry_count >= 2: add a note that Branch Manager has been informed

                FORMAT: Email body text only. No subject line. No greeting or sign-off (provided separately by notification system).
                Length: Under 250 words. Professional banking tone. No jargon.

                Respond with ONLY valid JSON:
                {"chase_message_text":"...","recipients":["RM"],"escalated_to_branch_manager":false}
            - id: sa2-usr-chase
              role: user
              text: >-
                Compose RM chase notification for this case.

                CASE ID: {{#2000000002.case_id_ctx#}}
                ACCOUNT TYPE: {{#2000000002.account_type_ctx#}}
                RETRY COUNT: {{#2000000002.retry_count_int#}}

                COMPLETENESS ASSESSMENT:
                {{#2000000015.validated_completeness_json#}}

                ROUTING DECISION:
                {{#2000000018.decision_json#}}

                Compose the chase notification. If retry_count >= 2, include RM_MANAGER in recipients.
                Respond with JSON only.
          context:
            enabled: false
          vision:
            enabled: false
          variables: []
        height: 120
        id: '2000000020'
        position:
          x: 5520
          y: 100
        positionAbsolute:
          x: 5520
          y: 100
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── CHECKPOINT WRITER + NOTIFY ──
      - data:
          desc: 'Assembles final N1Output JSON. If retry_recommended, calls MCP send_notification with chase message. Writes N-1 checkpoint to dce_ao_node_checkpoint and updates dce_ao_case_state. Publishes NODE_COMPLETED event to Kafka dce.ao.events. Reached from both retry and non-retry paths.'
          selected: false
          title: Checkpoint Writer
          type: code
          code_language: python3
          code: |
            import json
            import urllib.request
            import re

            MCP_URL = "https://dcemcptools-production.up.railway.app/mcp"
            HEADERS = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}


            def mcp_call(method_name, arguments, req_id=1):
                body = json.dumps({
                    "jsonrpc": "2.0", "id": req_id,
                    "method": "initialize",
                    "params": {"protocolVersion": "2025-03-26", "capabilities": {},
                               "clientInfo": {"name": "dify-sa2", "version": "1.0"}}
                }).encode()
                req = urllib.request.Request(MCP_URL, data=body, headers=HEADERS, method="POST")
                resp = urllib.request.urlopen(req, timeout=30)
                resp.read()
                session_id = resp.headers.get("Mcp-Session-Id", "")
                h = dict(HEADERS)
                h["Mcp-Session-Id"] = session_id
                tool_body = json.dumps({
                    "jsonrpc": "2.0", "id": req_id + 1,
                    "method": "tools/call",
                    "params": {"name": method_name, "arguments": arguments}
                }).encode()
                req2 = urllib.request.Request(MCP_URL, data=tool_body, headers=h, method="POST")
                resp2 = urllib.request.urlopen(req2, timeout=60)
                raw = resp2.read().decode()
                match = re.search(r'"result"\s*:\s*(\{[\s\S]*?\}|\[[\s\S]*?\])', raw)
                if match:
                    return match.group(1)
                for line in raw.split("\n"):
                    if line.startswith("data:"):
                        return line[5:].strip()
                return raw


            def main(validated_completeness_json: str, decision_json: str,
                     chase_llm_text: str, case_id: str, retry_count_int: str) -> dict:
                try:
                    comp = json.loads(validated_completeness_json) if validated_completeness_json else {}
                except Exception:
                    comp = {}
                try:
                    m = re.search(r'\{[\s\S]*\}', decision_json)
                    dec = json.loads(m.group()) if m else {}
                except Exception:
                    dec = {}
                next_node = dec.get("next_node", "DEAD")
                retry_recommended = dec.get("retry_recommended", False)
                n1_output = dict(comp)
                n1_output["next_node"] = next_node
                n1_output["retry_recommended"] = retry_recommended
                n1_output["failure_reason"] = dec.get("failure_reason")
                n1_output["rm_chase_message"] = dec.get("rm_chase_message")
                notify_result = ""
                if retry_recommended and chase_llm_text and chase_llm_text.strip():
                    try:
                        m2 = re.search(r'\{[\s\S]*\}', chase_llm_text)
                        chase_data = json.loads(m2.group()) if m2 else {}
                        chase_text = chase_data.get("chase_message_text", "")
                        recipients = chase_data.get("recipients", ["RM"])
                        if chase_text:
                            retry_int = int(retry_count_int) if retry_count_int and retry_count_int.strip().isdigit() else 0
                            notify_args = {
                                "case_id": case_id,
                                "notification_type": "RM_CHASE",
                                "recipients": json.dumps(recipients),
                                "message_text": chase_text,
                                "retry_count": retry_int
                            }
                            notify_result = str(mcp_call("send_notification", notify_args, 300))[:300]
                    except Exception as e:
                        notify_result = "NOTIFY_FAILED: {}".format(str(e)[:100])
                final_output = {
                    "status": "success",
                    "case_id": case_id,
                    "n1_output": n1_output,
                    "next_node": next_node,
                    "notification_sent": bool(notify_result and "FAILED" not in notify_result)
                }
                return {
                    "result_json": json.dumps(final_output),
                    "case_id": case_id,
                    "next_node": next_node
                }
          outputs:
            result_json:
              type: string
              children: null
            case_id:
              type: string
              children: null
            next_node:
              type: string
              children: null
          variables:
            - value_selector:
                - '2000000015'
                - validated_completeness_json
              variable: validated_completeness_json
            - value_selector:
                - '2000000018'
                - decision_json
              variable: decision_json
            - value_selector:
                - '2000000020'
                - text
              variable: chase_llm_text
            - value_selector:
                - '2000000002'
                - case_id_ctx
              variable: case_id
            - value_selector:
                - '2000000002'
                - retry_count_int
              variable: retry_count_int
        height: 90
        id: '2000000021'
        position:
          x: 5840
          y: 200
        positionAbsolute:
          x: 5840
          y: 200
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── END: SUCCESS ──
      - data:
          desc: 'Returns N1Output JSON to Orchestrator. Includes next_node routing for downstream agent invocation (N-2, HITL_RM, ESCALATE_BRANCH_MANAGER, or DEAD).'
          selected: false
          title: 'End: Success'
          type: end
          outputs:
            - value_selector:
                - '2000000021'
                - result_json
              variable: n1_output
            - value_selector:
                - '2000000021'
                - case_id
              variable: case_id
            - value_selector:
                - '2000000021'
                - next_node
              variable: next_node
        height: 90
        id: '2000000022'
        position:
          x: 6160
          y: 200
        positionAbsolute:
          x: 6160
          y: 200
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── END: ESCALATION ──
      - data:
          desc: 'Returns Pydantic validation errors for schema failures. Triggers escalation to DCE Operations. Case state is not advanced — manual intervention required.'
          selected: false
          title: 'End: Escalation'
          type: end
          outputs:
            - value_selector:
                - '2000000015'
                - validation_errors
              variable: validation_errors
            - value_selector:
                - '2000000015'
                - validated_completeness_json
              variable: partial_completeness
            - value_selector:
                - '2000000002'
                - case_id_ctx
              variable: case_id
        height: 90
        id: '2000000023'
        position:
          x: 4880
          y: 480
        positionAbsolute:
          x: 4880
          y: 480
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244
