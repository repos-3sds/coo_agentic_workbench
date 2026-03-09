# Download and analyze OpenAPI spec for schema issues
$base = "https://mcp-tools-ppjv.onrender.com"

Write-Host "=== Fetching OpenAPI Spec ===" -ForegroundColor Cyan
$res = Invoke-WebRequest -Uri "$base/openapi.json" -Method GET -TimeoutSec 30
$spec = $res.Content | ConvertFrom-Json

Write-Host "Total paths: $($spec.paths.PSObject.Properties.Count)"
Write-Host ""

# List all paths
Write-Host "--- All Tool Paths ---" -ForegroundColor Yellow
foreach ($p in $spec.paths.PSObject.Properties) {
    Write-Host "  $($p.Name)"
}
Write-Host ""

# Check governance tools specifically
$govTools = @(
    "/tools/governance_get_signoffs",
    "/tools/governance_create_signoff_matrix",
    "/tools/governance_record_decision",
    "/tools/governance_check_loopbacks",
    "/tools/governance_advance_stage",
    "/tools/get_signoff_routing_rules",
    "/tools/check_sla_status",
    "/tools/create_escalation",
    "/tools/get_escalation_rules",
    "/tools/save_approval_decision",
    "/tools/add_comment",
    "/tools/audit_log_action",
    "/tools/get_npa_by_id"
)

Write-Host "--- Governance Tool Schemas ---" -ForegroundColor Yellow
foreach ($tool in $govTools) {
    $pathObj = $spec.paths.PSObject.Properties[$tool]
    if ($pathObj) {
        $post = $pathObj.Value.post
        Write-Host "$tool" -ForegroundColor Green
        Write-Host "  summary: $($post.summary)"
        Write-Host "  operationId: $($post.operationId)"

        # Check requestBody schema
        if ($post.requestBody) {
            $schema = $post.requestBody.content.'application/json'.schema
            Write-Host "  requestBody properties:"
            foreach ($prop in $schema.properties.PSObject.Properties) {
                $pType = $prop.Value.type
                $pDefault = $prop.Value.default
                $pEnum = $prop.Value.enum
                $line = "    $($prop.Name): type=$pType"
                if ($pDefault) { $line += " default=$pDefault" }
                if ($pEnum) { $line += " enum=[$($pEnum -join ',')]" }
                Write-Host $line
            }
            if ($schema.required) {
                Write-Host "  required: $($schema.required -join ', ')"
            }
        }
        Write-Host ""
    } else {
        Write-Host "$tool - NOT FOUND" -ForegroundColor Red
        Write-Host ""
    }
}

# Also check the raw JSON for each governance tool path for any anomalies
Write-Host "--- Raw JSON Length per Governance Tool ---" -ForegroundColor Yellow
foreach ($tool in $govTools) {
    $pathObj = $spec.paths.PSObject.Properties[$tool]
    if ($pathObj) {
        $raw = $pathObj.Value | ConvertTo-Json -Depth 10 -Compress
        Write-Host "$tool : $($raw.Length) chars"
    }
}
