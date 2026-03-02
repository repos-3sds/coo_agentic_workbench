app:
  description: >-
    SA-1 Intake & Triage Agent (Node N-0). Receives raw submissions (EMAIL,
    PORTAL, API), classifies account type and priority, creates case records,
    stages documents, notifies stakeholders, and produces structured N0Output
    for downstream SA-2 Document Collection.
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
    - name: MCP_ENDPOINT
      value: https://dcemcptools-production.up.railway.app
      value_type: string
  features:
    file_upload:
      allowed_file_extensions:
        - .pdf
        - .doc
        - .docx
        - .xls
        - .xlsx
        - .csv
        - .jpg
        - .png
      allowed_file_types:
        - document
        - image
      allowed_file_upload_methods:
        - local_file
        - remote_url
      enabled: true
      number_limits: 10
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
      zoom: 0.7

    # ==================================================================
    #  EDGES — workflow connections
    # ==================================================================
    edges:
      # START → Context Injector
      - data:
          isInIteration: false
          sourceType: start
          targetType: http-request
        id: edge-start-to-ctx
        source: node-start
        sourceHandle: source
        target: node-ctx-injector
        targetHandle: target
        type: custom
        zIndex: 0

      # Context Injector → Source Router
      - data:
          isInIteration: false
          sourceType: http-request
          targetType: if-else
        id: edge-ctx-to-router
        source: node-ctx-injector
        sourceHandle: source
        target: node-source-router
        targetHandle: target
        type: custom
        zIndex: 0

      # Source Router → EMAIL Normaliser
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: code
        id: edge-router-email
        source: node-source-router
        sourceHandle: 'if-condition-email'
        target: node-email-norm
        targetHandle: target
        type: custom
        zIndex: 0

      # Source Router → PORTAL Normaliser
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: code
        id: edge-router-portal
        source: node-source-router
        sourceHandle: 'if-condition-portal'
        target: node-portal-norm
        targetHandle: target
        type: custom
        zIndex: 0

      # Source Router → API Normaliser (else)
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: code
        id: edge-router-api
        source: node-source-router
        sourceHandle: 'false'
        target: node-api-norm
        targetHandle: target
        type: custom
        zIndex: 0

      # EMAIL Normaliser → Variable Aggregator
      - data:
          isInIteration: false
          sourceType: code
          targetType: variable-aggregator
        id: edge-email-to-agg
        source: node-email-norm
        sourceHandle: source
        target: node-intake-agg
        targetHandle: target
        type: custom
        zIndex: 0

      # PORTAL Normaliser → Variable Aggregator
      - data:
          isInIteration: false
          sourceType: code
          targetType: variable-aggregator
        id: edge-portal-to-agg
        source: node-portal-norm
        sourceHandle: source
        target: node-intake-agg
        targetHandle: target
        type: custom
        zIndex: 0

      # API Normaliser → Variable Aggregator
      - data:
          isInIteration: false
          sourceType: code
          targetType: variable-aggregator
        id: edge-api-to-agg
        source: node-api-norm
        sourceHandle: source
        target: node-intake-agg
        targetHandle: target
        type: custom
        zIndex: 0

      # Variable Aggregator → KB-1 Knowledge Retrieval
      - data:
          isInIteration: false
          sourceType: variable-aggregator
          targetType: knowledge-retrieval
        id: edge-agg-to-kb1
        source: node-intake-agg
        sourceHandle: source
        target: node-kb1
        targetHandle: target
        type: custom
        zIndex: 0

      # KB-1 → LLM Classifier (Sonnet)
      - data:
          isInIteration: false
          sourceType: knowledge-retrieval
          targetType: llm
        id: edge-kb1-to-classify
        source: node-kb1
        sourceHandle: source
        target: node-llm-classifier
        targetHandle: target
        type: custom
        zIndex: 0

      # LLM Classifier → Confidence Gate
      - data:
          isInIteration: false
          sourceType: llm
          targetType: code
        id: edge-classify-to-gate
        source: node-llm-classifier
        sourceHandle: source
        target: node-confidence-gate
        targetHandle: target
        type: custom
        zIndex: 0

      # Confidence Gate → KB-9 Knowledge Retrieval
      - data:
          isInIteration: false
          sourceType: code
          targetType: knowledge-retrieval
        id: edge-gate-to-kb9
        source: node-confidence-gate
        sourceHandle: source
        target: node-kb9
        targetHandle: target
        type: custom
        zIndex: 0

      # KB-9 → LLM Priority Assessor (Haiku)
      - data:
          isInIteration: false
          sourceType: knowledge-retrieval
          targetType: llm
        id: edge-kb9-to-priority
        source: node-kb9
        sourceHandle: source
        target: node-llm-priority
        targetHandle: target
        type: custom
        zIndex: 0

      # LLM Priority → Output Validator
      - data:
          isInIteration: false
          sourceType: llm
          targetType: code
        id: edge-priority-to-validate
        source: node-llm-priority
        sourceHandle: source
        target: node-output-validator
        targetHandle: target
        type: custom
        zIndex: 0

      # Output Validator → Validation Check
      - data:
          isInIteration: false
          sourceType: code
          targetType: if-else
        id: edge-validate-to-check
        source: node-output-validator
        sourceHandle: source
        target: node-validation-check
        targetHandle: target
        type: custom
        zIndex: 0

      # Validation YES → Create Case (HTTP MCP)
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: http-request
        id: edge-valid-to-create
        source: node-validation-check
        sourceHandle: 'true'
        target: node-mcp-create-case
        targetHandle: target
        type: custom
        zIndex: 0

      # Create Case → Stage Documents (HTTP MCP)
      - data:
          isInIteration: false
          sourceType: http-request
          targetType: http-request
        id: edge-create-to-stage
        source: node-mcp-create-case
        sourceHandle: source
        target: node-mcp-stage-docs
        targetHandle: target
        type: custom
        zIndex: 0

      # Stage Documents → Notify Stakeholders (HTTP MCP)
      - data:
          isInIteration: false
          sourceType: http-request
          targetType: http-request
        id: edge-stage-to-notify
        source: node-mcp-stage-docs
        sourceHandle: source
        target: node-mcp-notify
        targetHandle: target
        type: custom
        zIndex: 0

      # Notify → Merge Output
      - data:
          isInIteration: false
          sourceType: http-request
          targetType: code
        id: edge-notify-to-merge
        source: node-mcp-notify
        sourceHandle: source
        target: node-merge-output
        targetHandle: target
        type: custom
        zIndex: 0

      # Merge Output → Complete Node (HTTP MCP)
      - data:
          isInIteration: false
          sourceType: code
          targetType: http-request
        id: edge-merge-to-complete
        source: node-merge-output
        sourceHandle: source
        target: node-mcp-complete
        targetHandle: target
        type: custom
        zIndex: 0

      # Complete Node → End Success
      - data:
          isInIteration: false
          sourceType: http-request
          targetType: end
        id: edge-complete-to-end
        source: node-mcp-complete
        sourceHandle: source
        target: node-end-success
        targetHandle: target
        type: custom
        zIndex: 0

      # Validation NO → Retry Check
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: if-else
        id: edge-valid-fail-to-retry
        source: node-validation-check
        sourceHandle: 'false'
        target: node-retry-check
        targetHandle: target
        type: custom
        zIndex: 0

      # Retry YES → Loop back to KB-1
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: knowledge-retrieval
        id: edge-retry-to-kb1
        source: node-retry-check
        sourceHandle: 'true'
        target: node-kb1
        targetHandle: target
        type: custom
        zIndex: 0

      # Retry NO → End Failure
      - data:
          isInIteration: false
          sourceType: if-else
          targetType: end
        id: edge-retry-to-fail
        source: node-retry-check
        sourceHandle: 'false'
        target: node-end-failure
        targetHandle: target
        type: custom
        zIndex: 0

    # ==================================================================
    #  NODES
    # ==================================================================
    nodes:

      # ================================================================
      #  NODE 0: START — Trigger Event
      # ================================================================
      - data:
          desc: >-
            Entry point for SA-1. Accepts submission source, raw payload JSON,
            timestamp, and RM employee ID.
          selected: false
          title: 'Start: Trigger Event'
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
        id: node-start
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

      # ================================================================
      #  NODE 1: Context Injector (MCP: sa1_get_intake_context)
      # ================================================================
      - data:
          desc: >-
            Calls sa1_get_intake_context. For new cases returns empty template +
            ENUM reference. For retries returns full prior context.
          selected: false
          title: 'MCP: Get Intake Context'
          type: http-request
          method: post
          url: '{{#env.MCP_ENDPOINT#}}/mcp'
          headers: 'Content-Type: application/json\nAccept: application/json, text/event-stream'
          body:
            type: json
            data: >-
              {"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"sa1_get_intake_context","arguments":{"case_id":"{{#node-start.case_id#}}","submission_source":"{{#node-start.submission_source#}}"}}}
          authorization:
            type: no-auth
          timeout:
            connect: 10
            read: 60
            write: 10
        height: 120
        id: node-ctx-injector
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

      # ================================================================
      #  NODE 2: Submission Source Router
      # ================================================================
      - data:
          desc: Routes to correct normaliser based on submission_source.
          selected: false
          title: Submission Source Router
          type: if-else
          conditions:
            - id: if-condition-email
              conditions:
                - comparison_operator: is
                  id: cond-email
                  value: EMAIL
                  variable_selector:
                    - node-start
                    - submission_source
              logical_operator: and
            - id: if-condition-portal
              conditions:
                - comparison_operator: is
                  id: cond-portal
                  value: PORTAL
                  variable_selector:
                    - node-start
                    - submission_source
              logical_operator: and
        height: 160
        id: node-source-router
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

      # ================================================================
      #  NODE 3a: Email Payload Normaliser
      # ================================================================
      - data:
          desc: >-
            Extracts email fields from raw_payload_json and maps to common
            intake schema.
          selected: false
          title: Email Payload Normaliser
          type: code
          code_language: python3
          code: |
            import json

            def main(raw_payload_json: str, rm_employee_id: str, received_at: str) -> dict:
                payload = json.loads(raw_payload_json)
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
                - node-start
                - raw_payload_json
              variable: raw_payload_json
            - value_selector:
                - node-start
                - rm_employee_id
              variable: rm_employee_id
            - value_selector:
                - node-start
                - received_at
              variable: received_at
        height: 90
        id: node-email-norm
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

      # ================================================================
      #  NODE 3b: Portal Payload Normaliser
      # ================================================================
      - data:
          desc: >-
            Extracts portal form data from raw_payload_json and maps to common
            intake schema.
          selected: false
          title: Portal Payload Normaliser
          type: code
          code_language: python3
          code: |
            import json

            def main(raw_payload_json: str, rm_employee_id: str, received_at: str) -> dict:
                payload = json.loads(raw_payload_json)
                form_data = payload.get("form_data_json", {})
                return {
                    "normalised_intake": json.dumps({
                        "source": "PORTAL",
                        "portal_form_id": payload.get("portal_form_id", ""),
                        "client_name": form_data.get("client_name", ""),
                        "entity_type": form_data.get("entity_type", ""),
                        "jurisdiction": form_data.get("jurisdiction", ""),
                        "products": form_data.get("products", []),
                        "contact_person": form_data.get("contact_person", ""),
                        "contact_email": form_data.get("contact_email", ""),
                        "uploaded_doc_ids": payload.get("uploaded_doc_ids", []),
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
                - node-start
                - raw_payload_json
              variable: raw_payload_json
            - value_selector:
                - node-start
                - rm_employee_id
              variable: rm_employee_id
            - value_selector:
                - node-start
                - received_at
              variable: received_at
        height: 90
        id: node-portal-norm
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

      # ================================================================
      #  NODE 3c: API Payload Normaliser
      # ================================================================
      - data:
          desc: >-
            Normalises raw API JSON payload to common intake schema.
          selected: false
          title: API Payload Normaliser
          type: code
          code_language: python3
          code: |
            import json

            def main(raw_payload_json: str, rm_employee_id: str, received_at: str) -> dict:
                payload = json.loads(raw_payload_json)
                return {
                    "normalised_intake": json.dumps({
                        "source": "API",
                        "client_name": payload.get("client_name", ""),
                        "entity_type": payload.get("entity_type", ""),
                        "jurisdiction": payload.get("jurisdiction", ""),
                        "products": payload.get("products", []),
                        "lei": payload.get("lei", ""),
                        "fi_type": payload.get("fi_type", ""),
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
                - node-start
                - raw_payload_json
              variable: raw_payload_json
            - value_selector:
                - node-start
                - rm_employee_id
              variable: rm_employee_id
            - value_selector:
                - node-start
                - received_at
              variable: received_at
        height: 90
        id: node-api-norm
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

      # ================================================================
      #  NODE 4: Variable Aggregator — Merge normalised intake
      # ================================================================
      - data:
          desc: Merges normalised_intake output from all 3 source normalisers.
          selected: false
          title: Merge Normalised Intake
          type: variable-aggregator
          advanced_settings:
            group_enabled: false
          output_type: string
          variables:
            - - node-email-norm
              - normalised_intake
            - - node-portal-norm
              - normalised_intake
            - - node-api-norm
              - normalised_intake
        height: 70
        id: node-intake-agg
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

      # ================================================================
      #  NODE 5: KB-1 — Document Taxonomy Knowledge Retrieval
      # ================================================================
      - data:
          desc: >-
            Retrieves account type classification rules from KB-1.
            Query: "Account type classification rules for {products_mentioned}"
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
            - node-intake-agg
            - output
        height: 92
        id: node-kb1
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

      # ================================================================
      #  NODE 6: LLM — Account Type Classifier (Claude Sonnet)
      # ================================================================
      - data:
          desc: >-
            Core cognitive task. Classifies submission into one of 5 account
            types with confidence score. SKL-02.
          selected: false
          title: 'LLM: Account Type Classifier'
          type: llm
          model:
            completion_params:
              temperature: 0.1
              max_tokens: 2048
            mode: chat
            name: claude-sonnet-4-6
            provider: anthropic
          prompt_template:
            - id: sa1-classifier-system
              role: system
              text: >-
                You are SA-1, the DCE Account Opening Intake & Triage Agent at
                DBS Bank. Your task is to classify the incoming submission into
                the correct account type.


                CLASSIFICATION RULES:

                1. INSTITUTIONAL_FUTURES — Corporate/FI entities requesting
                futures/options accounts. Entity type: CORP, FI, FUND.

                2. RETAIL_FUTURES — Individual clients requesting
                futures/options. Entity type: INDIVIDUAL.

                3. OTC_DERIVATIVES — Any entity requesting OTC derivative
                products (swaps, forwards, structured products).

                4. COMMODITIES_PHYSICAL — Physical commodity trading accounts
                (physical delivery, warehousing).

                5. MULTI_PRODUCT — Requests spanning 2+ of the above
                categories where no single category dominates.


                ENTITY TYPES: CORP, FUND, FI, SPV, INDIVIDUAL

                JURISDICTIONS: SGP, HKG, CHN, OTHER


                CONFIDENCE SCORING:

                - 0.90-1.00: Clear match with explicit product mentions

                - 0.80-0.89: Strong inference from context

                - 0.70-0.79: Moderate confidence, may need review

                - Below 0.70: Flag for RM confirmation


                You MUST respond with valid JSON only. No markdown, no
                explanation.


                JSON Schema:

                {
                  "account_type": "INSTITUTIONAL_FUTURES|RETAIL_FUTURES|OTC_DERIVATIVES|COMMODITIES_PHYSICAL|MULTI_PRODUCT",
                  "confidence": 0.0-1.0,
                  "account_type_reasoning": "Brief explanation",
                  "client_name": "Extracted client name",
                  "client_entity_type": "CORP|FUND|FI|SPV|INDIVIDUAL",
                  "jurisdiction": "SGP|HKG|CHN|OTHER",
                  "products_requested": ["FUTURES","OPTIONS","SWAPS",...]
                }
            - id: sa1-classifier-user
              role: user
              text: >-
                Classify the following submission:


                NORMALISED INTAKE:

                {{#node-intake-agg.output#}}


                KNOWLEDGE BASE CONTEXT (KB-1 — Document Taxonomy):

                {{#context#}}


                CONTEXT FROM INTAKE TOOL:

                {{#node-ctx-injector.body#}}


                Respond with JSON only.
          context:
            enabled: true
            variable_selector:
              - node-kb1
              - result
          vision:
            enabled: false
          variables: []
        height: 120
        id: node-llm-classifier
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

      # ================================================================
      #  NODE 7: Confidence Gate
      # ================================================================
      - data:
          desc: >-
            Checks classification confidence. If < 0.70, flags for RM
            confirmation. If < 0.80, sets flagged_for_review = true.
          selected: false
          title: Classification Confidence Gate
          type: code
          code_language: python3
          code: |
            import json

            def main(classification_json: str) -> dict:
                try:
                    classification = json.loads(classification_json)
                except json.JSONDecodeError:
                    # Try to extract JSON from markdown code blocks
                    import re
                    match = re.search(r'\{[\s\S]*\}', classification_json)
                    if match:
                        classification = json.loads(match.group())
                    else:
                        return {
                            "classification_validated": json.dumps({}),
                            "confidence": 0.0,
                            "flagged_for_review": True,
                            "validation_passed": False
                        }

                confidence = float(classification.get("confidence", 0))
                flagged = confidence < 0.80
                blocked = confidence < 0.70

                classification["flagged_for_review"] = flagged

                return {
                    "classification_validated": json.dumps(classification),
                    "confidence": confidence,
                    "flagged_for_review": flagged,
                    "validation_passed": not blocked
                }
          outputs:
            classification_validated:
              type: string
              children: null
            confidence:
              type: number
              children: null
            flagged_for_review:
              type: string
              children: null
            validation_passed:
              type: string
              children: null
          variables:
            - value_selector:
                - node-llm-classifier
                - text
              variable: classification_json
        height: 90
        id: node-confidence-gate
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

      # ================================================================
      #  NODE 8: KB-9 — SLA Policy Knowledge Retrieval
      # ================================================================
      - data:
          desc: >-
            Retrieves SLA policy rules from KB-9 for priority determination.
            Query includes account_type and priority indicators.
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
            - node-confidence-gate
            - classification_validated
        height: 92
        id: node-kb9
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

      # ================================================================
      #  NODE 9: LLM — Priority Assessor (Claude Haiku)
      # ================================================================
      - data:
          desc: >-
            Lightweight cognitive task. Determines URGENT/STANDARD/DEFERRED
            priority and computes SLA deadline. SKL-03.
          selected: false
          title: 'LLM: Priority Assessor'
          type: llm
          model:
            completion_params:
              temperature: 0.1
              max_tokens: 1024
            mode: chat
            name: claude-haiku-4-5
            provider: anthropic
          prompt_template:
            - id: sa1-priority-system
              role: system
              text: >-
                You are the Priority Assessment module of SA-1 at DBS Bank DCE
                Hub. Your task is to determine case priority and SLA deadline.


                PRIORITY RULES:

                - URGENT: Platinum/Diamond client tier, RM-flagged urgency,
                regulatory deadline within 48h, or FI counterparty.

                - STANDARD: Normal processing. Default for most cases.

                - DEFERRED: Low-value accounts, incomplete submissions, or
                explicit RM request to defer.


                SLA WINDOWS:

                - URGENT: 4 hours from submission

                - STANDARD: 2 business days

                - DEFERRED: 5 business days


                You MUST respond with valid JSON only:

                {
                  "priority": "URGENT|STANDARD|DEFERRED",
                  "priority_reason": "Brief justification",
                  "sla_deadline": "ISO datetime"
                }
            - id: sa1-priority-user
              role: user
              text: >-
                Assess priority for this classified submission:


                CLASSIFICATION:

                {{#node-confidence-gate.classification_validated#}}


                SUBMISSION RECEIVED AT:

                {{#node-start.received_at#}}


                SLA POLICY CONTEXT (KB-9):

                {{#context#}}


                Respond with JSON only.
          context:
            enabled: true
            variable_selector:
              - node-kb9
              - result
          vision:
            enabled: false
          variables: []
        height: 120
        id: node-llm-priority
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

      # ================================================================
      #  NODE 10: Output Validator (N0Output Pydantic)
      # ================================================================
      - data:
          desc: >-
            Validates merged classification + priority output against N0Output
            schema. On failure: creates retry instruction block.
          selected: false
          title: 'N0Output Validator'
          type: code
          code_language: python3
          code: |
            import json
            import re

            VALID_ACCOUNT_TYPES = [
                "INSTITUTIONAL_FUTURES", "RETAIL_FUTURES",
                "OTC_DERIVATIVES", "COMMODITIES_PHYSICAL", "MULTI_PRODUCT"
            ]
            VALID_PRIORITIES = ["URGENT", "STANDARD", "DEFERRED"]
            VALID_ENTITY_TYPES = ["CORP", "FUND", "FI", "SPV", "INDIVIDUAL"]
            VALID_JURISDICTIONS = ["SGP", "HKG", "CHN", "OTHER"]

            def main(classification_json: str, priority_json: str, rm_employee_id: str) -> dict:
                errors = []

                # Parse classification
                try:
                    match = re.search(r'\{[\s\S]*\}', classification_json)
                    cls = json.loads(match.group()) if match else json.loads(classification_json)
                except:
                    errors.append("Failed to parse classification JSON")
                    cls = {}

                # Parse priority
                try:
                    match = re.search(r'\{[\s\S]*\}', priority_json)
                    pri = json.loads(match.group()) if match else json.loads(priority_json)
                except:
                    errors.append("Failed to parse priority JSON")
                    pri = {}

                # Validate fields
                if cls.get("account_type") not in VALID_ACCOUNT_TYPES:
                    errors.append(f"Invalid account_type: {cls.get('account_type')}")
                if pri.get("priority") not in VALID_PRIORITIES:
                    errors.append(f"Invalid priority: {pri.get('priority')}")
                if cls.get("client_entity_type") not in VALID_ENTITY_TYPES:
                    errors.append(f"Invalid entity_type: {cls.get('client_entity_type')}")
                if cls.get("jurisdiction") not in VALID_JURISDICTIONS:
                    errors.append(f"Invalid jurisdiction: {cls.get('jurisdiction')}")
                confidence = float(cls.get("confidence", 0))
                if confidence < 0.70 or confidence > 1.0:
                    errors.append(f"Confidence out of range: {confidence}")
                if not cls.get("client_name"):
                    errors.append("Missing client_name")

                is_valid = len(errors) == 0

                # Merge validated output
                merged = {
                    "account_type": cls.get("account_type", ""),
                    "account_type_confidence": confidence,
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
                    "is_valid": is_valid,
                    "validated_output": json.dumps(merged),
                    "validation_errors": json.dumps(errors)
                }
          outputs:
            is_valid:
              type: string
              children: null
            validated_output:
              type: string
              children: null
            validation_errors:
              type: string
              children: null
          variables:
            - value_selector:
                - node-confidence-gate
                - classification_validated
              variable: classification_json
            - value_selector:
                - node-llm-priority
                - text
              variable: priority_json
            - value_selector:
                - node-start
                - rm_employee_id
              variable: rm_employee_id
        height: 90
        id: node-output-validator
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

      # ================================================================
      #  NODE 11: Validation Check (IF/ELSE)
      # ================================================================
      - data:
          desc: Routes to tool execution (pass) or retry/escalation (fail).
          selected: false
          title: 'Validation Pass?'
          type: if-else
          conditions:
            - id: validation-pass-condition
              conditions:
                - comparison_operator: is
                  id: cond-valid-true
                  value: 'True'
                  variable_selector:
                    - node-output-validator
                    - is_valid
              logical_operator: and
        height: 126
        id: node-validation-check
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

      # ================================================================
      #  NODE 12: MCP — sa1_create_case_full
      # ================================================================
      - data:
          desc: >-
            Atomic case creation pipeline. INSERT submission_raw + case_state +
            classification_result + rm_hierarchy + 3 event_log entries. SKL-04.
          selected: false
          title: 'MCP: Create Case Full'
          type: http-request
          method: post
          url: '{{#env.MCP_ENDPOINT#}}/mcp'
          headers: 'Content-Type: application/json\nAccept: application/json, text/event-stream'
          body:
            type: raw-text
            data: >-
              {{#node-create-case-body.result#}}
          authorization:
            type: no-auth
          timeout:
            connect: 10
            read: 60
            write: 10
        height: 120
        id: node-mcp-create-case
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

      # ================================================================
      #  NODE 13: MCP — sa1_stage_documents_batch
      # ================================================================
      - data:
          desc: >-
            Batch-stages all attachments for the case. Returns doc_ids for SA-2
            handoff. SKL-06.
          selected: false
          title: 'MCP: Stage Documents Batch'
          type: http-request
          method: post
          url: '{{#env.MCP_ENDPOINT#}}/mcp'
          headers: 'Content-Type: application/json\nAccept: application/json, text/event-stream'
          body:
            type: json
            data: >-
              {"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"sa1_stage_documents_batch","arguments":{"case_id":"{{#node-mcp-create-case.body#}}","submission_id":0,"documents_json":"[]"}}}
          authorization:
            type: no-auth
          timeout:
            connect: 10
            read: 60
            write: 10
        height: 120
        id: node-mcp-stage-docs
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

      # ================================================================
      #  NODE 14: MCP — sa1_notify_stakeholders
      # ================================================================
      - data:
          desc: >-
            Dispatches all SA-1 intake notifications: RM email, RM Manager
            email, RM toast, Kafka event. SKL-07.
          selected: false
          title: 'MCP: Notify Stakeholders'
          type: http-request
          method: post
          url: '{{#env.MCP_ENDPOINT#}}/mcp'
          headers: 'Content-Type: application/json\nAccept: application/json, text/event-stream'
          body:
            type: json
            data: >-
              {"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"sa1_notify_stakeholders","arguments":{"case_id":"__CASE_ID__","notifications_json":"[]"}}}
          authorization:
            type: no-auth
          timeout:
            connect: 10
            read: 60
            write: 10
        height: 120
        id: node-mcp-notify
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

      # ================================================================
      #  NODE 15: Merge Agent Output + Tool Results
      # ================================================================
      - data:
          desc: >-
            Combines classification, priority, case record, RM, documents,
            notifications into complete N0Output JSON.
          selected: false
          title: Merge Agent Output
          type: code
          code_language: python3
          code: |
            import json
            import re

            def main(validated_output: str, create_response: str, stage_response: str, notify_response: str) -> dict:
                output = json.loads(validated_output)

                # Extract case_id from create response
                case_id = ""
                try:
                    match = re.search(r'AO-\d{4}-\d{6}', create_response)
                    if match:
                        case_id = match.group()
                except:
                    pass

                n0_output = {
                    "case_id": case_id,
                    "account_type": output.get("account_type", ""),
                    "priority": output.get("priority", "STANDARD"),
                    "priority_reason": output.get("priority_reason", ""),
                    "client_name": output.get("client_name", ""),
                    "client_entity_type": output.get("client_entity_type", ""),
                    "jurisdiction": output.get("jurisdiction", ""),
                    "rm_id": output.get("rm_employee_id", ""),
                    "rm_manager_id": "",
                    "products_requested": json.loads(output.get("products_requested", "[]")),
                    "next_node": "N-1",
                    "confidence": output.get("account_type_confidence", 0),
                    "intake_notes": "Processed by SA-1 workflow."
                }

                return {
                    "n0_output_json": json.dumps(n0_output),
                    "case_id": case_id
                }
          outputs:
            n0_output_json:
              type: string
              children: null
            case_id:
              type: string
              children: null
          variables:
            - value_selector:
                - node-output-validator
                - validated_output
              variable: validated_output
            - value_selector:
                - node-mcp-create-case
                - body
              variable: create_response
            - value_selector:
                - node-mcp-stage-docs
                - body
              variable: stage_response
            - value_selector:
                - node-mcp-notify
                - body
              variable: notify_response
        height: 90
        id: node-merge-output
        position:
          x: 4830
          y: 200
        positionAbsolute:
          x: 4830
          y: 200
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ================================================================
      #  NODE 16: MCP — sa1_complete_node (MANDATORY Checkpoint)
      # ================================================================
      - data:
          desc: >-
            MANDATORY checkpoint writer. INSERT node_checkpoint + UPDATE
            case_state (advance to N-1) + INSERT event_log.
          selected: false
          title: 'MCP: Complete Node (Checkpoint)'
          type: http-request
          method: post
          url: '{{#env.MCP_ENDPOINT#}}/mcp'
          headers: 'Content-Type: application/json\nAccept: application/json, text/event-stream'
          body:
            type: json
            data: >-
              {"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"sa1_complete_node","arguments":{"case_id":"{{#node-merge-output.case_id#}}","status":"COMPLETE","attempt_number":1,"output_json":"{{#node-merge-output.n0_output_json#}}","started_at":"{{#node-start.received_at#}}","notifications_sent":true}}}
          authorization:
            type: no-auth
          timeout:
            connect: 10
            read: 60
            write: 10
        height: 120
        id: node-mcp-complete
        position:
          x: 5150
          y: 200
        positionAbsolute:
          x: 5150
          y: 200
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ================================================================
      #  NODE 17: END — Success (Return N0Output)
      # ================================================================
      - data:
          desc: Returns complete N0Output JSON to orchestrator.
          selected: false
          title: 'End: N0Output Success'
          type: end
          outputs:
            - value_selector:
                - node-merge-output
                - n0_output_json
              variable: n0_output
            - value_selector:
                - node-merge-output
                - case_id
              variable: case_id
            - value_selector:
                - node-mcp-complete
                - body
              variable: checkpoint_result
        height: 120
        id: node-end-success
        position:
          x: 5470
          y: 200
        positionAbsolute:
          x: 5470
          y: 200
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ================================================================
      #  NODE 18: Retry Check (IF/ELSE — attempt < 2)
      # ================================================================
      - data:
          desc: Checks if retry is available (max 2 retries for SA-1).
          selected: false
          title: 'Retry Available?'
          type: if-else
          conditions:
            - id: retry-available-condition
              conditions:
                - comparison_operator: is
                  id: cond-retry-true
                  value: 'True'
                  variable_selector:
                    - node-output-validator
                    - is_valid
              logical_operator: and
        height: 126
        id: node-retry-check
        position:
          x: 3870
          y: 480
        positionAbsolute:
          x: 3870
          y: 480
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244

      # ================================================================
      #  NODE 19: END — Failure (Escalation)
      # ================================================================
      - data:
          desc: >-
            Returns failure output with escalation target when validation fails
            after max retries.
          selected: false
          title: 'End: Escalation'
          type: end
          outputs:
            - value_selector:
                - node-output-validator
                - validation_errors
              variable: errors
        height: 90
        id: node-end-failure
        position:
          x: 4190
          y: 540
        positionAbsolute:
          x: 4190
          y: 540
        selected: false
        sourcePosition: right
        targetPosition: left
        type: custom
        width: 244
