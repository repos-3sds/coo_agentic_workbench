# Test MCP server REST endpoints directly to check response format
# Comparing working tools (classify) vs failing tools (governance, doc, monitoring, notification)

$base = "https://mcp-tools-ppjv.onrender.com"

Write-Host "=== Testing MCP Server Endpoints Directly ===" -ForegroundColor Cyan
Write-Host ""

# 1. Test OpenAPI spec (should always work)
Write-Host "--- 1. OpenAPI Spec ---" -ForegroundColor Yellow
try {
    $spec = Invoke-RestMethod -Uri "$base/openapi.json" -Method GET -TimeoutSec 30
    Write-Host "Status: OK"
    Write-Host "Paths count: $($spec.paths.PSObject.Properties.Count)"
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
Write-Host ""

# 2. Test a WORKING tool endpoint (classify_get_criteria - used by Classifier which works)
Write-Host "--- 2. classify_get_criteria (WORKING in Dify) ---" -ForegroundColor Yellow
try {
    $body = @{ approval_track = "FULL_NPA" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "$base/tools/classify_get_criteria" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "Status: $($res.StatusCode)"
    Write-Host "Content-Type: $($res.Headers['Content-Type'])"
    Write-Host "Response length: $($res.Content.Length)"
    Write-Host "First 500 chars: $($res.Content.Substring(0, [Math]::Min(500, $res.Content.Length)))"
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
Write-Host ""

# 3. Test a FAILING tool endpoint (governance_get_signoffs)
Write-Host "--- 3. governance_get_signoffs (FAILING in Dify) ---" -ForegroundColor Yellow
try {
    $body = @{ project_id = "NPA-2026-001" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "$base/tools/governance_get_signoffs" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "Status: $($res.StatusCode)"
    Write-Host "Content-Type: $($res.Headers['Content-Type'])"
    Write-Host "Response length: $($res.Content.Length)"
    Write-Host "First 500 chars: $($res.Content.Substring(0, [Math]::Min(500, $res.Content.Length)))"
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
Write-Host ""

# 4. Test another FAILING tool (check_document_completeness)
Write-Host "--- 4. check_document_completeness (FAILING in Dify) ---" -ForegroundColor Yellow
try {
    $body = @{ project_id = "NPA-2026-001" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "$base/tools/check_document_completeness" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "Status: $($res.StatusCode)"
    Write-Host "Content-Type: $($res.Headers['Content-Type'])"
    Write-Host "Response length: $($res.Content.Length)"
    Write-Host "First 500 chars: $($res.Content.Substring(0, [Math]::Min(500, $res.Content.Length)))"
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
Write-Host ""

# 5. Test send_notification (FAILING in Dify)
Write-Host "--- 5. send_notification (FAILING in Dify) ---" -ForegroundColor Yellow
try {
    $body = @{ project_id = "NPA-2026-001"; notification_type = "SLA_BREACH"; severity = "HIGH"; message = "Test" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "$base/tools/send_notification" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "Status: $($res.StatusCode)"
    Write-Host "Content-Type: $($res.Headers['Content-Type'])"
    Write-Host "Response length: $($res.Content.Length)"
    Write-Host "First 500 chars: $($res.Content.Substring(0, [Math]::Min(500, $res.Content.Length)))"
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
Write-Host ""

# 6. Test get_performance_metrics (FAILING in Dify - Monitoring)
Write-Host "--- 6. get_performance_metrics (FAILING in Dify) ---" -ForegroundColor Yellow
try {
    $body = @{ project_id = "NPA-2026-002" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "$base/tools/get_performance_metrics" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "Status: $($res.StatusCode)"
    Write-Host "Content-Type: $($res.Headers['Content-Type'])"
    Write-Host "Response length: $($res.Content.Length)"
    Write-Host "First 500 chars: $($res.Content.Substring(0, [Math]::Min(500, $res.Content.Length)))"
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
Write-Host ""

# 7. Test get_npa_by_id (shared utility tool - used by BOTH working and failing apps)
Write-Host "--- 7. get_npa_by_id (SHARED - used by both working and failing) ---" -ForegroundColor Yellow
try {
    $body = @{ project_id = "NPA-2026-001" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "$base/tools/get_npa_by_id" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "Status: $($res.StatusCode)"
    Write-Host "Content-Type: $($res.Headers['Content-Type'])"
    Write-Host "Response length: $($res.Content.Length)"
    Write-Host "First 500 chars: $($res.Content.Substring(0, [Math]::Min(500, $res.Content.Length)))"
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
Write-Host ""

# 8. Test audit_log_action (shared across failing apps but NOT in working apps)
Write-Host "--- 8. audit_log_action (in failing apps, NOT in working Classifier) ---" -ForegroundColor Yellow
try {
    $body = @{ project_id = "NPA-2026-001"; action = "TEST"; details = "test from script" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "$base/tools/audit_log_action" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    Write-Host "Status: $($res.StatusCode)"
    Write-Host "Content-Type: $($res.Headers['Content-Type'])"
    Write-Host "Response length: $($res.Content.Length)"
    Write-Host "First 500 chars: $($res.Content.Substring(0, [Math]::Min(500, $res.Content.Length)))"
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
