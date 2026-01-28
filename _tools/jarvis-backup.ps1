# JARVIS 1-click backup script
# Mirrors PRIMARY (E:\) -> BACKUP (D:\) using Robocopy

$source = "E:\"
$dest   = "D:\"

if (-not (Test-Path $source)) { Write-Host "SOURCE not found: $source" -ForegroundColor Red; Pause; exit 2 }
if (-not (Test-Path $dest))   { Write-Host "DEST not found:   $dest"   -ForegroundColor Red; Pause; exit 3 }

$logDir = "D:\_jarvis_backup_logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

$ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "$logDir\jarvis_mirror_$ts.txt"

Write-Host ""
Write-Host "Jarvis Backup Starting..." -ForegroundColor Cyan
Write-Host "SOURCE: $source"
Write-Host "DEST:   $dest"
Write-Host "LOG:    $logFile"
Write-Host ""

robocopy $source $dest /MIR /COPY:DAT /DCOPY:T /R:3 /W:5 /MT:16 /V /XD "E:\System Volume Information" /LOG:$logFile

Write-Host ""
Write-Host "Backup finished. Press any key to close."
Pause
