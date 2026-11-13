# ============================================================
# health-check.ps1  —  健康检查 + 自动重启
# 用法：.\health-check.ps1 [-AutoRestart]
# 加入 Windows 任务计划程序可实现常驻守护
# ============================================================

param([switch]$AutoRestart)

Write-Host "`n🔍 万物商城 · 健康检查 $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
Write-Host "=" * 50

$services = @(
    @{ Name = 'MySQL (3306)';        Port = 3306; URL = 'http://localhost:3306';  AutoStart = 'mysql' },
    @{ Name = 'Spring Boot API (8081)'; Port = 8081; URL = 'http://localhost:8081/api/products?size=1'; AutoStart = 'spring' },
    @{ Name = 'Python Frontend (8080)'; Port = 8080; URL = 'http://127.0.0.1:8080/index.html'; AutoStart = 'python' }
)

$allOk = $true
foreach ($s in $services) {
    try {
        $r = Invoke-WebRequest $s.URL -UseBasicParsing -TimeoutSec 3
        Write-Host "  ✅ $($s.Name) OK (HTTP $($r.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $($s.Name) 挂了" -ForegroundColor Red
        $allOk = $false
        if ($AutoRestart) {
            Write-Host "     → 自动重启中..." -NoNewline
            & "$PSScriptRoot\start-all.ps1" | Out-Null
            Write-Host " ✅" -ForegroundColor Green
        }
    }
}

# Spring Boot 额外 API 深度检查（只看是否返回正确 JSON）
try {
    $r = Invoke-RestMethod "http://localhost:8081/api/products?size=1" -TimeoutSec 3
    if ($r.code -eq 0) {
        Write-Host "  ✅ API 深测 OK — total=$($r.data.total)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ API 深测异常 code=$($r.code)" -ForegroundColor Yellow
        $allOk = $false
    }
} catch {
    Write-Host "  ❌ API 深测失败" -ForegroundColor Red
    $allOk = $false
}

Write-Host "`n" + "=" * 50
if ($allOk) {
    Write-Host "✅ 全部服务健康 🎉" -ForegroundColor Green
} else {
    Write-Host "⚠️ 有服务异常！" -ForegroundColor Yellow
    if (-not $AutoRestart) {
        Write-Host "   用 -AutoRestart 参数可以自动拉起" -ForegroundColor Yellow
    }
}
Write-Host ""
