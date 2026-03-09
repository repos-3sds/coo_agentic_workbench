$src = "C:\Users\vssvi\Documents\Git_Repo\coo_agentic_workbench\Context\2026-02-19\Dify_Agent_Prompts"
$dst = "C:\Users\vssvi\Documents\Git_Repo\coo_agentic_workbench\Context\Dify_Agent_Prompts"

$files = @(
    "WF_NPA_Governance_Setup.md",
    "WF_NPA_Doc_Lifecycle_Setup.md",
    "WF_NPA_Monitoring_Setup.md",
    "WF_NPA_Notification_Setup.md",
    "CF_NPA_Query_Assistant_Setup.md"
)

foreach ($f in $files) {
    $srcPath = Join-Path $src $f
    $dstPath = Join-Path $dst $f
    Copy-Item $srcPath $dstPath -Force
    Write-Host "Synced: $f"
}
Write-Host "Done."
