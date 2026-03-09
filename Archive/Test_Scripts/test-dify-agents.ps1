# Test all 4 previously failing Dify workflow agents via Dify direct API

$difyBase = "https://api.dify.ai/v1"

# Load API keys from .env file
$envPath = "C:\Users\vssvi\Documents\Git_Repo\coo_agentic_workbench\server\.env"
$envContent = Get-Content $envPath
$keys = @{}
foreach ($line in $envContent) {
    if ($line -match '^(\w+)=(.+)$') {
        $keys[$matches[1]] = $matches[2].Trim()
    }
}

function Test-DifyWorkflow {
    param(
        [string]$Name,
        [string]$ApiKey,
        [hashtable]$Inputs
    )

    Write-Host "=== Testing: $Name ===" -ForegroundColor Yellow
    Write-Host "  API Key: $($ApiKey.Substring(0, 8))..." -ForegroundColor DarkGray

    $body = @{
        inputs = $Inputs
        response_mode = "blocking"
        user = "test-script"
    } | ConvertTo-Json -Depth 5

    try {
        $headers = @{
            "Authorization" = "Bearer $ApiKey"
            "Content-Type" = "application/json"
        }
        $res = Invoke-WebRequest -Uri "$difyBase/workflows/run" -Method POST -Body $body -Headers $headers -TimeoutSec 120
        $data = $res.Content | ConvertFrom-Json

        if ($data.data -and $data.data.status -eq "succeeded") {
            Write-Host "  STATUS: SUCCEEDED" -ForegroundColor Green
            Write-Host "  Elapsed: $($data.data.elapsed_time)s" -ForegroundColor Green
            Write-Host "  Tokens: $($data.data.total_tokens)" -ForegroundColor Green
            $outputText = $data.data.outputs.text
            if ($outputText) {
                $preview = $outputText.Substring(0, [Math]::Min(300, $outputText.Length))
                Write-Host "  Output preview: $preview" -ForegroundColor Cyan
            }
        } elseif ($data.data -and $data.data.status -eq "failed") {
            Write-Host "  STATUS: FAILED" -ForegroundColor Red
            Write-Host "  Error: $($data.data.error)" -ForegroundColor Red
        } else {
            Write-Host "  STATUS: UNKNOWN" -ForegroundColor Yellow
            $preview = $res.Content.Substring(0, [Math]::Min(500, $res.Content.Length))
            Write-Host "  Response: $preview" -ForegroundColor Yellow
        }
    } catch {
        $errMsg = $_.Exception.Message
        Write-Host "  HTTP ERROR: $errMsg" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errBody = $reader.ReadToEnd()
            $reader.Close()
            Write-Host "  Error body: $($errBody.Substring(0, [Math]::Min(300, $errBody.Length)))" -ForegroundColor DarkRed
        }
    }
    Write-Host ""
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  DIFY WORKFLOW AGENT TEST - 4 Previously Failing Agents" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. GOVERNANCE
Test-DifyWorkflow -Name "WF_NPA_Governance" -ApiKey $keys["DIFY_KEY_GOVERNANCE"] -Inputs @{
    project_id = "NPA-2026-001"
    approval_track = "FULL_NPA"
    current_stage = "SIGN_OFF"
    context = "{}"
}

# 2. DOC_LIFECYCLE
Test-DifyWorkflow -Name "WF_NPA_Doc_Lifecycle" -ApiKey $keys["DIFY_KEY_DOC_LIFECYCLE"] -Inputs @{
    project_id = "NPA-2026-001"
    approval_track = "FULL_NPA"
    current_stage = "SIGN_OFF"
    context = "{}"
}

# 3. MONITORING
$monContext = '{"action":"CHECK_HEALTH"}'
Test-DifyWorkflow -Name "WF_NPA_Monitoring" -ApiKey $keys["DIFY_KEY_MONITORING"] -Inputs @{
    project_id = "NPA-2026-002"
    current_stage = "MONITORING"
    context = $monContext
}

# 4. NOTIFICATION
$notifContext = '{"alert_type":"SLA_BREACH","severity":"CRITICAL"}'
Test-DifyWorkflow -Name "WF_NPA_Notification" -ApiKey $keys["DIFY_KEY_NOTIFICATION"] -Inputs @{
    project_id = "NPA-2026-001"
    context = $notifContext
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
