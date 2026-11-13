@echo off
chcp 65001 >nul 2>&1
setlocal

rem =====================================================================
rem uninstall-all.bat - Remove all Shop Platform Windows services
rem Does NOT delete MySQL database or project files.
rem =====================================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting admin privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo This will REMOVE the 3 Shop Platform Windows services.
echo Your MySQL database and project files WILL NOT be deleted.
echo.
set /p CONFIRM=Type YES to confirm: 
if /i not "%CONFIRM%"=="YES" (
    echo Cancelled.
    pause
    exit /b 0
)

set "NSSM=%~dp0tools\nssm\nssm.exe"

for %%s in (ShopPython ShopSpringBoot ShopMySQL) do (
    sc query %%s >nul 2>&1
    if %errorlevel% equ 0 (
        echo   Stopping %%s...
        "%NSSM%" stop %%s confirm >nul 2>&1
        timeout /t 2 /nobreak >nul
        echo   Removing %%s...
        "%NSSM%" remove %%s confirm >nul 2>&1
    ) else (
        echo   %%s: not installed, skip
    )
)

echo.
echo All services removed. You can safely delete this folder.
echo.
pause
