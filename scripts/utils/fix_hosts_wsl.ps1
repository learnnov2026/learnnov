$hostsPath = 'C:\Windows\System32\drivers\etc\hosts'
$domains = @('kaif.services', 'studio.kaif.services', 'apps.kaif.services')

try {
    $lines = [System.IO.File]::ReadAllLines($hostsPath)
    $newLines = [System.Collections.Generic.List[string]]::new($lines)
    $dirty = $false

    foreach ($domain in $domains) {
        $exists = $false
        foreach ($line in $lines) {
            if ($line -match "^\s*127\.0\.0\.1\s+$([regex]::Escape($domain))\s*$") {
                $exists = $true
                break
            }
        }
        if (-not $exists) {
            $newLines.Add("127.0.0.1  $domain")
            $dirty = $true
        }
    }

    if ($dirty) {
        [System.IO.File]::WriteAllLines($hostsPath, $newLines)
        Write-Host "Local domain mappings added successfully." -ForegroundColor Green
    } else {
        Write-Host "Domains are already mapped." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Failed to write to hosts file. Please run PowerShell as Administrator." -ForegroundColor Red
}

ipconfig /flushdns | Out-Null
Write-Host 'Done'
