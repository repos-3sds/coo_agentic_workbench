# Detailed error analysis for the 7 failing MCP endpoints
# Gets full error response bodies to understand root cause

$base = "https://mcp-tools-ppjv.onrender.com"

function Get-ErrorDetail {
    param([string]$Name, [string]$Path, [hashtable]$Body)

    $bodyJson = $Body | ConvertTo-Json -Depth 5
    Write-Host "=== $Name ===" -ForegroundColor Yellow
    Write-Host "  URL: $base$Path"
    Write-Host "  Body: $bodyJson"
    Write-Host ""

    try {
        $res = Invoke-WebRequest -Uri "$base$Path" -Method POST -Body $bodyJson -ContentType "application/json" -TimeoutSec 60
        Write-Host "  Status: $($res.StatusCode)" -ForegroundColor Green
        Write-Host "  Response: $($res.Content)" -ForegroundColor Green
    } catch {
        $statusCode = 0
        $responseBody = ""
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
        }
        Write-Host "  HTTP Status: $statusCode" -ForegroundColor Red
        Write-Host "  Error Body:" -ForegroundColor Red
        Write-Host "  $responseBody" -ForegroundColor DarkRed
    }
    Write-Host ""
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  DETAILED ERROR ANALYSIS - 7 FAILING ENDPOINTS" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. session_log_message
Get-ErrorDetail -Name "session_log_message" -Path "/tools/session_log_message" -Body @{
    session_id = "test-session-001"
    role = "agent"
    content = "Test log message"
}

# 2. ideation_create_npa
Get-ErrorDetail -Name "ideation_create_npa" -Path "/tools/ideation_create_npa" -Body @{
    title = "Test NPA"
    npa_type = "New-to-Group"
    risk_level = "MEDIUM"
}

# 3. ideation_save_concept
Get-ErrorDetail -Name "ideation_save_concept" -Path "/tools/ideation_save_concept" -Body @{
    project_id = "NPA-2026-001"
    concept_notes = "Test concept"
}

# 4. classify_assess_domains
Get-ErrorDetail -Name "classify_assess_domains" -Path "/tools/classify_assess_domains" -Body @{
    project_id = "NPA-2026-001"
    assessments = @(
        @{ domain = "Market Risk"; status = "APPLICABLE"; score = 3 }
    )
}

# 5. risk_run_assessment
Get-ErrorDetail -Name "risk_run_assessment" -Path "/tools/risk_run_assessment" -Body @{
    project_id = "NPA-2026-001"
    risk_domains = @(
        @{ domain = "Market Risk"; level = "HIGH"; notes = "Test" }
    )
    overall_risk_rating = "HIGH"
}

# 6. doc_lifecycle_validate
Get-ErrorDetail -Name "doc_lifecycle_validate" -Path "/tools/doc_lifecycle_validate" -Body @{
    project_id = "NPA-2026-001"
    validations = @(
        @{ document_id = 1; validation_status = "VALID" }
    )
}

# 7. detect_approximate_booking
Get-ErrorDetail -Name "detect_approximate_booking" -Path "/tools/detect_approximate_booking" -Body @{
    project_id = "NPA-2026-002"
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  ANALYSIS COMPLETE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
