## Run Bandit Script
# File: run_bandit.ps1
# Executes Bandit on the openedx platform codebase and writes a JSON report.

$searchRoot = "b:/LEARNNOV PLATFORM/openedx-platform-master"
$reportPath = "b:/LEARNNOV PLATFORM/bandit_report.json"

# Ensure Bandit is in PATH (installed via pip earlier)
bandit -r $searchRoot -f json -o $reportPath

Write-Host "Bandit scan completed. Report saved to $reportPath"
