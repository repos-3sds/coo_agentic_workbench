param([string]$AgentId = "ALL")

$baseUrl = "http://localhost:3000/api/dify"

function Test-WorkflowAgent {
    param([string]$Agent, [string]$Body)
    Write-Host "`n=== Testing $Agent (workflow) ===" -ForegroundColor Cyan
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/workflow" -Method POST -ContentType "application/json" -Body $Body -TimeoutSec 120
        $status = $res.data.status
        if ($status -eq "succeeded") {
            Write-Host "  PASS: status=$status" -ForegroundColor Green
            $outputKeys = ($res.data.outputs | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) -join ", "
            Write-Host "  Output keys: $outputKeys"
        } else {
            Write-Host "  FAIL: status=$status" -ForegroundColor Red
            if ($res.metadata.payload.message) {
                Write-Host "  Error: $($res.metadata.payload.message)"
            }
        }
        return @{ agent = $Agent; status = $status; result = $res }
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        return @{ agent = $Agent; status = "error"; error = $_.Exception.Message }
    }
}

function Test-ChatAgent {
    param([string]$Agent, [string]$Query)
    Write-Host "`n=== Testing $Agent (chat) ===" -ForegroundColor Cyan
    $body = @{ agent_id = $Agent; query = $Query; conversation_id = "" } | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/chat" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 120
        if ($res.answer -and $res.answer.Length -gt 0) {
            Write-Host "  PASS: answer length=$($res.answer.Length) chars" -ForegroundColor Green
            $preview = $res.answer.Substring(0, [Math]::Min(200, $res.answer.Length))
            Write-Host "  Preview: $preview..."
        } else {
            Write-Host "  FAIL: empty answer" -ForegroundColor Red
        }
        return @{ agent = $Agent; status = "pass"; result = $res }
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        return @{ agent = $Agent; status = "error"; error = $_.Exception.Message }
    }
}

$results = @()

# --- WORKFLOW AGENTS ---

if ($AgentId -eq "ALL" -or $AgentId -eq "RISK") {
    $body = @{
        agent_id = "RISK"
        inputs = @{
            product_description = "FX Option on GBP/USD with 6-month European expiry, knock-out barrier at 1.35, for corporate hedging"
            product_category = "FX"
            underlying_asset = "GBP/USD"
            notional_amount = "25000000"
            currency = "USD"
            customer_segment = "Corporate"
            booking_location = "Singapore"
            counterparty_location = "London"
            is_cross_border = "true"
            classification_type = "Variation"
            approval_track = "NPA_LITE"
            input_text = "FX Option on GBP/USD with 6-month European expiry, knock-out barrier at 1.35, for corporate hedging"
            project_id = "NPA-2026-001"
        }
    } | ConvertTo-Json -Depth 3
    $results += Test-WorkflowAgent -Agent "RISK" -Body $body
}

if ($AgentId -eq "ALL" -or $AgentId -eq "GOVERNANCE") {
    $body = @{
        agent_id = "GOVERNANCE"
        inputs = @{
            project_id = "NPA-2026-001"
            approval_track = "FULL_NPA"
            classification_type = "NTG"
            current_stage = "SIGN_OFF"
            is_cross_border = "true"
            notional_amount = "75000000"
            context = "{}"
        }
    } | ConvertTo-Json -Depth 3
    $results += Test-WorkflowAgent -Agent "GOVERNANCE" -Body $body
}

if ($AgentId -eq "ALL" -or $AgentId -eq "DOC_LIFECYCLE") {
    $body = @{
        agent_id = "DOC_LIFECYCLE"
        inputs = @{
            project_id = "NPA-2026-001"
            approval_track = "FULL_NPA"
            current_stage = "SIGN_OFF"
            is_cross_border = "true"
            notional_amount = "75000000"
            context = "{}"
        }
    } | ConvertTo-Json -Depth 3
    $results += Test-WorkflowAgent -Agent "DOC_LIFECYCLE" -Body $body
}

if ($AgentId -eq "ALL" -or $AgentId -eq "MONITORING") {
    $body = @{
        agent_id = "MONITORING"
        inputs = @{
            project_id = "NPA-2026-002"
            current_stage = "MONITORING"
            context = "{}"
        }
    } | ConvertTo-Json -Depth 3
    $results += Test-WorkflowAgent -Agent "MONITORING" -Body $body
}

if ($AgentId -eq "ALL" -or $AgentId -eq "NOTIFICATION") {
    $body = @{
        agent_id = "NOTIFICATION"
        inputs = @{
            project_id = "NPA-2026-001"
            context = "{}"
        }
    } | ConvertTo-Json -Depth 3
    $results += Test-WorkflowAgent -Agent "NOTIFICATION" -Body $body
}

# --- CHAT AGENTS ---

if ($AgentId -eq "ALL" -or $AgentId -eq "IDEATION") {
    $results += Test-ChatAgent -Agent "IDEATION" -Query "I want to explore a new FX hedging product for corporate clients"
}

if ($AgentId -eq "ALL" -or $AgentId -eq "KB_SEARCH") {
    $results += Test-ChatAgent -Agent "KB_SEARCH" -Query "Search for similar NPAs involving FX Options"
}

if ($AgentId -eq "ALL" -or $AgentId -eq "NPA_ORCHESTRATOR") {
    $results += Test-ChatAgent -Agent "NPA_ORCHESTRATOR" -Query "What is the status of NPA-2026-001?"
}

# --- SUMMARY ---
Write-Host "`n`n========== TEST SUMMARY ==========" -ForegroundColor Yellow
foreach ($r in $results) {
    $color = if ($r.status -eq "succeeded" -or $r.status -eq "pass") { "Green" } else { "Red" }
    Write-Host "  $($r.agent): $($r.status)" -ForegroundColor $color
}
Write-Host "==================================" -ForegroundColor Yellow
