# ====================================================================
# start-all.ps1  -- one-click start: MySQL + Spring Boot (JAR) + Python
# Usage: .\start-all.ps1
# Requirements: Java 21, Python, MySQL 8.4, JAR at backend\target\ecommerce-demo-1.0.0.jar
# ====================================================================

$ErrorActionPreference = 'Continue'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$jarFile     = "$projectRoot\backend\target\ecommerce-demo-1.0.0.jar"
$dataDir     = "C:\ProgramData\MySQL\MySQL Server 8.4\Data"
$mysqld      = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
$pidFile     = "$env:TEMP\shop_pids.txt"

$started = @()

function Check-Port {
    param([int]$Port)
    try {
        Invoke-WebRequest "http://localhost:$Port" -UseBasicParsing -TimeoutSec 2 | Out-Null
        return $true
    } catch { return $false }
}

Write-Host ""
Write-Host "== Shop Platform Start-Up ==" -ForegroundColor Cyan
Write-Host ("=" * 50)

# ---- 1. MySQL ----
Write-Host "[1/3] MySQL (3306) ..." -NoNewline
if (Check-Port 3306) {
    Write-Host " already running OK" -ForegroundColor Green
} else {
    $p = Start-Process -FilePath $mysqld -ArgumentList @("--datadir=$dataDir","--bind-address=127.0.0.1") -WindowStyle Hidden -PassThru
    $ok = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 600
        if (Check-Port 3306) { $ok = $true; break }
    }
    if ($ok) {
        Write-Host " started OK (PID=$($p.Id))" -ForegroundColor Green
        $started += "mysql:$($p.Id)"
    } else {
        Write-Host " FAILED" -ForegroundColor Red
    }
}

# ---- 2. Spring Boot ----
Write-Host "[2/3] Spring Boot API (8081) ..." -NoNewline
if (Check-Port 8081) {
    Write-Host " already running OK" -ForegroundColor Green
} elseif (-not (Test-Path $jarFile)) {
    Write-Host " JAR not found - run mvn package first" -ForegroundColor Red
} else {
    $p = Start-Process -FilePath 'java' -ArgumentList @('-jar',$jarFile,'--spring.profiles.active=mysql','--server.port=8081') -WorkingDirectory "$projectRoot\backend" -WindowStyle Hidden -PassThru
    $ok = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 700
        if (Check-Port 8081) { $ok = $true; break }
    }
    if ($ok) {
        Write-Host " started OK (PID=$($p.Id))" -ForegroundColor Green
        $started += "springboot:$($p.Id)"
    } else {
        Write-Host " FAILED" -ForegroundColor Red
    }
}

# ---- 3. Python http.server ----
Write-Host "[3/3] Python Frontend (8080) ..." -NoNewline
if (Check-Port 8080) {
    Write-Host " already running OK" -ForegroundColor Green
} else {
    $p = Start-Process -FilePath 'python' -ArgumentList @('-m','http.server','8080','--bind','127.0.0.1') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
    $ok = $false
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Milliseconds 500
        if (Check-Port 8080) { $ok = $true; break }
    }
    if ($ok) {
        Write-Host " started OK (PID=$($p.Id))" -ForegroundColor Green
        $started += "python:$($p.Id)"
    } else {
        Write-Host " FAILED" -ForegroundColor Red
    }
}

$started | Out-File -FilePath $pidFile -Encoding utf8

Write-Host ""
Write-Host ("=" * 50)
Write-Host "URLs:"
Write-Host "  Native Frontend:  http://127.0.0.1:8080/index.html" -ForegroundColor Yellow
Write-Host "  Old admin.html:   http://127.0.0.1:8080/admin.html" -ForegroundColor Yellow
Write-Host "  Vue Admin (dev):   http://localhost:5173/#/login  (run npm run dev)" -ForegroundColor Yellow
Write-Host "  Spring API:       http://localhost:8081/api/products" -ForegroundColor Yellow
Write-Host ""
Write-Host "Stop:   .\stop-all.ps1"
Write-Host "Health: .\health-check.ps1"
Write-Host ""
