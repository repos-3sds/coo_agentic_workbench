$r = Invoke-WebRequest -Uri "https://mcp-tools-ppjv.onrender.com/openapi.json" -Method GET -TimeoutSec 30

Write-Host "Content-Length: $($r.Content.Length)"
Write-Host "Content-Type: $($r.Headers['Content-Type'])"
Write-Host "First 50 chars: $($r.Content.Substring(0, 50))"
Write-Host "Last 50 chars: $($r.Content.Substring($r.Content.Length - 50, 50))"
Write-Host "Char at pos 29: [$($r.Content[29])]"
Write-Host "Char at pos 30: [$($r.Content[30])]"
Write-Host "Char at pos 31: [$($r.Content[31])]"
Write-Host "Chars 25-40: $($r.Content.Substring(25, 16))"

# Check if JSON is valid
try {
    $json = $r.Content | ConvertFrom-Json
    Write-Host "JSON parse: OK" -ForegroundColor Green
    Write-Host "Paths count: $($json.paths.PSObject.Properties.Count)"
} catch {
    Write-Host "JSON parse: FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Check for BOM or hidden chars
$bytes = [System.Text.Encoding]::UTF8.GetBytes($r.Content)
Write-Host "First 10 bytes: $($bytes[0..9] -join ', ')"
Write-Host "Total bytes: $($bytes.Length)"

# Check if response has double JSON (concatenated)
$content = $r.Content
$braceCount = 0
$firstJsonEnd = -1
for ($i = 0; $i -lt $content.Length; $i++) {
    if ($content[$i] -eq '{') { $braceCount++ }
    if ($content[$i] -eq '}') { $braceCount-- }
    if ($braceCount -eq 0 -and $i -gt 0) {
        $firstJsonEnd = $i
        break
    }
}
Write-Host "First JSON object ends at position: $firstJsonEnd"
if ($firstJsonEnd -lt $content.Length - 1) {
    $remaining = $content.Substring($firstJsonEnd + 1)
    if ($remaining.Trim().Length -gt 0) {
        Write-Host "EXTRA DATA AFTER JSON: [$($remaining.Substring(0, [Math]::Min(100, $remaining.Length)))]" -ForegroundColor Red
    } else {
        Write-Host "No extra data after JSON (just whitespace)" -ForegroundColor Green
    }
} else {
    Write-Host "JSON ends exactly at end of content" -ForegroundColor Green
}

# Now check individual tool endpoint responses for the same pattern
Write-Host ""
Write-Host "=== Checking individual tool responses for extra data ===" -ForegroundColor Yellow
$testTools = @(
    @{ name = "governance_get_signoffs"; body = '{"project_id":"NPA-2026-001"}' }
    @{ name = "get_npa_by_id"; body = '{"project_id":"NPA-2026-001"}' }
    @{ name = "audit_log_action"; body = '{"project_id":"NPA-2026-001","actor_name":"test","action_type":"TEST"}' }
)

foreach ($tool in $testTools) {
    $toolRes = Invoke-WebRequest -Uri "https://mcp-tools-ppjv.onrender.com/tools/$($tool.name)" -Method POST -Body $tool.body -ContentType "application/json" -TimeoutSec 30
    $toolContent = $toolRes.Content

    # Find end of first JSON object
    $bc = 0
    $fje = -1
    for ($i = 0; $i -lt $toolContent.Length; $i++) {
        if ($toolContent[$i] -eq '{') { $bc++ }
        if ($toolContent[$i] -eq '}') { $bc-- }
        if ($bc -eq 0 -and $i -gt 0) {
            $fje = $i
            break
        }
    }

    Write-Host "  $($tool.name): length=$($toolContent.Length), firstJsonEnds=$fje" -NoNewline
    if ($fje -lt $toolContent.Length - 1) {
        $rem = $toolContent.Substring($fje + 1).Trim()
        if ($rem.Length -gt 0) {
            Write-Host " EXTRA_DATA: [$($rem.Substring(0, [Math]::Min(80, $rem.Length)))]" -ForegroundColor Red
        } else {
            Write-Host " OK" -ForegroundColor Green
        }
    } else {
        Write-Host " OK" -ForegroundColor Green
    }
}
