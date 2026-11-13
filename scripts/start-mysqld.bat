@echo off
REM start-mysqld.bat — 直接启动（后台独立进程）
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="C:\ProgramData\MySQL\MySQL Server 8.4\Data" --bind-address=127.0.0.1
