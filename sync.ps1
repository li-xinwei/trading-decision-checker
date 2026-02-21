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

# 4. Analyze changes and build commit message
git add -A

$added    = @(git diff --cached --diff-filter=A --name-only)
$modified = @(git diff --cached --diff-filter=M --name-only)
$deleted  = @(git diff --cached --diff-filter=D --name-only)
$renamed  = @(git diff --cached --diff-filter=R --name-only)

Write-Log "Changes detected:" "Yellow"
foreach ($f in $added)    { Write-Log "  + $f" "Green" }
foreach ($f in $modified) { Write-Log "  ~ $f" "Yellow" }
foreach ($f in $deleted)  { Write-Log "  - $f" "Red" }
foreach ($f in $renamed)  { Write-Log "  > $f" "Cyan" }

if (-not $Message) {
    $parts = @()
    if ($added.Count -gt 0) {
        $names = ($added | ForEach-Object { Split-Path $_ -Leaf }) -join ", "
        $parts += "add $names"
    }
    if ($modified.Count -gt 0) {
        $names = ($modified | ForEach-Object { Split-Path $_ -Leaf }) -join ", "
        $parts += "update $names"
    }
    if ($deleted.Count -gt 0) {
        $names = ($deleted | ForEach-Object { Split-Path $_ -Leaf }) -join ", "
        $parts += "remove $names"
    }
    if ($renamed.Count -gt 0) {
        $names = ($renamed | ForEach-Object { Split-Path $_ -Leaf }) -join ", "
        $parts += "rename $names"
    }

    $summary = $parts -join "; "
    $totalFiles = $added.Count + $modified.Count + $deleted.Count + $renamed.Count
    $Message = "$summary ($totalFiles file$(if ($totalFiles -ne 1) {'s'}))"
}

git commit -m $Message 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Log "Commit failed." "Red"
    exit 1
}

$commitHash = git rev-parse --short HEAD
Write-Log "Committed [$commitHash]: $Message" "Green"

# 5. Push
$pushOutput = git push origin main 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "Push failed: $pushOutput" "Red"
    exit 1
}

Write-Log "Pushed $commitHash to origin/main. Sync complete!" "Green"
