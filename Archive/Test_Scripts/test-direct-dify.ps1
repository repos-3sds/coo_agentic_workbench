# Direct Dify API test — bypass Express proxy to get raw Dify errors
param([string]$AgentId = "GOVERNANCE")

# Load env
$envFile = Join-Path $PSScriptRoot ".env"
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        $envVars[$Matches[1].Trim()] = $Matches[2].Trim()
    }
}

$baseUrl = $envVars["DIFY_BASE_URL"]
if (-not $baseUrl) { $baseUrl = "https://api.dify.ai/v1" }

$keyMap = @{
    GOVERNANCE = "DIFY_KEY_GOVERNANCE"
    DOC_LIFECYCLE = "DIFY_KEY_DOC_LIFECYCLE"
    MONITORING = "DIFY_KEY_MONITORING"
    NOTIFICATION = "DIFY_KEY_NOTIFICATION"
}

$keyName = $keyMap[$AgentId]
$apiKey = $envVars[$keyName]

Write-Host "Agent: $AgentId"
Write-Host "Key: $keyName = $($apiKey.Substring(0, 12))..."
Write-Host "Base URL: $baseUrl"

$inputsMap = @{
    GOVERNANCE = @{
        project_id = "NPA-2026-001"
        approval_track = "FULL_NPA"
        classification_type = "NTG"
        current_stage = "SIGN_OFF"
        is_cross_border = "true"
        notional_amount = "75000000"
        context = "{}"
        query = "Process governance for NPA-2026-001"
        agent_id = "GOVERNANCE"
    }
    DOC_LIFECYCLE = @{
        project_id = "NPA-2026-001"
        approval_track = "FULL_NPA"
        current_stage = "SIGN_OFF"
        is_cross_border = "true"
        notional_amount = "75000000"
        context = "{}"
        query = "Check document lifecycle for NPA-2026-001"
        agent_id = "DOC_LIFECYCLE"
    }
    MONITORING = @{
        project_id = "NPA-2026-002"
        current_stage = "MONITORING"
        context = "{}"
        query = "Monitor NPA-2026-002"
        agent_id = "MONITORING"
    }
    NOTIFICATION = @{
        project_id = "NPA-2026-001"
        context = "{}"
        query = "Check notifications for NPA-2026-001"
        agent_id = "NOTIFICATION"
    }
}

$body = @{
    inputs = $inputsMap[$AgentId]
    user = "test-user"
    response_mode = "blocking"
} | ConvertTo-Json -Depth 5

Write-Host "`nRequest body:"
Write-Host $body

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

Write-Host "`nCalling $baseUrl/workflows/run ..."

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/workflows/run" -Method POST -Headers $headers -Body $body -TimeoutSec 120
    Write-Host "`nHTTP Status: $($response.StatusCode)"
    Write-Host "Response:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`nHTTP Error: $($_.Exception.Response.StatusCode) $($_.Exception.Response.StatusDescription)" -ForegroundColor Red

    $stream = $_.Exception.Response.GetResponseStream()
    if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error body:" -ForegroundColor Red
        Write-Host $errorBody
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
