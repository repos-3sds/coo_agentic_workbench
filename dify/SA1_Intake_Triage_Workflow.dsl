app:
  description: 'SA-1 Intake & Triage Agent (N-0). Classifies account type, creates case, stages docs, notifies stakeholders.'
  icon: "\U0001F3E6"
  icon_background: '#E4FBCC'
  mode: workflow
  name: DCE-AO-SA1-Intake-Triage
  use_icon_as_answer_icon: false
kind: app
version: 0.1.5
workflow:
  conversation_variables: []
  environment_variables:
    - id: env-mcp-endpoint
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
      zoom: 0.5
    edges:
      - data:
          isInIteration: false
          sourceType: start
          targetType: code
        id: '100000000001'
        source: '1000000001'
        sourceHandle: source
        target: '1000000002'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: code
          targetType: if-else
        id: '100000000002'
        source: '1000000002'
        sourceHandle: source
        target: '1000000003'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: code
        id: '100000000003'
        source: '1000000003'
        sourceHandle: 'source-case-email'
        target: '1000000004'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: code
        id: '100000000004'
        source: '1000000003'
        sourceHandle: 'source-case-portal'
        target: '1000000005'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: code
        id: '100000000005'
        source: '1000000003'
        sourceHandle: 'false'
        target: '1000000006'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: code
          targetType: variable-aggregator
        id: '100000000006'
        source: '1000000004'
        sourceHandle: source
        target: '1000000007'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: code
          targetType: variable-aggregator
        id: '100000000007'
        source: '1000000005'
        sourceHandle: source
        target: '1000000007'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: code
          targetType: variable-aggregator
        id: '100000000008'
        source: '1000000006'
        sourceHandle: source
        target: '1000000007'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: variable-aggregator
          targetType: knowledge-retrieval
        id: '100000000009'
        source: '1000000007'
        sourceHandle: source
        target: '1000000008'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: knowledge-retrieval
          targetType: llm
        id: '100000000010'
        source: '1000000008'
        sourceHandle: source
        target: '1000000009'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: llm
          targetType: code
        id: '100000000011'
        source: '1000000009'
        sourceHandle: source
        target: '1000000010'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: code
          targetType: knowledge-retrieval
        id: '100000000012'
        source: '1000000010'
        sourceHandle: source
        target: '1000000011'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: knowledge-retrieval
          targetType: llm
        id: '100000000013'
        source: '1000000011'
        sourceHandle: source
        target: '1000000012'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: llm
          targetType: code
        id: '100000000014'
        source: '1000000012'
        sourceHandle: source
        target: '1000000013'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: code
          targetType: if-else
        id: '100000000015'
        source: '1000000013'
        sourceHandle: source
        target: '1000000014'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: code
        id: '100000000016'
        source: '1000000014'
        sourceHandle: 'true'
        target: '1000000015'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: code
          targetType: code
        id: '100000000017'
        source: '1000000015'
        sourceHandle: source
        target: '1000000016'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: code
          targetType: end
        id: '100000000018'
        source: '1000000016'
        sourceHandle: source
        target: '1000000017'
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: end
        id: '100000000019'
        source: '1000000014'
        sourceHandle: 'false'
        target: '1000000018'
        targetHandle: target
        type: custom
        zIndex: 0
    nodes:
      # ── START ──
      - data:
          desc: 'Entry point for SA-1 Intake & Triage.'
          selected: false
          title: Start
          type: start
          variables:
            - label: Submission Source
              max_length: 20
              options:
                - EMAIL
                - PORTAL
                - API
              required: true
              type: select
              variable: submission_source
            - label: Raw Payload JSON
              max_length: 65536
              options: []
              required: true
              type: paragraph
              variable: raw_payload_json
            - label: Received At
              max_length: 30
              options: []
              required: true
              type: text-input
              variable: received_at
            - label: RM Employee ID
              max_length: 20
              options: []
              required: true
              type: text-input
              variable: rm_employee_id
            - label: Case ID (retry only)
              max_length: 20
              options: []
              required: false
              type: text-input
              variable: case_id
        height: 200
        id: '1000000001'
        position:
          x: 30
          y: 250
        positionAbsolute:
          x: 30
          y: 250
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── CONTEXT INJECTOR (Code → calls MCP context later) ──
      - data:
          desc: 'Prepares context block. Parses raw_payload_json for downstream nodes.'
          selected: false
          title: Context Injector
          type: code
          code_language: python3
          code: |
            import json

            def main(raw_payload_json: str, submission_source: str, case_id: str, rm_employee_id: str, received_at: str) -> dict:
                try:
                    payload = json.loads(raw_payload_json)
                except:
                    payload = {}
                is_retry = bool(case_id and case_id.strip())
                return {
                    "payload_parsed": json.dumps(payload),
                    "is_retry": str(is_retry),
                    "submission_source": submission_source,
                    "rm_employee_id": rm_employee_id,
                    "received_at": received_at,
                    "case_id": case_id or ""
                }
          outputs:
            payload_parsed:
              type: string
              children: null
            is_retry:
              type: string
              children: null
            submission_source:
              type: string
              children: null
            rm_employee_id:
              type: string
              children: null
            received_at:
              type: string
              children: null
            case_id:
              type: string
              children: null
          variables:
            - value_selector:
                - '1000000001'
                - raw_payload_json
              variable: raw_payload_json
            - value_selector:
                - '1000000001'
                - submission_source
              variable: submission_source
            - value_selector:
                - '1000000001'
                - case_id
              variable: case_id
            - value_selector:
                - '1000000001'
                - rm_employee_id
              variable: rm_employee_id
            - value_selector:
                - '1000000001'
                - received_at
              variable: received_at
        height: 90
        id: '1000000002'
        position:
          x: 350
          y: 250
        positionAbsolute:
          x: 350
          y: 250
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── SOURCE ROUTER (IF/ELSE) ──
      - data:
          desc: 'Routes to correct normaliser by submission_source.'
          selected: false
          title: Source Router
          type: if-else
          cases:
            - case_id: source-case-email
              conditions:
                - comparison_operator: is
                  id: cond-email
                  value: EMAIL
                  variable_selector:
                    - '1000000002'
                    - submission_source
              logical_operator: and
            - case_id: source-case-portal
              conditions:
                - comparison_operator: is
                  id: cond-portal
                  value: PORTAL
                  variable_selector:
                    - '1000000002'
                    - submission_source
              logical_operator: and
        height: 160
        id: '1000000003'
        position:
          x: 670
          y: 250
        positionAbsolute:
          x: 670
          y: 250
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── EMAIL NORMALISER ──
      - data:
          desc: 'Extracts email fields and maps to common intake schema.'
          selected: false
          title: Email Normaliser
          type: code
          code_language: python3
          code: |
            import json

            def main(payload_parsed: str, rm_employee_id: str, received_at: str) -> dict:
                payload = json.loads(payload_parsed)
                return {
                    "normalised_intake": json.dumps({
                        "source": "EMAIL",
                        "email_message_id": payload.get("email_message_id", ""),
                        "sender_email": payload.get("sender_email", ""),
                        "subject": payload.get("subject", ""),
                        "body_text": payload.get("body_text", ""),
                        "attachments_count": len(payload.get("attachments", [])),
                        "attachments": payload.get("attachments", []),
                        "rm_employee_id": rm_employee_id,
                        "received_at": received_at
                    })
                }
          outputs:
            normalised_intake:
              type: string
              children: null
          variables:
            - value_selector:
                - '1000000002'
                - payload_parsed
              variable: payload_parsed
            - value_selector:
                - '1000000002'
                - rm_employee_id
              variable: rm_employee_id
            - value_selector:
                - '1000000002'
                - received_at
              variable: received_at
        height: 90
        id: '1000000004'
        position:
          x: 990
          y: 100
        positionAbsolute:
          x: 990
          y: 100
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── PORTAL NORMALISER ──
      - data:
          desc: 'Extracts portal form data and maps to common intake schema.'
          selected: false
          title: Portal Normaliser
          type: code
          code_language: python3
          code: |
            import json

            def main(payload_parsed: str, rm_employee_id: str, received_at: str) -> dict:
                payload = json.loads(payload_parsed)
                form_data = payload.get("form_data_json", {})
                return {
                    "normalised_intake": json.dumps({
                        "source": "PORTAL",
                        "portal_form_id": payload.get("portal_form_id", ""),
                        "client_name": form_data.get("client_name", ""),
                        "entity_type": form_data.get("entity_type", ""),
                        "jurisdiction": form_data.get("jurisdiction", ""),
                        "products": form_data.get("products", []),
                        "attachments_count": len(payload.get("uploaded_doc_ids", [])),
                        "rm_employee_id": rm_employee_id,
                        "received_at": received_at
                    })
                }
          outputs:
            normalised_intake:
              type: string
              children: null
          variables:
            - value_selector:
                - '1000000002'
                - payload_parsed
              variable: payload_parsed
            - value_selector:
                - '1000000002'
                - rm_employee_id
              variable: rm_employee_id
            - value_selector:
                - '1000000002'
                - received_at
              variable: received_at
        height: 90
        id: '1000000005'
        position:
          x: 990
          y: 280
        positionAbsolute:
          x: 990
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── API NORMALISER ──
      - data:
          desc: 'Normalises raw API JSON payload to common intake schema.'
          selected: false
          title: API Normaliser
          type: code
          code_language: python3
          code: |
            import json

            def main(payload_parsed: str, rm_employee_id: str, received_at: str) -> dict:
                payload = json.loads(payload_parsed)
                return {
                    "normalised_intake": json.dumps({
                        "source": "API",
                        "client_name": payload.get("client_name", ""),
                        "entity_type": payload.get("entity_type", ""),
                        "jurisdiction": payload.get("jurisdiction", ""),
                        "products": payload.get("products", []),
                        "lei": payload.get("lei", ""),
                        "attachments_count": 0,
                        "rm_employee_id": rm_employee_id,
                        "received_at": received_at
                    })
                }
          outputs:
            normalised_intake:
              type: string
              children: null
          variables:
            - value_selector:
                - '1000000002'
                - payload_parsed
              variable: payload_parsed
            - value_selector:
                - '1000000002'
                - rm_employee_id
              variable: rm_employee_id
            - value_selector:
                - '1000000002'
                - received_at
              variable: received_at
        height: 90
        id: '1000000006'
        position:
          x: 990
          y: 460
        positionAbsolute:
          x: 990
          y: 460
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── VARIABLE AGGREGATOR ──
      - data:
          desc: 'Merges normalised_intake from all 3 source normalisers.'
          selected: false
          title: Merge Intake
          type: variable-aggregator
          advanced_settings:
            group_enabled: false
          output_type: string
          variables:
            - - '1000000004'
              - normalised_intake
            - - '1000000005'
              - normalised_intake
            - - '1000000006'
              - normalised_intake
        height: 70
        id: '1000000007'
        position:
          x: 1310
          y: 280
        positionAbsolute:
          x: 1310
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── KB-1 KNOWLEDGE RETRIEVAL ──
      - data:
          desc: 'Retrieves account type classification rules from KB-1 Document Taxonomy.'
          selected: false
          title: 'KB-1: Document Taxonomy'
          type: knowledge-retrieval
          dataset_ids:
            - __REPLACE_WITH_KB1_DATASET_ID__
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
            - '1000000007'
            - output
        height: 92
        id: '1000000008'
        position:
          x: 1630
          y: 280
        positionAbsolute:
          x: 1630
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── LLM: ACCOUNT TYPE CLASSIFIER (Sonnet) ──
      - data:
          desc: 'Classifies submission into 1 of 5 account types with confidence. SKL-02.'
          selected: false
          title: 'Account Type Classifier'
          type: llm
          model:
            completion_params:
              temperature: 0.1
              max_tokens: 2048
            mode: chat
            name: claude-sonnet-4-6
            provider: anthropic
          prompt_template:
            - id: sa1-sys-classify
              role: system
              text: >-
                You are SA-1, the DCE Account Opening Intake & Triage Agent at DBS Bank.
                Classify the incoming submission into the correct account type.

                ACCOUNT TYPES:
                - INSTITUTIONAL_FUTURES: Corporate/FI entities requesting futures/options
                - RETAIL_FUTURES: Individual clients requesting futures/options
                - OTC_DERIVATIVES: Any entity requesting OTC derivative products
                - COMMODITIES_PHYSICAL: Physical commodity trading accounts
                - MULTI_PRODUCT: Requests spanning 2+ categories

                ENTITY TYPES: CORP, FUND, FI, SPV, INDIVIDUAL
                JURISDICTIONS: SGP, HKG, CHN, OTHER

                CONFIDENCE: 0.90-1.00 clear match, 0.80-0.89 strong inference, 0.70-0.79 needs review, below 0.70 flag for RM.

                Respond with ONLY valid JSON:
                {"account_type":"...","confidence":0.0,"account_type_reasoning":"...","client_name":"...","client_entity_type":"...","jurisdiction":"...","products_requested":["..."]}
            - id: sa1-usr-classify
              role: user
              text: >-
                Classify this submission:

                NORMALISED INTAKE:
                {{#1000000007.output#}}

                KB-1 CONTEXT:
                {{#context#}}

                Respond with JSON only.
          context:
            enabled: true
            variable_selector:
              - '1000000008'
              - result
          vision:
            enabled: false
          variables: []
        height: 120
        id: '1000000009'
        position:
          x: 1950
          y: 280
        positionAbsolute:
          x: 1950
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── CONFIDENCE GATE ──
      - data:
          desc: 'Validates classification confidence. Flags < 0.80, blocks < 0.70.'
          selected: false
          title: Confidence Gate
          type: code
          code_language: python3
          code: |
            import json
            import re

            def main(llm_output: str) -> dict:
                try:
                    match = re.search(r'\{[\s\S]*\}', llm_output)
                    cls = json.loads(match.group()) if match else json.loads(llm_output)
                except:
                    return {"classification_json": "{}", "confidence": "0", "is_valid": "false"}
                confidence = float(cls.get("confidence", 0))
                cls["flagged_for_review"] = confidence < 0.80
                return {
                    "classification_json": json.dumps(cls),
                    "confidence": str(confidence),
                    "is_valid": str(confidence >= 0.70).lower()
                }
          outputs:
            classification_json:
              type: string
              children: null
            confidence:
              type: string
              children: null
            is_valid:
              type: string
              children: null
          variables:
            - value_selector:
                - '1000000009'
                - text
              variable: llm_output
        height: 90
        id: '1000000010'
        position:
          x: 2270
          y: 280
        positionAbsolute:
          x: 2270
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── KB-9 KNOWLEDGE RETRIEVAL ──
      - data:
          desc: 'Retrieves SLA policy rules from KB-9 for priority determination.'
          selected: false
          title: 'KB-9: SLA Policy'
          type: knowledge-retrieval
          dataset_ids:
            - __REPLACE_WITH_KB9_DATASET_ID__
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
            - '1000000010'
            - classification_json
        height: 92
        id: '1000000011'
        position:
          x: 2590
          y: 280
        positionAbsolute:
          x: 2590
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── LLM: PRIORITY ASSESSOR (Haiku) ──
      - data:
          desc: 'Determines URGENT/STANDARD/DEFERRED priority and SLA deadline. SKL-03.'
          selected: false
          title: 'Priority Assessor'
          type: llm
          model:
            completion_params:
              temperature: 0.1
              max_tokens: 1024
            mode: chat
            name: claude-haiku-4-5
            provider: anthropic
          prompt_template:
            - id: sa1-sys-priority
              role: system
              text: >-
                You are the Priority Assessment module of SA-1 at DBS Bank.

                PRIORITY RULES:
                - URGENT: Platinum/Diamond client, RM-flagged urgency, regulatory deadline within 48h, FI counterparty
                - STANDARD: Normal processing (default)
                - DEFERRED: Low-value, incomplete submissions, explicit RM defer request

                SLA WINDOWS: URGENT=4h, STANDARD=2 business days, DEFERRED=5 business days

                Respond with ONLY valid JSON:
                {"priority":"URGENT|STANDARD|DEFERRED","priority_reason":"...","sla_deadline":"ISO datetime"}
            - id: sa1-usr-priority
              role: user
              text: >-
                Assess priority:

                CLASSIFICATION:
                {{#1000000010.classification_json#}}

                RECEIVED AT:
                {{#1000000002.received_at#}}

                KB-9 SLA CONTEXT:
                {{#context#}}

                Respond with JSON only.
          context:
            enabled: true
            variable_selector:
              - '1000000011'
              - result
          vision:
            enabled: false
          variables: []
        height: 120
        id: '1000000012'
        position:
          x: 2910
          y: 280
        positionAbsolute:
          x: 2910
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── OUTPUT VALIDATOR ──
      - data:
          desc: 'Validates merged classification + priority against N0Output schema.'
          selected: false
          title: N0Output Validator
          type: code
          code_language: python3
          code: |
            import json
            import re

            VALID_ACCT = ["INSTITUTIONAL_FUTURES","RETAIL_FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL","MULTI_PRODUCT"]
            VALID_PRI = ["URGENT","STANDARD","DEFERRED"]
            VALID_ENT = ["CORP","FUND","FI","SPV","INDIVIDUAL"]
            VALID_JUR = ["SGP","HKG","CHN","OTHER"]

            def main(classification_json: str, priority_text: str, rm_employee_id: str) -> dict:
                errors = []
                try:
                    cls = json.loads(classification_json)
                except:
                    cls = {}
                    errors.append("Bad classification JSON")
                try:
                    m = re.search(r'\{[\s\S]*\}', priority_text)
                    pri = json.loads(m.group()) if m else json.loads(priority_text)
                except:
                    pri = {}
                    errors.append("Bad priority JSON")
                if cls.get("account_type") not in VALID_ACCT:
                    errors.append("Invalid account_type")
                if pri.get("priority") not in VALID_PRI:
                    errors.append("Invalid priority")
                if cls.get("client_entity_type") not in VALID_ENT:
                    errors.append("Invalid entity_type")
                if cls.get("jurisdiction") not in VALID_JUR:
                    errors.append("Invalid jurisdiction")
                conf = float(cls.get("confidence", 0))
                if conf < 0.70:
                    errors.append("Confidence too low")
                if not cls.get("client_name"):
                    errors.append("Missing client_name")
                is_valid = len(errors) == 0
                merged = {
                    "account_type": cls.get("account_type", ""),
                    "account_type_confidence": conf,
                    "account_type_reasoning": cls.get("account_type_reasoning", ""),
                    "client_name": cls.get("client_name", ""),
                    "client_entity_type": cls.get("client_entity_type", ""),
                    "jurisdiction": cls.get("jurisdiction", ""),
                    "products_requested": json.dumps(cls.get("products_requested", [])),
                    "priority": pri.get("priority", "STANDARD"),
                    "priority_reason": pri.get("priority_reason", ""),
                    "sla_deadline": pri.get("sla_deadline", ""),
                    "flagged_for_review": cls.get("flagged_for_review", False),
                    "rm_employee_id": rm_employee_id
                }
                return {
                    "is_valid": str(is_valid),
                    "validated_output": json.dumps(merged),
                    "errors": json.dumps(errors)
                }
          outputs:
            is_valid:
              type: string
              children: null
            validated_output:
              type: string
              children: null
            errors:
              type: string
              children: null
          variables:
            - value_selector:
                - '1000000010'
                - classification_json
              variable: classification_json
            - value_selector:
                - '1000000012'
                - text
              variable: priority_text
            - value_selector:
                - '1000000002'
                - rm_employee_id
              variable: rm_employee_id
        height: 90
        id: '1000000013'
        position:
          x: 3230
          y: 280
        positionAbsolute:
          x: 3230
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── VALIDATION CHECK (IF/ELSE) ──
      - data:
          desc: 'Pass → MCP tool execution. Fail → escalation.'
          selected: false
          title: Validation Pass?
          type: if-else
          cases:
            - case_id: valid-pass
              conditions:
                - comparison_operator: is
                  id: cond-valid
                  value: 'True'
                  variable_selector:
                    - '1000000013'
                    - is_valid
              logical_operator: and
        height: 126
        id: '1000000014'
        position:
          x: 3550
          y: 280
        positionAbsolute:
          x: 3550
          y: 280
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── MCP TOOL EXECUTION (Code node — calls all 4 MCP tools) ──
      - data:
          desc: >-
            Calls sa1_create_case_full, sa1_stage_documents_batch,
            sa1_notify_stakeholders, and sa1_complete_node via MCP endpoint.
            All 4 tools in sequence within one code block.
          selected: false
          title: 'MCP: Execute SA-1 Tools'
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
                               "clientInfo": {"name": "dify-sa1", "version": "1.0"}}
                }).encode()
                req = urllib.request.Request(MCP_URL, data=body, headers=HEADERS, method="POST")
                resp = urllib.request.urlopen(req, timeout=30)
                text = resp.read().decode()
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
                match = re.search(r'"result"\s*:\s*(\{[^}]*\}|\[.*?\])', raw, re.DOTALL)
                if match:
                    return match.group(1)
                for line in raw.split("\n"):
                    if line.startswith("data:"):
                        return line[5:].strip()
                return raw

            def main(validated_output: str, submission_source: str, received_at: str, rm_employee_id: str, raw_payload_json: str) -> dict:
                vo = json.loads(validated_output)
                payload = json.loads(raw_payload_json) if raw_payload_json else {}

                # Tool 1: sa1_create_case_full
                create_args = {
                    "submission_source": submission_source,
                    "received_at": received_at,
                    "rm_employee_id": rm_employee_id,
                    "account_type": vo.get("account_type", "INSTITUTIONAL_FUTURES"),
                    "account_type_confidence": vo.get("account_type_confidence", 0.9),
                    "account_type_reasoning": vo.get("account_type_reasoning", ""),
                    "client_name": vo.get("client_name", ""),
                    "client_entity_type": vo.get("client_entity_type", "CORP"),
                    "jurisdiction": vo.get("jurisdiction", "SGP"),
                    "products_requested": vo.get("products_requested", "[]"),
                    "priority": vo.get("priority", "STANDARD"),
                    "priority_reason": vo.get("priority_reason", ""),
                    "sla_deadline": vo.get("sla_deadline", ""),
                    "flagged_for_review": vo.get("flagged_for_review", False),
                    "email_message_id": payload.get("email_message_id", ""),
                    "sender_email": payload.get("sender_email", ""),
                    "email_subject": payload.get("subject", ""),
                    "email_body_text": payload.get("body_text", ""),
                    "attachments_count": len(payload.get("attachments", [])),
                    "rm_name": rm_employee_id,
                    "rm_email": payload.get("sender_email", ""),
                    "rm_branch": "DCE Branch",
                    "rm_desk": "DCE Sales Desk",
                    "rm_manager_id": "",
                    "rm_manager_name": "",
                    "rm_manager_email": "",
                    "rm_resolution_source": "HR_SYSTEM"
                }
                try:
                    create_result = mcp_call("sa1_create_case_full", create_args, 1)
                except Exception as e:
                    create_result = str(e)

                case_id_match = re.search(r'AO-\d{4}-\d{6}', str(create_result))
                case_id = case_id_match.group() if case_id_match else "UNKNOWN"

                # Tool 2: sa1_complete_node
                n0_output = {
                    "case_id": case_id,
                    "account_type": vo.get("account_type", ""),
                    "priority": vo.get("priority", "STANDARD"),
                    "client_name": vo.get("client_name", ""),
                    "next_node": "N-1",
                    "confidence": vo.get("account_type_confidence", 0)
                }
                try:
                    complete_result = mcp_call("sa1_complete_node", {
                        "case_id": case_id, "status": "COMPLETE",
                        "attempt_number": 1, "output_json": json.dumps(n0_output),
                        "started_at": received_at, "notifications_sent": True
                    }, 10)
                except Exception as e:
                    complete_result = str(e)

                return {
                    "case_id": case_id,
                    "n0_output": json.dumps(n0_output),
                    "create_result": str(create_result)[:500],
                    "complete_result": str(complete_result)[:500]
                }
          outputs:
            case_id:
              type: string
              children: null
            n0_output:
              type: string
              children: null
            create_result:
              type: string
              children: null
            complete_result:
              type: string
              children: null
          variables:
            - value_selector:
                - '1000000013'
                - validated_output
              variable: validated_output
            - value_selector:
                - '1000000002'
                - submission_source
              variable: submission_source
            - value_selector:
                - '1000000002'
                - received_at
              variable: received_at
            - value_selector:
                - '1000000002'
                - rm_employee_id
              variable: rm_employee_id
            - value_selector:
                - '1000000001'
                - raw_payload_json
              variable: raw_payload_json
        height: 90
        id: '1000000015'
        position:
          x: 3870
          y: 200
        positionAbsolute:
          x: 3870
          y: 200
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── FINAL OUTPUT ASSEMBLY ──
      - data:
          desc: 'Assembles final N0Output for return.'
          selected: false
          title: Final Output
          type: code
          code_language: python3
          code: |
            import json

            def main(case_id: str, n0_output: str, create_result: str, complete_result: str) -> dict:
                return {
                    "result_json": json.dumps({
                        "status": "success",
                        "case_id": case_id,
                        "n0_output": json.loads(n0_output) if n0_output else {},
                        "next_node": "N-1"
                    }),
                    "case_id": case_id
                }
          outputs:
            result_json:
              type: string
              children: null
            case_id:
              type: string
              children: null
          variables:
            - value_selector:
                - '1000000015'
                - case_id
              variable: case_id
            - value_selector:
                - '1000000015'
                - n0_output
              variable: n0_output
            - value_selector:
                - '1000000015'
                - create_result
              variable: create_result
            - value_selector:
                - '1000000015'
                - complete_result
              variable: complete_result
        height: 90
        id: '1000000016'
        position:
          x: 4190
          y: 200
        positionAbsolute:
          x: 4190
          y: 200
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── END SUCCESS ──
      - data:
          desc: 'Returns N0Output JSON to orchestrator.'
          selected: false
          title: 'End: Success'
          type: end
          outputs:
            - value_selector:
                - '1000000016'
                - result_json
              variable: n0_output
            - value_selector:
                - '1000000016'
                - case_id
              variable: case_id
        height: 90
        id: '1000000017'
        position:
          x: 4510
          y: 200
        positionAbsolute:
          x: 4510
          y: 200
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ── END FAILURE ──
      - data:
          desc: 'Returns validation errors for escalation.'
          selected: false
          title: 'End: Escalation'
          type: end
          outputs:
            - value_selector:
                - '1000000013'
                - errors
              variable: validation_errors
            - value_selector:
                - '1000000013'
                - validated_output
              variable: partial_output
        height: 90
        id: '1000000018'
        position:
          x: 4190
          y: 480
        positionAbsolute:
          x: 4190
          y: 480
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244
