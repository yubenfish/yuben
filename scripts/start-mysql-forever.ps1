# start-mysql-forever.ps1 — 确保 MySQL 常驻
$mysqld = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
$dataDir = "C:\ProgramData\MySQL\MySQL Server 8.4\Data"

# Kill existing
Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2

# Verify files exist
Write-Host "mysqld exists: $(Test-Path $mysqld)"
Write-Host "datadir exists: $(Test-Path $dataDir)"

# Use Start-Process with NO string escaping — pass as separate items in array
$argsList = @(
    "--datadir=$dataDir",
    "--bind-address=127.0.0.1",
    "--console"
)

$p = Start-Process -FilePath $mysqld -ArgumentList $argsList -PassThru -RedirectStandardOutput "$env:TEMP\mysql_out.log" -RedirectStandardError "$env:TEMP\mysql_err.log"
Write-Host "MySQL PID=$($p.Id)"

Start-Sleep 5

if ($p.HasExited) {
    Write-Host "MySQL EXITED with code $($p.ExitCode)!"
    Write-Host "=== stderr ==="
    Get-Content "$env:TEMP\mysql_err.log" -Tail 20 -ErrorAction SilentlyContinue
} else {
    Write-Host "MySQL still running after 5s - SUCCESS"
}

Start-Sleep 3
# Verify port
$hit = netstat -ano | Select-String ":3306 " | Select-String "LISTENING"
if ($hit) {
    Write-Host "Port 3306 LISTENING - CONFIRMED"
} else {
    Write-Host "Port 3306 NOT LISTENING - FAILED"
}
