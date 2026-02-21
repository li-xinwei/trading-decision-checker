param(
    [string]$Message = "",
    [switch]$Silent
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$LogFile = Join-Path $PSScriptRoot "sync.log"

function Write-Log {
    param([string]$Text, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $Text"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
    if (-not $Silent) {
        Write-Host $Text -ForegroundColor $Color
    }
}

# Keep log file under 500 lines
if (Test-Path $LogFile) {
    $lines = Get-Content $LogFile -Encoding UTF8
    if ($lines.Count -gt 500) {
        $lines[-200..-1] | Set-Content $LogFile -Encoding UTF8
    }
}

Write-Log "=== Sync Start ===" "Cyan"

# 1. Check network / remote reachability
try {
    git ls-remote --exit-code origin HEAD 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "unreachable" }
} catch {
    Write-Log "Remote unreachable, skipping sync." "Yellow"
    exit 0
}

# 2. Pull
Write-Log "Pulling..." "Yellow"
$pullOutput = git pull --rebase origin main 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "Pull failed: $pullOutput" "Red"
    git rebase --abort 2>&1 | Out-Null
    exit 1
}
Write-Log "Pull OK." "Green"

# 3. Check for local changes
$status = git status --porcelain
if (-not $status) {
    Write-Log "No changes. Done." "Green"
    exit 0
}

# 4. Commit
git add -A
if (-not $Message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $changedFiles = (git diff --cached --name-only) -join ", "
    $Message = "sync: $timestamp | $changedFiles"
}

git commit -m $Message 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Log "Commit failed." "Red"
    exit 1
}
Write-Log "Committed: $Message" "Green"

# 5. Push
$pushOutput = git push origin main 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "Push failed: $pushOutput" "Red"
    exit 1
}

Write-Log "Push OK. Sync complete!" "Green"
