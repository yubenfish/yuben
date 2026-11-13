# start-mysql-v2.ps1 — 正确处理带空格的 datadir
$mysqld = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
$dataDir = "C:\ProgramData\MySQL\MySQL Server 8.4\Data"

Write-Host "mysqld: $mysqld"
Write-Host "datadir: $dataDir"

# Kill existing
Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2

# Key fix: wrap the datadir value in double quotes INSIDE the argument
# PowerShell Start-Process passes array items verbatim, so we need:
#   "--datadir=`"C:\ProgramData\MySQL\MySQL Server 8.4\Data`""
# which becomes the string:  --datadir="C:\ProgramData\MySQL\MySQL Server 8.4\Data"
$arg1 = "--datadir=`"$dataDir`""
Write-Host "arg1 = [$arg1]"

$p = Start-Process -FilePath $mysqld -ArgumentList @($arg1, "--bind-address=127.0.0.1") -PassThru -RedirectStandardError "$env:TEMP\mysql_err.log"
Write-Host "MySQL PID=$($p.Id)"

Start-Sleep 6

if ($p.HasExited) {
    Write-Host "MySQL EXITED with code $($p.ExitCode)!"
    Write-Host "=== stderr ==="
    Get-Content "$env:TEMP\mysql_err.log" -Tail 10
} else {
    Write-Host "MySQL still running after 6s"
}

Start-Sleep 2
$hit = netstat -ano | Select-String ":3306 " | Select-String "LISTENING"
if ($hit) {
    Write-Host "Port 3306 LISTENING - SUCCESS!"
} else {
    Write-Host "Port 3306 NOT LISTENING"
}
