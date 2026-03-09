# ============================================================
# COMPREHENSIVE MCP TOOL ENDPOINT TESTER
# Tests ALL 78+ endpoints at https://mcp-tools-ppjv.onrender.com
# Created: 2026-02-20
# ============================================================

$base = "https://mcp-tools-ppjv.onrender.com"
$results = @()
$passed = 0
$failed = 0
$errors = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Path,
        [hashtable]$Body = @{},
        [string]$Category
    )

    $bodyJson = $Body | ConvertTo-Json -Depth 5
    try {
        $res = Invoke-WebRequest -Uri "$base$Path" -Method POST -Body $bodyJson -ContentType "application/json" -TimeoutSec 60
        $statusCode = $res.StatusCode
        $contentLen = $res.Content.Length

        # Try parsing JSON
        $parsed = $null
        $jsonValid = $false
        try {
            $parsed = $res.Content | ConvertFrom-Json
            $jsonValid = $true
        } catch {
            $jsonValid = $false
        }

        if ($statusCode -eq 200 -and $jsonValid) {
            Write-Host "  PASS  " -NoNewline -ForegroundColor Black -BackgroundColor Green
            Write-Host " $Name ($contentLen chars)" -ForegroundColor Green
            $script:passed++
            return @{ Name=$Name; Path=$Path; Category=$Category; Status="PASS"; Code=$statusCode; Length=$contentLen; Error="" }
        } else {
            $errMsg = if (-not $jsonValid) { "Invalid JSON response" } else { "Unexpected status" }
            Write-Host "  FAIL  " -NoNewline -ForegroundColor White -BackgroundColor Red
            Write-Host " $Name - $errMsg (HTTP $statusCode, $contentLen chars)" -ForegroundColor Red
            $script:failed++
            $preview = $res.Content.Substring(0, [Math]::Min(200, $res.Content.Length))
            $script:errors += "$Name : $errMsg | Preview: $preview"
            return @{ Name=$Name; Path=$Path; Category=$Category; Status="FAIL"; Code=$statusCode; Length=$contentLen; Error=$errMsg }
        }
    } catch {
        $errMsg = $_.Exception.Message
        # Try to get status code from exception
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        Write-Host "  FAIL  " -NoNewline -ForegroundColor White -BackgroundColor Red
        Write-Host " $Name - HTTP $statusCode : $($errMsg.Substring(0, [Math]::Min(150, $errMsg.Length)))" -ForegroundColor Red
        $script:failed++
        $script:errors += "$Name : HTTP $statusCode - $errMsg"
        return @{ Name=$Name; Path=$Path; Category=$Category; Status="FAIL"; Code=$statusCode; Length=0; Error=$errMsg }
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  MCP TOOL SERVER - COMPREHENSIVE ENDPOINT TEST" -ForegroundColor Cyan
Write-Host "  Server: $base" -ForegroundColor Cyan
Write-Host "  Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ---- 1. SESSION MANAGEMENT (2 tools) ----
Write-Host "=== SESSION MANAGEMENT ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "session_create" -Path "/tools/session_create" -Category "Session" -Body @{
    agent_id = "GOVERNANCE"
    project_id = "NPA-2026-001"
    user_id = "test-user"
}

$results += Test-Endpoint -Name "session_log_message" -Path "/tools/session_log_message" -Category "Session" -Body @{
    session_id = "test-session-001"
    role = "agent"
    content = "Test log message from comprehensive test"
}

Write-Host ""

# ---- 2. IDEATION & PROSPECT (7 tools) ----
Write-Host "=== IDEATION & PROSPECT ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "ideation_create_npa" -Path "/tools/ideation_create_npa" -Category "Ideation" -Body @{
    title = "Test NPA Comprehensive"
    npa_type = "New-to-Group"
    risk_level = "MEDIUM"
    description = "Test from comprehensive endpoint tester"
    product_category = "Derivatives"
}

$results += Test-Endpoint -Name "ideation_find_similar" -Path "/tools/ideation_find_similar" -Category "Ideation" -Body @{
    search_term = "interest rate swap"
    limit = 5
}

$results += Test-Endpoint -Name "ideation_get_prohibited_list" -Path "/tools/ideation_get_prohibited_list" -Category "Ideation" -Body @{}

$results += Test-Endpoint -Name "ideation_save_concept" -Path "/tools/ideation_save_concept" -Category "Ideation" -Body @{
    project_id = "NPA-2026-001"
    concept_notes = "Test concept notes"
}

$results += Test-Endpoint -Name "ideation_list_templates" -Path "/tools/ideation_list_templates" -Category "Ideation" -Body @{}

$results += Test-Endpoint -Name "get_prospects" -Path "/tools/get_prospects" -Category "Ideation" -Body @{
    limit = 5
}

$results += Test-Endpoint -Name "convert_prospect_to_npa" -Path "/tools/convert_prospect_to_npa" -Category "Ideation" -Body @{
    prospect_id = 1
}

Write-Host ""

# ---- 3. CLASSIFICATION & ASSESSMENT (5 tools) ----
Write-Host "=== CLASSIFICATION & ASSESSMENT ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "classify_assess_domains" -Path "/tools/classify_assess_domains" -Category "Classification" -Body @{
    project_id = "NPA-2026-001"
    assessments = @(
        @{ domain = "Market Risk"; status = "APPLICABLE"; score = 3 }
        @{ domain = "Credit Risk"; status = "APPLICABLE"; score = 2 }
    )
}

$results += Test-Endpoint -Name "classify_score_npa" -Path "/tools/classify_score_npa" -Category "Classification" -Body @{
    project_id = "NPA-2026-001"
    total_score = 12
    calculated_tier = "TIER_2"
    breakdown = @{ market_risk = 3; credit_risk = 2; operational = 4; legal = 3 }
}

$results += Test-Endpoint -Name "classify_determine_track" -Path "/tools/classify_determine_track" -Category "Classification" -Body @{
    project_id = "NPA-2026-001"
    approval_track = "FULL_NPA"
    reasoning = "New-to-Group product requires full NPA process"
}

$results += Test-Endpoint -Name "classify_get_criteria" -Path "/tools/classify_get_criteria" -Category "Classification" -Body @{
    category = "Market Risk"
}

$results += Test-Endpoint -Name "classify_get_assessment" -Path "/tools/classify_get_assessment" -Category "Classification" -Body @{
    project_id = "NPA-2026-001"
}

Write-Host ""

# ---- 4. AUTO-FILL (5 tools) ----
Write-Host "=== AUTO-FILL ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "autofill_get_template_fields" -Path "/tools/autofill_get_template_fields" -Category "AutoFill" -Body @{
    template_id = "STD_NPA_V2"
}

$results += Test-Endpoint -Name "autofill_populate_field" -Path "/tools/autofill_populate_field" -Category "AutoFill" -Body @{
    project_id = "NPA-2026-001"
    field_key = "product_name"
    value = "Test Product"
    lineage = "MANUAL"
}

$results += Test-Endpoint -Name "autofill_populate_batch" -Path "/tools/autofill_populate_batch" -Category "AutoFill" -Body @{
    project_id = "NPA-2026-001"
    fields = @(
        @{ field_key = "product_name"; value = "Test Product Batch" }
        @{ field_key = "risk_level"; value = "MEDIUM" }
    )
}

$results += Test-Endpoint -Name "autofill_get_form_data" -Path "/tools/autofill_get_form_data" -Category "AutoFill" -Body @{
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "autofill_get_field_options" -Path "/tools/autofill_get_field_options" -Category "AutoFill" -Body @{
    field_id = "approval_track"
}

Write-Host ""

# ---- 5. RISK MANAGEMENT (8 tools) ----
Write-Host "=== RISK MANAGEMENT ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "risk_run_assessment" -Path "/tools/risk_run_assessment" -Category "Risk" -Body @{
    project_id = "NPA-2026-001"
    risk_domains = @(
        @{ domain = "Market Risk"; level = "HIGH"; notes = "Test" }
    )
    overall_risk_rating = "HIGH"
}

$results += Test-Endpoint -Name "risk_get_market_factors" -Path "/tools/risk_get_market_factors" -Category "Risk" -Body @{
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "risk_add_market_factor" -Path "/tools/risk_add_market_factor" -Category "Risk" -Body @{
    project_id = "NPA-2026-001"
    risk_factor = "Interest Rate Sensitivity"
    is_applicable = $true
    notes = "Test factor"
}

$results += Test-Endpoint -Name "risk_get_external_parties" -Path "/tools/risk_get_external_parties" -Category "Risk" -Body @{
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "get_prerequisite_categories" -Path "/tools/get_prerequisite_categories" -Category "Risk" -Body @{}

$results += Test-Endpoint -Name "validate_prerequisites" -Path "/tools/validate_prerequisites" -Category "Risk" -Body @{
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "save_risk_check_result" -Path "/tools/save_risk_check_result" -Category "Risk" -Body @{
    project_id = "NPA-2026-001"
    check_layer = "PROHIBITED_CHECK"
    result = "CLEAR"
}

$results += Test-Endpoint -Name "get_form_field_value" -Path "/tools/get_form_field_value" -Category "Risk" -Body @{
    project_id = "NPA-2026-001"
    field_key = "product_name"
}

Write-Host ""

# ---- 6. GOVERNANCE & SIGN-OFFS (11 tools) ----
Write-Host "=== GOVERNANCE & SIGN-OFFS ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "governance_get_signoffs" -Path "/tools/governance_get_signoffs" -Category "Governance" -Body @{
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "governance_create_signoff_matrix" -Path "/tools/governance_create_signoff_matrix" -Category "Governance" -Body @{
    project_id = "NPA-2026-001"
    signoffs = @(
        @{ party = "Finance"; department = "Finance"; approver_name = "Test User" }
    )
}

$results += Test-Endpoint -Name "governance_record_decision" -Path "/tools/governance_record_decision" -Category "Governance" -Body @{
    signoff_id = 1
    decision = "APPROVED"
    comments = "Test approval"
}

$results += Test-Endpoint -Name "governance_check_loopbacks" -Path "/tools/governance_check_loopbacks" -Category "Governance" -Body @{
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "governance_advance_stage" -Path "/tools/governance_advance_stage" -Category "Governance" -Body @{
    project_id = "NPA-2026-001"
    new_stage = "SIGN_OFF"
    reason = "Test advancement"
}

$results += Test-Endpoint -Name "get_signoff_routing_rules" -Path "/tools/get_signoff_routing_rules" -Category "Governance" -Body @{
    approval_track = "FULL_NPA"
}

$results += Test-Endpoint -Name "check_sla_status" -Path "/tools/check_sla_status" -Category "Governance" -Body @{
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "create_escalation" -Path "/tools/create_escalation" -Category "Governance" -Body @{
    project_id = "NPA-2026-001"
    escalation_level = 1
    trigger_type = "SLA_BREACH"
    reason = "Test escalation"
}

$results += Test-Endpoint -Name "get_escalation_rules" -Path "/tools/get_escalation_rules" -Category "Governance" -Body @{}

$results += Test-Endpoint -Name "save_approval_decision" -Path "/tools/save_approval_decision" -Category "Governance" -Body @{
    project_id = "NPA-2026-001"
    approval_type = "SOP_SIGNOFF"
    decision = "APPROVED"
    comments = "Test"
}

$results += Test-Endpoint -Name "add_comment" -Path "/tools/add_comment" -Category "Governance" -Body @{
    project_id = "NPA-2026-001"
    comment_type = "GENERAL"
    comment_text = "Test comment from comprehensive tester"
}

Write-Host ""

# ---- 7. AUDIT & COMPLIANCE (4 tools) ----
Write-Host "=== AUDIT & COMPLIANCE ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "audit_log_action" -Path "/tools/audit_log_action" -Category "Audit" -Body @{
    project_id = "NPA-2026-001"
    actor_name = "test-script"
    action_type = "TEST_ACTION"
    action_details = "Comprehensive endpoint test"
}

$results += Test-Endpoint -Name "audit_get_trail" -Path "/tools/audit_get_trail" -Category "Audit" -Body @{
    project_id = "NPA-2026-001"
    limit = 5
}

$results += Test-Endpoint -Name "check_audit_completeness" -Path "/tools/check_audit_completeness" -Category "Audit" -Body @{
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "generate_audit_report" -Path "/tools/generate_audit_report" -Category "Audit" -Body @{
    project_id = "NPA-2026-001"
}

Write-Host ""

# ---- 8. NPA DATA & PROJECT MANAGEMENT (4 tools) ----
Write-Host "=== NPA DATA & PROJECT MANAGEMENT ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "get_npa_by_id" -Path "/tools/get_npa_by_id" -Category "NPA_Data" -Body @{
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "list_npas" -Path "/tools/list_npas" -Category "NPA_Data" -Body @{
    limit = 5
}

$results += Test-Endpoint -Name "update_npa_project" -Path "/tools/update_npa_project" -Category "NPA_Data" -Body @{
    project_id = "NPA-2026-001"
    updates = @{ description = "Updated by comprehensive test" }
}

$results += Test-Endpoint -Name "update_npa_predictions" -Path "/tools/update_npa_predictions" -Category "NPA_Data" -Body @{
    project_id = "NPA-2026-001"
    classification_confidence = 85
    classification_method = "AI_CLASSIFIER"
}

Write-Host ""

# ---- 9. WORKFLOW & ROUTING (5 tools) ----
Write-Host "=== WORKFLOW & ROUTING ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "get_workflow_state" -Path "/tools/get_workflow_state" -Category "Workflow" -Body @{
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "advance_workflow_state" -Path "/tools/advance_workflow_state" -Category "Workflow" -Body @{
    project_id = "NPA-2026-001"
    new_stage = "CLASSIFICATION"
    reason = "Test advancement"
}

$results += Test-Endpoint -Name "get_session_history" -Path "/tools/get_session_history" -Category "Workflow" -Body @{
    project_id = "NPA-2026-001"
    limit = 5
}

$results += Test-Endpoint -Name "log_routing_decision" -Path "/tools/log_routing_decision" -Category "Workflow" -Body @{
    source_agent = "ORCHESTRATOR"
    target_agent = "GOVERNANCE"
    routing_reason = "Test routing"
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "get_user_profile" -Path "/tools/get_user_profile" -Category "Workflow" -Body @{
    user_id = "test-user"
}

Write-Host ""

# ---- 10. DOCUMENT MANAGEMENT (5 tools) ----
Write-Host "=== DOCUMENT MANAGEMENT ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "upload_document_metadata" -Path "/tools/upload_document_metadata" -Category "Documents" -Body @{
    project_id = "NPA-2026-001"
    document_name = "Test Document"
    document_type = "RISK_ASSESSMENT"
}

$results += Test-Endpoint -Name "check_document_completeness" -Path "/tools/check_document_completeness" -Category "Documents" -Body @{
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "get_document_requirements" -Path "/tools/get_document_requirements" -Category "Documents" -Body @{
    approval_track = "FULL_NPA"
}

$results += Test-Endpoint -Name "validate_document" -Path "/tools/validate_document" -Category "Documents" -Body @{
    document_id = 1
    validation_status = "VALID"
}

$results += Test-Endpoint -Name "doc_lifecycle_validate" -Path "/tools/doc_lifecycle_validate" -Category "Documents" -Body @{
    project_id = "NPA-2026-001"
    validations = @(
        @{ document_id = 1; validation_status = "VALID" }
    )
}

Write-Host ""

# ---- 11. KNOWLEDGE BASE (3 tools) ----
Write-Host "=== KNOWLEDGE BASE ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "search_kb_documents" -Path "/tools/search_kb_documents" -Category "KB" -Body @{
    search_term = "NPA approval"
    limit = 5
}

$results += Test-Endpoint -Name "get_kb_document_by_id" -Path "/tools/get_kb_document_by_id" -Category "KB" -Body @{
    doc_id = "KB-001"
}

$results += Test-Endpoint -Name "list_kb_sources" -Path "/tools/list_kb_sources" -Category "KB" -Body @{}

Write-Host ""

# ---- 12. MONITORING & PERFORMANCE (7 tools) ----
Write-Host "=== MONITORING & PERFORMANCE ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "get_performance_metrics" -Path "/tools/get_performance_metrics" -Category "Monitoring" -Body @{
    project_id = "NPA-2026-002"
}

$results += Test-Endpoint -Name "check_breach_thresholds" -Path "/tools/check_breach_thresholds" -Category "Monitoring" -Body @{
    project_id = "NPA-2026-002"
}

$results += Test-Endpoint -Name "create_breach_alert" -Path "/tools/create_breach_alert" -Category "Monitoring" -Body @{
    project_id = "NPA-2026-002"
    title = "Test Breach Alert"
    severity = "HIGH"
    description = "Test from comprehensive tester"
}

$results += Test-Endpoint -Name "get_monitoring_thresholds" -Path "/tools/get_monitoring_thresholds" -Category "Monitoring" -Body @{
    project_id = "NPA-2026-002"
}

$results += Test-Endpoint -Name "get_post_launch_conditions" -Path "/tools/get_post_launch_conditions" -Category "Monitoring" -Body @{
    project_id = "NPA-2026-002"
}

$results += Test-Endpoint -Name "update_condition_status" -Path "/tools/update_condition_status" -Category "Monitoring" -Body @{
    condition_id = 1
    status = "COMPLETED"
}

$results += Test-Endpoint -Name "detect_approximate_booking" -Path "/tools/detect_approximate_booking" -Category "Monitoring" -Body @{
    project_id = "NPA-2026-002"
}

Write-Host ""

# ---- 13. JURISDICTION & LOCALIZATION (3 tools) ----
Write-Host "=== JURISDICTION & LOCALIZATION ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "get_npa_jurisdictions" -Path "/tools/get_npa_jurisdictions" -Category "Jurisdiction" -Body @{
    project_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "get_jurisdiction_rules" -Path "/tools/get_jurisdiction_rules" -Category "Jurisdiction" -Body @{
    jurisdiction_code = "SG"
}

$results += Test-Endpoint -Name "adapt_classification_weights" -Path "/tools/adapt_classification_weights" -Category "Jurisdiction" -Body @{
    project_id = "NPA-2026-001"
    base_score = 12
}

Write-Host ""

# ---- 14. BUNDLING (2 tools) ----
Write-Host "=== BUNDLING ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "bundling_assess" -Path "/tools/bundling_assess" -Category "Bundling" -Body @{
    child_id = "NPA-2026-003"
    parent_id = "NPA-2026-001"
}

$results += Test-Endpoint -Name "bundling_apply" -Path "/tools/bundling_apply" -Category "Bundling" -Body @{
    child_id = "NPA-2026-003"
    parent_id = "NPA-2026-001"
    actor_name = "test-script"
}

Write-Host ""

# ---- 15. EVERGREEN (3 tools) ----
Write-Host "=== EVERGREEN ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "evergreen_list" -Path "/tools/evergreen_list" -Category "Evergreen" -Body @{}

$results += Test-Endpoint -Name "evergreen_record_usage" -Path "/tools/evergreen_record_usage" -Category "Evergreen" -Body @{
    project_id = "NPA-2026-002"
    volume = 5000000
}

$results += Test-Endpoint -Name "evergreen_annual_review" -Path "/tools/evergreen_annual_review" -Category "Evergreen" -Body @{
    project_id = "NPA-2026-002"
    approved = $true
    actor_name = "test-script"
}

Write-Host ""

# ---- 16. DASHBOARD & NOTIFICATIONS (4 tools) ----
Write-Host "=== DASHBOARD & NOTIFICATIONS ===" -ForegroundColor Yellow

$results += Test-Endpoint -Name "get_dashboard_kpis" -Path "/tools/get_dashboard_kpis" -Category "Dashboard" -Body @{}

$results += Test-Endpoint -Name "get_pending_notifications" -Path "/tools/get_pending_notifications" -Category "Notifications" -Body @{
    limit = 5
}

$results += Test-Endpoint -Name "send_notification" -Path "/tools/send_notification" -Category "Notifications" -Body @{
    project_id = "NPA-2026-001"
    notification_type = "SLA_BREACH"
    title = "Test Notification"
    message = "Test from comprehensive tester"
    severity = "HIGH"
}

$results += Test-Endpoint -Name "mark_notification_read" -Path "/tools/mark_notification_read" -Category "Notifications" -Body @{
    project_id = "NPA-2026-001"
    notification_type = "SLA_BREACH"
}

Write-Host ""

# ================================================================
# SUMMARY
# ================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Endpoints Tested: $($results.Count)" -ForegroundColor White
Write-Host "  PASSED: $passed" -ForegroundColor Green
Write-Host "  FAILED: $failed" -ForegroundColor Red
Write-Host "  Pass Rate: $([Math]::Round(($passed / $results.Count) * 100, 1))%" -ForegroundColor $(if ($passed -eq $results.Count) { "Green" } else { "Yellow" })
Write-Host ""

if ($failed -gt 0) {
    Write-Host "--- FAILED ENDPOINTS ---" -ForegroundColor Red
    foreach ($r in ($results | Where-Object { $_.Status -eq "FAIL" })) {
        Write-Host "  [$($r.Category)] $($r.Name) - HTTP $($r.Code)" -ForegroundColor Red
        Write-Host "    $($r.Error.Substring(0, [Math]::Min(200, $r.Error.Length)))" -ForegroundColor DarkRed
    }
    Write-Host ""
}

# Category breakdown
Write-Host "--- RESULTS BY CATEGORY ---" -ForegroundColor Yellow
$categories = $results | Group-Object { $_.Category }
foreach ($cat in $categories | Sort-Object Name) {
    $catPass = ($cat.Group | Where-Object { $_.Status -eq "PASS" }).Count
    $catTotal = $cat.Count
    $color = if ($catPass -eq $catTotal) { "Green" } else { "Red" }
    Write-Host "  $($cat.Name): $catPass/$catTotal" -ForegroundColor $color
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
