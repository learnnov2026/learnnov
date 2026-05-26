# start_learnnov.ps1 - Simple launcher that calls the bash script in WSL
Write-Host ""
Write-Host "Starting LearnNov via Ubuntu-22.04..." -ForegroundColor Cyan
Write-Host ""
wsl -d Ubuntu-22.04 -- sh "/mnt/b/LEARNNOV PLATFORM/setup_and_start.sh"
Write-Host ""
Read-Host "Press Enter to exit"
