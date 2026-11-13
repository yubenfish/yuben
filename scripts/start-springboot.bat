@echo off
REM start-springboot.bat — 从 backend 目录运行 JAR（前台日志可看）
cd /d "%~dp0backend"
java -jar "target\ecommerce-demo-1.0.0.jar" --spring.profiles.active=mysql --server.port=8081
