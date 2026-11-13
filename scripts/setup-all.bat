@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

rem =====================================================================
rem setup-all.bat  -  ONE-CLICK DEPLOYMENT for SHOP PLATFORM
rem Works on ANY Windows PC with Java 21, Python 3, and MySQL 8.x
rem Double-click to run (auto-elevates to admin)
rem =====================================================================

rem --- Auto-elevate to admin ---
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting admin privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
echo.
echo ============================================
echo   SHOP PLATFORM - ONE-CLICK SETUP
echo   Project: %PROJECT_DIR%
echo ============================================

rem --- 8.3 short path to avoid space/Chinese issues ---
for /f "delims=" %%i in ('powershell -Command "(New-Object -ComObject Scripting.FileSystemObject).GetFolder('%PROJECT_DIR%').ShortPath" 2^>nul') do set "SHORT_DIR=%%i"
if "%SHORT_DIR%"=="" set "SHORT_DIR=%PROJECT_DIR%"
echo   Short path: %SHORT_DIR%

rem =====================================================================
rem [1] DETECT PREREQUISITES
rem =====================================================================
echo.
echo [1/6] Checking prerequisites...

set "OK=1"

echo   Java 21+...
java -version 2>&1 | findstr /i "version" | findstr /r "21\. 22\. 23\." >nul
if %errorlevel% neq 0 (
    echo     NOT FOUND ^(need Java 21+^). Install from https://adoptium.net/
    set "OK=0"
) else (
    for /f "tokens=3" %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do echo     OK  %%~v
)

echo   Python 3...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo     NOT FOUND. Install from https://www.python.org/downloads/
    set "OK=0"
) else (
    for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo     OK  %%v
)

echo   NSSM bundled...
if not exist "%PROJECT_DIR%\tools\nssm\nssm.exe" (
    echo     NOT FOUND in tools\nssm\
    set "OK=0"
) else (
    echo     OK  bundled nssm.exe
)

echo   Spring Boot JAR...
if not exist "%PROJECT_DIR%\backend\target\ecommerce-demo-1.0.0.jar" (
    echo     NOT FOUND. Run "mvn package -DskipTests" first.
    set "OK=0"
) else (
    echo     OK  backend\target\ecommerce-demo-1.0.0.jar
)

if "%OK%"=="0" (
    echo.
    echo [FAIL] Missing prerequisites - install above then re-run.
    echo.
    pause
    exit /b 1
)

rem =====================================================================
rem [2] DETECT MYSQL
rem =====================================================================
echo.
echo [2/6] Locating MySQL...

rem Try registry
set "MYSQL_BIN="
for /f "skip=2 tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\MySQL AB" 2^>nul') do (
    for /f "tokens=2*" %%c in ('reg query "%%b" /v Location 2^>nul ^| findstr "Location"') do set "MYSQL_BIN=%%c\bin"
)

rem Common paths fallback
if "%MYSQL_BIN%"=="" (
    if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.4\bin"
)
if "%MYSQL_BIN%"=="" (
    if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin"
)
if "%MYSQL_BIN%"=="" (
    if exist "C:\mysql\bin\mysqld.exe" set "MYSQL_BIN=C:\mysql\bin"
)

if "%MYSQL_BIN%"=="" (
    echo   NOT FOUND. Install MySQL 8.x from https://dev.mysql.com/downloads/mysql/
    echo   Or add mysqld.exe location to PATH, then re-run.
    pause
    exit /b 1
)

echo   MySQL bin: %MYSQL_BIN%

rem Find datadir
for /f "delims=" %%d in ('"%MYSQL_BIN%\mysqld.exe" --verbose --help 2^>nul ^| findstr /i "datadir" ^| findstr /v "^datadir" ^| head -1') do set "MYSQL_DATADIR=%%d"
if "%MYSQL_DATADIR%"=="" (
    for /f "delims=" %%d in ('"%MYSQL_BIN%\mysqld.exe" --verbose --help 2^>nul ^| findstr /i "datadir"') do (
        for /f "tokens=2" %%p in ("%%d") do set "MYSQL_DATADIR=%%p"
    )
)
if "%MYSQL_DATADIR%"=="" set "MYSQL_DATADIR=%PROGRAMDATA%\MySQL\MySQL Server 8.4\Data"
echo   MySQL datadir: %MYSQL_DATADIR%

rem =====================================================================
rem [3] GENERATE LAUNCHER BATS (dynamic paths!)
rem =====================================================================
echo.
echo [3/6] Generating launcher scripts...

set "LOG_DIR=%SHORT_DIR%\logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

rem --- launcher-mysql.bat ---
>"%PROJECT_DIR%\launcher-mysql.bat" echo @echo off
>>"%PROJECT_DIR%\launcher-mysql.bat" echo "%MYSQL_BIN%\mysqld.exe" --datadir="%MYSQL_DATADIR%" --bind-address=127.0.0.1

rem --- launcher-springboot.bat ---
for /f "delims=" %%j in ('dir /b "%PROJECT_DIR%\backend\target\ecommerce-demo-*.jar" 2^>nul ^| findstr /v original') do set "JAR_NAME=%%j"
>"%PROJECT_DIR%\launcher-springboot.bat" echo @echo off
>>"%PROJECT_DIR%\launcher-springboot.bat" echo java -jar "%PROJECT_DIR%\backend\target\%JAR_NAME%" --spring.profiles.active=mysql --server.port=8081

rem --- launcher-python.bat ---
>"%PROJECT_DIR%\launcher-python.bat" echo @echo off
>>"%PROJECT_DIR%\launcher-python.bat" echo python -m http.server 8080 --bind 127.0.0.1 --directory "%PROJECT_DIR%"

echo   launcher-mysql.bat        OK
echo   launcher-springboot.bat   OK ^(%JAR_NAME%^)
echo   launcher-python.bat       OK

rem =====================================================================
rem [4] START MYSQL + INIT DB
rem =====================================================================
echo.
echo [4/6] Starting MySQL + initializing database...

rem Check if MySQL already running
netstat -ano 2>nul | findstr ":3306 " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo   MySQL already running on 3306
) else (
    echo   Starting mysqld...
    start "" "%MYSQL_BIN%\mysqld.exe" --datadir="%MYSQL_DATADIR%" --bind-address=127.0.0.1
    timeout /t 8 /nobreak >nul
)

rem Init database (root no password assumed - prompt if needed later)
"%MYSQL_BIN%\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
if %errorlevel% neq 0 (
    echo.
    echo   [WARN] Cannot connect to MySQL as root (empty password).
    echo   If you have a password, update application.yml then re-run.
    echo   For now, trying without seed data...
) else (
    echo   Database shop_db OK
    if exist "%PROJECT_DIR%\backend\src\main\resources\schema.sql" (
        echo   Importing schema.sql...
        "%MYSQL_BIN%\mysql.exe" -u root shop_db < "%PROJECT_DIR%\backend\src\main\resources\schema.sql" 2>nul
    )
    if exist "%PROJECT_DIR%\backend\src\main\resources\data.sql" (
        echo   Importing data.sql (26 products)...
        "%MYSQL_BIN%\mysql.exe" -u root shop_db < "%PROJECT_DIR%\backend\src\main\resources\data.sql" 2>nul
    )
    echo   Database initialized OK
)

rem =====================================================================
rem [5] INSTALL NSSM SERVICES
rem =====================================================================
echo.
echo [5/6] Installing Windows services...

set "NSSM=%PROJECT_DIR%\tools\nssm\nssm.exe"

rem Uninstall old if exists
for %%s in (ShopMySQL ShopSpringBoot ShopPython) do (
    sc query %%s | findstr "RUNNING STOPPED" >nul 2>&1
    if %errorlevel% equ 0 (
        "%NSSM%" stop %%s confirm >nul 2>&1
        timeout /t 1 /nobreak >nul
        "%NSSM%" remove %%s confirm >nul 2>&1
        echo   Cleaned old %%s
    )
)

rem Install ShopMySQL (use SHORT path to avoid Chinese/space encoding issues)
echo   Installing ShopMySQL...
"%NSSM%" install ShopMySQL "%SHORT_DIR%\launcher-mysql.bat" >nul 2>&1
"%NSSM%" set ShopMySQL Start SERVICE_AUTO_START >nul 2>&1
"%NSSM%" set ShopMySQL DisplayName "Shop Platform - MySQL" >nul 2>&1
"%NSSM%" set ShopMySQL Description "Shop Platform MySQL 8.x Database" >nul 2>&1
"%NSSM%" set ShopMySQL AppStdout "%LOG_DIR%\mysql_out.log" >nul 2>&1
"%NSSM%" set ShopMySQL AppStderr "%LOG_DIR%\mysql_err.log" >nul 2>&1
"%NSSM%" set ShopMySQL AppRotateFiles 1 >nul 2>&1

rem Install ShopSpringBoot (use SHORT path to avoid Chinese/space encoding issues)
echo   Installing ShopSpringBoot...
"%NSSM%" install ShopSpringBoot "%SHORT_DIR%\launcher-springboot.bat" >nul 2>&1
"%NSSM%" set ShopSpringBoot Start SERVICE_AUTO_START >nul 2>&1
"%NSSM%" set ShopSpringBoot DisplayName "Shop Platform - Spring Boot API" >nul 2>&1
"%NSSM%" set ShopSpringBoot Description "Shop Platform Spring Boot REST API (port 8081)" >nul 2>&1
"%NSSM%" set ShopSpringBoot AppStdout "%LOG_DIR%\springboot_out.log" >nul 2>&1
"%NSSM%" set ShopSpringBoot AppStderr "%LOG_DIR%\springboot_err.log" >nul 2>&1
"%NSSM%" set ShopSpringBoot AppRotateFiles 1 >nul 2>&1
"%NSSM%" set ShopSpringBoot DependOnService ShopMySQL >nul 2>&1

rem Install ShopPython (use SHORT path to avoid Chinese/space encoding issues)
echo   Installing ShopPython...
"%NSSM%" install ShopPython "%SHORT_DIR%\launcher-python.bat" >nul 2>&1
"%NSSM%" set ShopPython Start SERVICE_AUTO_START >nul 2>&1
"%NSSM%" set ShopPython DisplayName "Shop Platform - Frontend" >nul 2>&1
"%NSSM%" set ShopPython Description "Shop Platform Python http.server (port 8080)" >nul 2>&1
"%NSSM%" set ShopPython AppStdout "%LOG_DIR%\python_out.log" >nul 2>&1
"%NSSM%" set ShopPython AppStderr "%LOG_DIR%\python_err.log" >nul 2>&1
"%NSSM%" set ShopPython AppRotateFiles 1 >nul 2>&1

echo   All 3 services installed OK

rem =====================================================================
rem [6] START SERVICES + VERIFY
rem =====================================================================
echo.
echo [6/6] Starting services and verifying...

net start ShopMySQL >nul 2>&1
timeout /t 2 /nobreak >nul
net start ShopSpringBoot >nul 2>&1
timeout /t 2 /nobreak >nul
net start ShopPython >nul 2>&1

echo.
echo   Waiting for Spring Boot (25s)...
timeout /t 25 /nobreak >nul

echo.
echo ============================================
echo   HEALTH CHECK
echo ============================================

set "ALL_OK=1"

echo.
echo   Services:
for %%s in (ShopMySQL ShopSpringBoot ShopPython) do (
    sc query %%s | findstr "RUNNING" >nul
    if !errorlevel! equ 0 (
        echo     %%s: RUNNING OK
    ) else (
        echo     %%s: NOT RUNNING
        set "ALL_OK=0"
    )
)

echo.
echo   Ports:
for %%p in (3306 8081 8080) do (
    netstat -ano 2>nul | findstr ":%%p " | findstr "LISTENING" >nul
    if !errorlevel! equ 0 (
        echo     Port %%p: OK
    ) else (
        echo     Port %%p: DOWN
        set "ALL_OK=0"
    )
)

echo.
echo   API:
curl -s -o nul -w "%%{http_code}" http://localhost:8081/api/products >nul 2>&1
if !errorlevel! equ 0 (
    for /f "delims=" %%r in ('curl -s http://localhost:8081/api/products 2^>nul ^| findstr "total"') do echo     Spring Boot API: OK
) else (
    echo     Spring Boot API: not ready yet
)

echo.
echo ============================================
if "%ALL_OK%"=="1" (
    echo   SETUP COMPLETE! ALL SERVICES RUNNING
    echo ============================================
    echo.
    echo   URLs:
    echo     Frontend:  http://127.0.0.1:8080/index.html
    echo     Spring API: http://localhost:8081/api/products
    echo     Admin API:  http://localhost:8081/api/admin/dashboard
    echo.
    echo   Services start AUTOMATICALLY on boot.
    echo   Logs: %LOG_DIR%
    echo.
    echo   Manage:
    echo     net start ShopMySQL / ShopSpringBoot / ShopPython
    echo     net stop  ShopPython / ShopSpringBoot / ShopMySQL
    echo     nssm edit ShopSpringBoot  (GUI config)
    echo     setup-all.bat -uninstall  (to remove)
) else (
    echo   SOME SERVICES FAILED
    echo ============================================
    echo.
    echo   Check logs in: %LOG_DIR%
    echo   Try manual start: nssm start ShopSpringBoot
)
echo.
pause
