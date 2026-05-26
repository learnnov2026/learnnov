<#
.SYNOPSIS
    سكربت مساعد لتوليد الأسرار المشفرة لمنصة LearnNov على Kubernetes
.DESCRIPTION
    يساعد هذا السكربت في تحويل القيم النصية العادية إلى Base64 
    لإضافتها بشكل آمن في ملف secrets.yaml.
#>

Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     أداة توليد الأسرار لـ LearnNov Kubernetes      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function Encode-Base64 {
    param ([string]$value)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($value)
    return [Convert]::ToBase64String($bytes)
}

# 1. Django Secret Key
$djangoKey = -join ((48..57) + (65..90) + (97..122) + (33..47) | Get-Random -Count 50 | ForEach-Object { [char]$_ })
$djangoKeyB64 = Encode-Base64 $djangoKey
Write-Host "[1] Django Secret Key (مُولد تلقائياً):" -ForegroundColor Green
Write-Host $djangoKeyB64
Write-Host ""

# 2. Database URL
$dbPass = Read-Host "أدخل كلمة مرور قاعدة بيانات Cloud SQL (أو اضغط Enter لتخطي)"
if (![string]::IsNullOrWhiteSpace($dbPass)) {
    $dbUrl = "postgres://learnnov:${dbPass}@127.0.0.1:5432/learnnov_db"
    $dbUrlB64 = Encode-Base64 $dbUrl
    Write-Host "[2] Database URL (Base64):" -ForegroundColor Green
    Write-Host $dbUrlB64
    Write-Host ""
}

Write-Host "نسخ القيم أعلاه واستبدالها في الملف: learnnov-cloud/k8s/secrets.yaml" -ForegroundColor Yellow
Write-Host ""
