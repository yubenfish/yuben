# ============================================================
# stop-all.ps1  —  一键停止全部服务
# 用法：.\stop-all.ps1
# ============================================================

$pidFile = "$env:TEMP\shop_pids.txt"
Write-Host "`n🛑 万物商城 · 停止全部服务" -ForegroundColor Red
Write-Host "=" * 50

# 方式1：读 PID 文件停
if (Test-Path $pidFile) {
    foreach ($line in Get-Content $pidFile) {
        if ($line -match '(\w+):(\d+)') {
            $svc = $Matches[1]; $pid = [int]$Matches[2]
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "  ✅ 已停 $svc (PID=$pid)" -ForegroundColor Green
            } catch {}
        }
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

# 方式2：兜底按进程名搜
Write-Host "`n兜底清理..." -NoNewline
$stopped = 0
foreach ($name in @('java','python','mysqld')) {
    Get-Process -Name $name -ErrorAction SilentlyContinue | ForEach-Object {
        try { Stop-Process -Id $_.Id -Force; $stopped++ } catch {}
    }
}
Start-Sleep -Seconds 1
Write-Host " 清了 $stopped 个进程 ✅" -ForegroundColor Green

# 确认全停
$ports = @(3306, 8080, 8081)
$stillUp = @()
foreach ($p in $ports) {
    if (netstat -ano 2>$null | Select-String ":$p" | Select-String "LISTENING") {
        $stillUp += $p
    }
}
if ($stillUp.Count -eq 0) {
    Write-Host "`n✅ 全部端口已释放" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ 端口仍在占用：$($stillUp -join ', ')" -ForegroundColor Yellow
}
Write-Host ""
