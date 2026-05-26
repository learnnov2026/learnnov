## Extended Security Scan CSV PowerShell Script
# File: security_scan_extended_csv.ps1
# Scans for a broader set of insecure patterns and writes results directly to CSV.

$searchRoot = "b:/LEARNNOV PLATFORM/openedx-platform-master"
$patterns = @(
    "eval\\(",
    "exec\\(",
    "system\\(",
    "subprocess",
    "pickle\\.loads",
    "os\\.system",
    "yaml\\.load",
    "execfile\\(",
    "input\\(",
    "raw_input\\(",
    "socket",
    "open\\(",
    "api_key",
    "access_key",
    "secret_key",
    "token",
    "TODO",
    "FIXME"
)

$includes = "*.py","*.sh","*.js","*.php","*.rb","*.java","*.c","*.cpp","*.cs"
$files = Get-ChildItem -Path $searchRoot -Recurse -File -Include $includes

$csvPath = Join-Path -Path $searchRoot -ChildPath "security_audit_report_extended.csv"

# Prepare CSV header
"file_path,line_number,issue_type,code_snippet" | Out-File -FilePath $csvPath -Encoding utf8

foreach ($file in $files) {
    $result = Select-String -Path $file.FullName -Pattern $patterns -AllMatches -SimpleMatch
    foreach ($m in $result) {
        $line = "`"$($file.FullName)`",$($m.LineNumber),`"$($m.Pattern)`",`"$($m.Line.Trim())`""
        Add-Content -Path $csvPath -Value $line -Encoding utf8
    }
}

Write-Host "Extended security scan CSV completed. Results at $csvPath"
