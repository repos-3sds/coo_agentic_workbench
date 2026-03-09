Write-Host "Waiting 3 minutes for Render deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 180

Write-Host "Checking health endpoint..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "https://mcp-tools-ppjv.onrender.com/health" -Method GET -TimeoutSec 60
    Write-Host "Health: OK" -ForegroundColor Green
    Write-Host ($health | ConvertTo-Json)
} catch {
    Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Server may still be deploying. Waiting 2 more minutes..."
    Start-Sleep -Seconds 120
    try {
        $health = Invoke-RestMethod -Uri "https://mcp-tools-ppjv.onrender.com/health" -Method GET -TimeoutSec 60
        Write-Host "Health: OK (second attempt)" -ForegroundColor Green
    } catch {
        Write-Host "Still failing: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Re-testing 7 previously failing endpoints ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: session_log_message (should now return graceful error, not 500)
Write-Host "1. session_log_message..." -NoNewline
try {
    $body = @{ session_id = "test-session-001"; role = "agent"; content = "Test" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "https://mcp-tools-ppjv.onrender.com/tools/session_log_message" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    $data = $res.Content | ConvertFrom-Json
    if ($data.success -eq $false -and $data.error -like "*not found*") {
        Write-Host " PASS (graceful error: session not found)" -ForegroundColor Green
    } elseif ($data.success -eq $true) {
        Write-Host " PASS (success)" -ForegroundColor Green
    } else {
        Write-Host " UNEXPECTED: $($res.Content.Substring(0, 200))" -ForegroundColor Yellow
    }
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Write-Host " FAIL (HTTP $code)" -ForegroundColor Red
}

# Test 2: ideation_create_npa
Write-Host "2. ideation_create_npa..." -NoNewline
try {
    $body = @{ title = "Test NPA Deploy Check"; npa_type = "New-to-Group"; risk_level = "MEDIUM" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "https://mcp-tools-ppjv.onrender.com/tools/ideation_create_npa" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    $data = $res.Content | ConvertFrom-Json
    Write-Host " PASS (created: $($data.data.npa_id))" -ForegroundColor Green
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Write-Host " FAIL (HTTP $code)" -ForegroundColor Red
}

# Test 3: ideation_save_concept
Write-Host "3. ideation_save_concept..." -NoNewline
try {
    $body = @{ project_id = "NPA-2026-001"; concept_notes = "Test concept" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "https://mcp-tools-ppjv.onrender.com/tools/ideation_save_concept" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    $data = $res.Content | ConvertFrom-Json
    Write-Host " PASS (saved $($data.data.fields_saved) fields)" -ForegroundColor Green
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Write-Host " FAIL (HTTP $code)" -ForegroundColor Red
}

# Test 4: classify_assess_domains
Write-Host "4. classify_assess_domains..." -NoNewline
try {
    $body = @{
        project_id = "NPA-2026-001"
        assessments = @(
            @{ domain = "STRATEGIC"; status = "PASS"; score = 80 }
            @{ domain = "RISK"; status = "WARN"; score = 55 }
        )
    } | ConvertTo-Json -Depth 3
    $res = Invoke-WebRequest -Uri "https://mcp-tools-ppjv.onrender.com/tools/classify_assess_domains" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    $data = $res.Content | ConvertFrom-Json
    Write-Host " PASS ($($data.data.summary.domains_assessed) domains)" -ForegroundColor Green
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Write-Host " FAIL (HTTP $code)" -ForegroundColor Red
}

# Test 5: risk_run_assessment
Write-Host "5. risk_run_assessment..." -NoNewline
try {
    $body = @{
        project_id = "NPA-2026-001"
        risk_domains = @(
            @{ domain = "CREDIT"; status = "PASS"; score = 85 }
            @{ domain = "MARKET"; level = "HIGH"; score = 40 }
        )
        overall_risk_rating = "MEDIUM"
    } | ConvertTo-Json -Depth 3
    $res = Invoke-WebRequest -Uri "https://mcp-tools-ppjv.onrender.com/tools/risk_run_assessment" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    $data = $res.Content | ConvertFrom-Json
    Write-Host " PASS ($($data.data.domains_assessed) domains)" -ForegroundColor Green
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Write-Host " FAIL (HTTP $code)" -ForegroundColor Red
}

# Test 6: doc_lifecycle_validate
Write-Host "6. doc_lifecycle_validate..." -NoNewline
try {
    $body = @{
        project_id = "NPA-2026-001"
        validations = @(
            @{ document_id = 1; validation_status = "VALID" }
        )
    } | ConvertTo-Json -Depth 3
    $res = Invoke-WebRequest -Uri "https://mcp-tools-ppjv.onrender.com/tools/doc_lifecycle_validate" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    $data = $res.Content | ConvertFrom-Json
    Write-Host " PASS ($($data.data.validations_applied) validations)" -ForegroundColor Green
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Write-Host " FAIL (HTTP $code)" -ForegroundColor Red
}

# Test 7: detect_approximate_booking
Write-Host "7. detect_approximate_booking..." -NoNewline
try {
    $body = @{ project_id = "NPA-2026-002" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "https://mcp-tools-ppjv.onrender.com/tools/detect_approximate_booking" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    $data = $res.Content | ConvertFrom-Json
    Write-Host " PASS (risk: $($data.data.proxy_trade_risk))" -ForegroundColor Green
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Write-Host " FAIL (HTTP $code)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Verification Complete ===" -ForegroundColor Cyan
