## Extended Security Scan PowerShell Script
# File: security_scan_extended.ps1
# Scans for a broader set of insecure patterns and hard‑coded secrets.

$searchRoot = "b:/LEARNNOV PLATFORM/openedx-platform-master"
$patterns = @(
    "eval\\(",
    "exec\\(",
    "system\\(",
    "subprocess",  # subprocess module usage
    "pickle\\.loads",  # unsafe pickle loading
    "os\\.system",  # os.system calls
    "yaml\\.load",   # unsafe yaml loading
    "execfile\\(",
    "input\\(",
    "raw_input\\(",
    "socket",  # socket usage
    "open\\(",  # generic file open (potential path injection)
    "api_key",
    "access_key",
    "secret_key",
    "token",
    "TODO",
    "FIXME"
)

$includes = "*.py","*.sh","*.js","*.php","*.rb","*.java","*.c","*.cpp","*.cs"
$files = Get-ChildItem -Path $searchRoot -Recurse -File -Include $includes

$matches = @()
foreach ($file in $files) {
    $result = Select-String -Path $file.FullName -Pattern $patterns -AllMatches -SimpleMatch
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
$outputPath = Join-Path -Path $searchRoot -ChildPath "scan_results_extended.json"
$matches | ConvertTo-Json -Depth 5 | Out-File -FilePath $outputPath -Encoding utf8
Write-Host "Extended security scan completed. Results written to $outputPath"
