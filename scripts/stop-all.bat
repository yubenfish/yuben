@echo off
chcp 65001 >nul 2>&1
setlocal

rem =====================================================================
rem stop-all.bat - Stop all Shop Platform services gracefully
rem =====================================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting admin privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Stopping Shop Platform services...

sc query ShopPython | findstr "RUNNING" >nul 2>&1
if %errorlevel% equ 0 ( net stop ShopPython /y >nul & echo   ShopPython: stopped ) else ( echo   ShopPython: not running )

sc query ShopSpringBoot | findstr "RUNNING" >nul 2>&1
if %errorlevel% equ 0 ( net stop ShopSpringBoot /y >nul & echo   ShopSpringBoot: stopped ) else ( echo   ShopSpringBoot: not running )

sc query ShopMySQL | findstr "RUNNING" >nul 2>&1
if %errorlevel% equ 0 ( net stop ShopMySQL /y >nul & echo   ShopMySQL: stopped ) else ( echo   ShopMySQL: not running )

echo.
echo All services stopped.
timeout /t 2 /nobreak >nul
