# fix_localhost.ps1 — شغّله بصلاحيات مدير (Run as Administrator)
# يربط localhost:8888 بـ Docker داخل WSL2 Ubuntu

$ErrorActionPreference = 'Stop'

# 1. الحصول على IP لـ WSL2
$wslIP = $null
try {
    $wslIP = (wsl -d Ubuntu-22.04 -- hostname -I 2>$null).Trim().Split(" ") | Where-Object { $_ -match '^\d+\.\d+\.\d+\.\d+$' } | Select-Object -First 1
} catch {}

if (-not $wslIP) {
    try {
        $wslIP = (wsl -- hostname -I 2>$null).Trim().Split(" ") | Where-Object { $_ -match '^\d+\.\d+\.\d+\.\d+$' } | Select-Object -First 1
    } catch {}
}

if (-not $wslIP) {
    Write-Host "[ERROR] تعذّر الحصول على IP لـ WSL2. تأكد أن بيئة WSL تعمل." -ForegroundColor Red
    pause; exit 1
}
Write-Host "[INFO] WSL2 IP: $wslIP" -ForegroundColor Cyan

# 2. حذف القواعد القديمة لنفس المنفذ
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=8888 2>$null | Out-Null
netsh interface portproxy delete v4tov4 listenaddress=127.0.0.1 listenport=8888 2>$null | Out-Null

# 3. إضافة القاعدة الجديدة
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=8888 connectaddress=$wslIP connectport=8888

# 4. فتح الجدار الناري
netsh advfirewall firewall delete rule name="LearnNov-8888" 2>$null | Out-Null
netsh advfirewall firewall add rule name="LearnNov-8888" dir=in action=allow protocol=TCP localport=8888

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host " LearnNov يعمل على:" -ForegroundColor Green
Write-Host "   http://localhost:8888/" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# 5. اختبار
Start-Sleep -Seconds 2
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8888/" -UseBasicParsing -TimeoutSec 10
    Write-Host "[OK] المنصة تستجيب: HTTP $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "[تحذير] لم تستجب المنصة — تأكد أن Tutor يعمل في WSL2" -ForegroundColor Yellow
    Write-Host "شغّل: wsl -- bash -lc 'tutor local start -d'" -ForegroundColor Gray
}

pause
