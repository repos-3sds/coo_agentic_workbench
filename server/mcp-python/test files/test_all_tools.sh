#!/bin/bash
# Test all 71 MCP tools via the REST API
# Usage:
#   Local:  bash test_all_tools.sh
#   Prod:   bash test_all_tools.sh https://mcp-tools-npa.apps.your-cluster.com
#   Custom: bash test_all_tools.sh http://10.0.1.50:3002

BASE="${1:-http://localhost:3002}/tools"
HEALTH_URL="${1:-http://localhost:3002}/health"
PASS=0
FAIL=0
TOTAL=0

echo "  Target: $BASE"
echo ""

# ─── Connectivity check ──────────────────────────────────────────
echo "--- Preflight: Health Check ---"
HEALTH=$(curl -s --connect-timeout 5 "$HEALTH_URL" 2>/dev/null)
if [ -z "$HEALTH" ]; then
    echo "  FATAL  Cannot reach $HEALTH_URL"
    echo "         Is the server running? Check the URL and try again."
    exit 1
fi
TOOL_COUNT=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_count', '?'))" 2>/dev/null)
echo "  OK     Server reachable — $TOOL_COUNT tools registered"
echo ""

test_tool() {
    local name="$1"
    local data="$2"
    TOTAL=$((TOTAL + 1))
    local resp
    resp=$(curl -s -X POST "$BASE/$name" -H "Content-Type: application/json" -d "$data")
    local success
    success=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)
    if [ "$success" = "True" ]; then
        echo "  PASS  $name"
        PASS=$((PASS + 1))
    else
        echo "  FAIL  $name"
        echo "        Response: $(echo "$resp" | head -c 300)"
        FAIL=$((FAIL + 1))
    fi
}

echo "============================================"
echo "  Testing all 71 MCP Tools (Python port)"
echo "============================================"
echo ""

# ─── Step 0: Create an NPA first (needed by almost everything) ────
echo "--- Setup: Creating test NPA ---"
NPA_ID=$(curl -s -X POST "$BASE/ideation_create_npa" -H "Content-Type: application/json" \
  -d '{"title": "Python Test Derivative", "npa_type": "Variation", "risk_level": "MEDIUM", "submitted_by": "Test-Script"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['npa_id'])" 2>/dev/null)
echo "  Created test NPA: $NPA_ID"
echo ""

# ─── 1. SESSION (2 tools) ─────────────────────────────────────────
echo "--- Session Tools (2) ---"
test_tool "session_create" "{\"agent_id\": \"test-agent\", \"project_id\": \"$NPA_ID\", \"user_id\": \"tester\"}"

SESSION_ID=$(curl -s -X POST "$BASE/session_create" -H "Content-Type: application/json" \
  -d "{\"agent_id\": \"test-agent-2\", \"project_id\": \"$NPA_ID\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['session_id'])" 2>/dev/null)

test_tool "session_log_message" "{\"session_id\": \"$SESSION_ID\", \"role\": \"agent\", \"content\": \"Test message from Python MCP server\", \"agent_confidence\": 95, \"reasoning_chain\": \"Testing all tools\", \"citations\": [\"doc1.pdf\", \"doc2.pdf\"]}"

echo ""

# ─── 2. IDEATION (5 tools) ────────────────────────────────────────
echo "--- Ideation Tools (5) ---"
test_tool "ideation_create_npa" '{"title": "Python Test Bond", "npa_type": "New-to-Group", "risk_level": "HIGH", "product_category": "Fixed Income", "description": "Test NPA from Python port", "is_cross_border": true, "notional_amount": 50000000, "currency": "USD", "submitted_by": "Python-Test"}'

test_tool "ideation_find_similar" '{"search_term": "Python Test", "limit": 5}'
test_tool "ideation_get_prohibited_list" '{}'

test_tool "ideation_save_concept" "{\"project_id\": \"$NPA_ID\", \"concept_notes\": \"Test concept from Python\", \"product_rationale\": \"Testing the port\", \"target_market\": \"Institutional\", \"estimated_revenue\": 1000000}"

test_tool "ideation_list_templates" '{"active_only": true}'

echo ""

# ─── 3. CLASSIFICATION (5 tools) ──────────────────────────────────
echo "--- Classification Tools (5) ---"
test_tool "classify_assess_domains" "{\"project_id\": \"$NPA_ID\", \"assessments\": [{\"domain\": \"STRATEGIC\", \"status\": \"PASS\", \"score\": 85, \"findings\": [\"Aligned with strategy\"]}, {\"domain\": \"RISK\", \"status\": \"WARN\", \"score\": 65, \"findings\": [\"Market risk needs review\"]}, {\"domain\": \"LEGAL\", \"status\": \"PASS\", \"score\": 90}, {\"domain\": \"OPS\", \"status\": \"PASS\", \"score\": 80}, {\"domain\": \"TECH\", \"status\": \"PASS\", \"score\": 75}, {\"domain\": \"DATA\", \"status\": \"PASS\", \"score\": 88}, {\"domain\": \"CLIENT\", \"status\": \"PASS\", \"score\": 92}]}"

test_tool "classify_score_npa" "{\"project_id\": \"$NPA_ID\", \"total_score\": 12, \"calculated_tier\": \"FULL\", \"breakdown\": {\"new_market\": 5, \"regulatory_complexity\": 4, \"tech_change\": 3}}"

test_tool "classify_determine_track" "{\"project_id\": \"$NPA_ID\", \"approval_track\": \"FULL_NPA\", \"reasoning\": \"Score 12/20 with high regulatory complexity requires full NPA review\"}"

test_tool "classify_get_criteria" '{}'
test_tool "classify_get_assessment" "{\"project_id\": \"$NPA_ID\"}"

echo ""

# ─── 4. AUTOFILL (5 tools) ────────────────────────────────────────
echo "--- AutoFill Tools (5) ---"
test_tool "autofill_get_template_fields" '{"template_id": "FULL_NPA_V1"}'

test_tool "autofill_populate_field" "{\"project_id\": \"$NPA_ID\", \"field_key\": \"product_name\", \"value\": \"Python Test Derivative\", \"lineage\": \"AUTO\", \"confidence_score\": 95}"

test_tool "autofill_populate_batch" "{\"project_id\": \"$NPA_ID\", \"fields\": [{\"field_key\": \"booking_entity\", \"value\": \"Test Entity\", \"lineage\": \"AUTO\", \"confidence_score\": 90}, {\"field_key\": \"booking_system\", \"value\": \"Murex\", \"lineage\": \"AUTO\", \"confidence_score\": 88}]}"

test_tool "autofill_get_form_data" "{\"project_id\": \"$NPA_ID\"}"
test_tool "autofill_get_field_options" '{"field_id": "1"}'

echo ""

# ─── 5. RISK (4 tools) ────────────────────────────────────────────
echo "--- Risk Tools (4) ---"
test_tool "risk_run_assessment" "{\"project_id\": \"$NPA_ID\", \"risk_domains\": [{\"domain\": \"CREDIT\", \"status\": \"PASS\", \"score\": 80, \"findings\": [\"Low credit exposure\"]}, {\"domain\": \"MARKET\", \"status\": \"WARN\", \"score\": 60, \"findings\": [\"IR sensitivity high\"]}, {\"domain\": \"OPERATIONAL\", \"status\": \"PASS\", \"score\": 85}], \"overall_risk_rating\": \"MEDIUM\"}"

test_tool "risk_get_market_factors" "{\"project_id\": \"$NPA_ID\"}"

test_tool "risk_add_market_factor" "{\"project_id\": \"$NPA_ID\", \"risk_factor\": \"IR_DELTA\", \"is_applicable\": true, \"sensitivity_report\": true, \"var_capture\": true, \"stress_capture\": false, \"notes\": \"Primary interest rate risk\"}"

test_tool "risk_get_external_parties" "{\"project_id\": \"$NPA_ID\"}"

echo ""

# ─── 6. GOVERNANCE (5 tools) ──────────────────────────────────────
echo "--- Governance Tools (5) ---"
test_tool "governance_create_signoff_matrix" "{\"project_id\": \"$NPA_ID\", \"signoffs\": [{\"party\": \"Credit Risk\", \"department\": \"Risk Management\", \"approver_name\": \"John Smith\", \"approver_email\": \"john@test.com\", \"sla_hours\": 48}, {\"party\": \"Legal\", \"department\": \"Legal & Compliance\", \"approver_name\": \"Jane Doe\", \"sla_hours\": 72}]}"

test_tool "governance_get_signoffs" "{\"project_id\": \"$NPA_ID\"}"

SIGNOFF_ID=$(curl -s -X POST "$BASE/governance_get_signoffs" -H "Content-Type: application/json" \
  -d "{\"project_id\": \"$NPA_ID\"}" \
  | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['data']['signoffs'][0]['id'])" 2>/dev/null)
echo "  (Using signoff ID: $SIGNOFF_ID)"

test_tool "governance_record_decision" "{\"signoff_id\": $SIGNOFF_ID, \"decision\": \"APPROVED\", \"comments\": \"Approved via Python test\"}"

test_tool "governance_check_loopbacks" "{\"project_id\": \"$NPA_ID\"}"

test_tool "governance_advance_stage" "{\"project_id\": \"$NPA_ID\", \"new_stage\": \"CLASSIFICATION\", \"reason\": \"Initiation phase complete - tested via Python\"}"

echo ""

# ─── 7. AUDIT (4 tools) ───────────────────────────────────────────
echo "--- Audit Tools (4) ---"
test_tool "audit_log_action" "{\"project_id\": \"$NPA_ID\", \"actor_name\": \"Python Test Script\", \"actor_role\": \"AI Agent\", \"action_type\": \"NPA_CREATED\", \"action_details\": \"Created test NPA via Python MCP server\", \"is_agent_action\": true, \"agent_name\": \"Test Agent\", \"confidence_score\": 99, \"reasoning\": \"Comprehensive testing of all tools\", \"model_version\": \"test-v1\", \"source_citations\": [\"test.pdf\"]}"

test_tool "audit_get_trail" "{\"project_id\": \"$NPA_ID\", \"limit\": 10}"

test_tool "check_audit_completeness" "{\"project_id\": \"$NPA_ID\"}"

test_tool "generate_audit_report" "{\"project_id\": \"$NPA_ID\", \"include_agent_reasoning\": true}"

echo ""

# ─── 8. NPA DATA (4 tools) ────────────────────────────────────────
echo "--- NPA Data Tools (4) ---"
test_tool "get_npa_by_id" "{\"project_id\": \"$NPA_ID\"}"
test_tool "list_npas" '{"limit": 5}'
test_tool "update_npa_project" "{\"project_id\": \"$NPA_ID\", \"updates\": {\"description\": \"Updated via test script\", \"product_manager\": \"Test PM\"}}"

test_tool "update_npa_predictions" "{\"project_id\": \"$NPA_ID\", \"classification_confidence\": 92.5, \"classification_method\": \"AGENT\", \"predicted_timeline_days\": 45}"

echo ""

# ─── 9. WORKFLOW (5 tools) ────────────────────────────────────────
echo "--- Workflow Tools (5) ---"
test_tool "get_workflow_state" "{\"project_id\": \"$NPA_ID\"}"

test_tool "advance_workflow_state" "{\"project_id\": \"$NPA_ID\", \"new_stage\": \"REVIEW\", \"reason\": \"Classification complete\"}"

test_tool "get_session_history" "{\"project_id\": \"$NPA_ID\"}"

test_tool "log_routing_decision" "{\"session_id\": \"$SESSION_ID\", \"project_id\": \"$NPA_ID\", \"source_agent\": \"classification-agent\", \"target_agent\": \"autofill-agent\", \"routing_reason\": \"Classification complete, proceeding to form fill\", \"confidence\": 92}"

test_tool "get_user_profile" '{"email": "ahmad.razak@dbs.com"}'

echo ""

# ─── 10. MONITORING (6 tools) ─────────────────────────────────────
echo "--- Monitoring Tools (6) ---"
test_tool "get_performance_metrics" "{\"project_id\": \"$NPA_ID\"}"

test_tool "check_breach_thresholds" "{\"project_id\": \"$NPA_ID\"}"

test_tool "create_breach_alert" "{\"project_id\": \"$NPA_ID\", \"title\": \"VaR Utilization Exceeds Warning\", \"severity\": \"WARNING\", \"description\": \"VaR utilization at 82% exceeds 80% warning threshold\", \"threshold_value\": \"80%\", \"actual_value\": \"82%\", \"sla_hours\": 24}"

test_tool "get_monitoring_thresholds" "{\"project_id\": \"$NPA_ID\"}"

test_tool "get_post_launch_conditions" "{\"project_id\": \"$NPA_ID\"}"

# For update_condition_status, we need a condition ID. Use project from seed data if available.
# First try to get one from our test NPA; if none, still test with ID 1
CONDITION_ID=$(curl -s -X POST "$BASE/get_post_launch_conditions" -H "Content-Type: application/json" \
  -d "{\"project_id\": \"$NPA_ID\"}" \
  | python3 -c "import sys,json; data=json.load(sys.stdin); conds=data['data']['conditions']; print(conds[0]['id'] if conds else 1)" 2>/dev/null)

test_tool "update_condition_status" "{\"condition_id\": $CONDITION_ID, \"status\": \"COMPLETED\"}"

echo ""

# ─── 11. DOCUMENTS (4 tools) ──────────────────────────────────────
echo "--- Document Tools (4) ---"
test_tool "upload_document_metadata" "{\"project_id\": \"$NPA_ID\", \"document_name\": \"Test Term Sheet.pdf\", \"document_type\": \"TERM_SHEET\", \"file_size\": \"2.3 MB\", \"file_extension\": \"pdf\", \"uploaded_by\": \"Test Script\", \"criticality\": \"CRITICAL\"}"

test_tool "check_document_completeness" "{\"project_id\": \"$NPA_ID\"}"

test_tool "get_document_requirements" '{"approval_track": "FULL_NPA"}'

# Get a document ID for validation
DOC_ID=$(curl -s -X POST "$BASE/upload_document_metadata" -H "Content-Type: application/json" \
  -d "{\"project_id\": \"$NPA_ID\", \"document_name\": \"Validation Test Doc.pdf\", \"document_type\": \"RISK_MEMO\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['document_id'])" 2>/dev/null)

test_tool "validate_document" "{\"document_id\": $DOC_ID, \"validation_status\": \"VALID\", \"validation_stage\": \"AUTOMATED\", \"validated_by\": \"Test Script\"}"

echo ""

# ─── 12. GOVERNANCE EXT (6 tools) ─────────────────────────────────
echo "--- Governance Extension Tools (6) ---"
test_tool "get_signoff_routing_rules" '{"approval_track": "FULL_NPA"}'

test_tool "check_sla_status" "{\"project_id\": \"$NPA_ID\"}"

test_tool "create_escalation" "{\"project_id\": \"$NPA_ID\", \"escalation_level\": 1, \"trigger_type\": \"SLA_BREACH\", \"reason\": \"Credit Risk signoff SLA breached by 24 hours\", \"escalated_by\": \"Test Agent\"}"

test_tool "get_escalation_rules" '{}'

test_tool "save_approval_decision" "{\"project_id\": \"$NPA_ID\", \"approval_type\": \"CHECKER\", \"decision\": \"APPROVE\", \"comments\": \"All checks passed - approved via test\"}"

test_tool "add_comment" "{\"project_id\": \"$NPA_ID\", \"comment_type\": \"SYSTEM_ALERT\", \"comment_text\": \"All 55 tools tested successfully\", \"author_name\": \"Test Script\", \"generated_by_ai\": true, \"ai_agent\": \"test-agent\"}"

echo ""

# ─── 13. RISK EXT (4 tools) ───────────────────────────────────────
echo "--- Risk Extension Tools (4) ---"
test_tool "get_prerequisite_categories" '{"include_checks": true}'

test_tool "validate_prerequisites" "{\"project_id\": \"$NPA_ID\"}"

test_tool "save_risk_check_result" "{\"project_id\": \"$NPA_ID\", \"check_layer\": \"PROHIBITED_LIST\", \"result\": \"PASS\", \"matched_items\": [], \"checked_by\": \"RISK_AGENT\"}"

test_tool "get_form_field_value" "{\"project_id\": \"$NPA_ID\", \"field_key\": \"product_name\"}"

# ─── 14. KB SEARCH (3 tools) ──────────────────────────────────────
echo "--- KB Search Tools (3) ---"
test_tool "search_kb_documents" '{"search_term": "NPA", "limit": 5}'
test_tool "get_kb_document_by_id" '{"doc_id": "KB-NPA-001"}'
test_tool "list_kb_sources" '{}'

echo ""

# ─── 15. PROSPECTS (2 tools) ─────────────────────────────────────
echo "--- Prospect Tools (2) ---"
test_tool "get_prospects" '{"limit": 5}'
test_tool "convert_prospect_to_npa" '{"prospect_id": 1, "submitted_by": "Test Script", "risk_level": "MEDIUM"}'

echo ""

# ─── 16. DASHBOARD (1 tool) ──────────────────────────────────────
echo "--- Dashboard Tools (1) ---"
test_tool "get_dashboard_kpis" '{"include_live": true}'

echo ""

# ─── 17. NOTIFICATIONS (3 tools) ─────────────────────────────────
echo "--- Notification Tools (3) ---"
test_tool "get_pending_notifications" "{\"project_id\": \"$NPA_ID\", \"limit\": 10}"

test_tool "send_notification" "{\"project_id\": \"$NPA_ID\", \"notification_type\": \"SYSTEM_ALERT\", \"title\": \"Test Notification\", \"message\": \"All 64 tools tested\", \"severity\": \"INFO\"}"

test_tool "mark_notification_read" "{\"project_id\": \"$NPA_ID\", \"notification_type\": \"SYSTEM_ALERT\"}"

echo ""

# ─── 18. JURISDICTION (3 tools) ────────────────────────────────────
echo "--- Jurisdiction Tools (3) ---"
test_tool "get_npa_jurisdictions" "{\"project_id\": \"$NPA_ID\"}"

test_tool "get_jurisdiction_rules" '{"jurisdiction_code": "SG"}'

test_tool "adapt_classification_weights" "{\"project_id\": \"$NPA_ID\", \"base_score\": 10}"

echo ""
echo "============================================"
echo "  Results: $PASS passed, $FAIL failed, $TOTAL total"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
