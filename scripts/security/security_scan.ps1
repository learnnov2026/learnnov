## Security Scan PowerShell Script
# File: security_scan.ps1
# This script scans the openedx-platform codebase for insecure patterns and comments.

$searchRoot = "b:/LEARNNOV PLATFORM/openedx-platform-master"
$patterns = @(
    "eval\\(",
    "exec\\(",
    "system\\(",
    "password",
    "secret",
    "TODO",
    "FIXME"
)

# Gather all source files of common types
$includes = "*.py","*.sh","*.js","*.php","*.rb","*.java","*.c","*.cpp","*.cs"
$files = Get-ChildItem -Path $searchRoot -Recurse -File -Include $includes

$matches = @()
foreach ($file in $files) {
    $result = Select-String -Path $file.FullName -Pattern $patterns -AllMatches -SimpleMatch:$false
    foreach ($m in $result) {
        $matches += [PSCustomObject]@{
            File    = $file.FullName
            Line    = $m.LineNumber
            Text    = $m.Line.Trim()
            Pattern = $m.Pattern
        }
    }
}

# Output JSON for downstream processing
$outputPath = Join-Path -Path $searchRoot -ChildPath "scan_results.json"
$matches | ConvertTo-Json -Depth 5 | Out-File -FilePath $outputPath -Encoding utf8
Write-Host "Security scan completed. Results written to $outputPath"
