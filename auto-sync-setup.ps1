# Run this script as Administrator to set up automatic sync
# Usage: Right-click -> Run with PowerShell (as Admin)

$TaskName = "TradingPortalAutoSync"
$ScriptPath = Join-Path $PSScriptRoot "sync.ps1"
$IntervalMinutes = 5

Write-Host "`n=== Trading Portal Auto-Sync Setup ===" -ForegroundColor Cyan
Write-Host "Sync script : $ScriptPath" -ForegroundColor White
Write-Host "Interval    : every $IntervalMinutes minutes" -ForegroundColor White
Write-Host ""

# Remove existing task if present
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed old scheduled task." -ForegroundColor Yellow
}

$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`" -Silent" `
    -WorkingDirectory $PSScriptRoot

# Trigger: repeats every N minutes, starting now, indefinitely
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)

$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 3)

$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Principal $Principal `
    -Description "Auto-sync Trading Portal project to GitHub every $IntervalMinutes minutes" | Out-Null

Write-Host "`nScheduled task '$TaskName' created!" -ForegroundColor Green
Write-Host "Auto-sync is now active. It will run every $IntervalMinutes minutes in the background." -ForegroundColor Green
Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  Check status : Get-ScheduledTask -TaskName '$TaskName' | Select State" -ForegroundColor White
Write-Host "  Run now      : Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
Write-Host "  Stop/remove  : Unregister-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
Write-Host "  View log     : Get-Content '$PSScriptRoot\sync.log' -Tail 20" -ForegroundColor White
Write-Host ""
