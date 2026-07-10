# Barcha Chrome oynalarini yoping, keyin shu skriptni ishga tushiring.
# Sales ga kiring, keyin: npm run collect:2026-06-02

$chrome = @(
  "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chrome) {
  Write-Host "Chrome topilmadi. Qo'lda ishga tushiring: chrome.exe --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222"
  exit 1
}

Write-Host "Chrome debug rejimida ochilmoqda (port 9222)..."
Start-Process $chrome '--remote-debugging-address=127.0.0.1 --remote-debugging-port=9222'
