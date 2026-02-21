param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "`n=== Trading Portal Sync ===" -ForegroundColor Cyan

# 1. Pull latest changes
Write-Host "`n[1/4] Pulling latest changes..." -ForegroundColor Yellow
try {
    git pull --rebase origin main 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Pull failed. You may have merge conflicts to resolve." -ForegroundColor Red
        exit 1
    }
    Write-Host "Pull complete." -ForegroundColor Green
} catch {
    Write-Host "Pull failed: $_" -ForegroundColor Red
    exit 1
}

# 2. Check for changes
Write-Host "`n[2/4] Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain
if (-not $status) {
    Write-Host "No local changes to sync. Already up to date!" -ForegroundColor Green
    exit 0
}

Write-Host "Changed files:" -ForegroundColor White
git status --short
Write-Host ""

# 3. Stage and commit
Write-Host "[3/4] Committing changes..." -ForegroundColor Yellow
git add -A

if (-not $Message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $changedFiles = (git diff --cached --name-only) -join ", "
    $Message = "sync: $timestamp | $changedFiles"
}

git commit -m $Message 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed." -ForegroundColor Red
    exit 1
}
Write-Host "Committed." -ForegroundColor Green

# 4. Push
Write-Host "`n[4/4] Pushing to remote..." -ForegroundColor Yellow
git push origin main 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed." -ForegroundColor Red
    exit 1
}

Write-Host "`nSync complete!" -ForegroundColor Green
Write-Host "=========================`n" -ForegroundColor Cyan
