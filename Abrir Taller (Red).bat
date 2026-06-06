@echo off
title WorkFlow Taller - Acceso Remoto
color 0B

echo.
echo  =========================================
echo    WORKFLOW TALLER - Acceso en Red
echo  =========================================
echo.
echo  Conectando al servidor del taller...
echo  Servidor: 192.168.1.174:8080
echo.

:: Verificar si el servidor esta disponible
ping -n 1 192.168.1.174 >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  ERROR: No se puede alcanzar el servidor.
    echo.
    echo  Asegurate de que:
    echo  1. La computadora del taller este encendida
    echo  2. El servidor este iniciado (Iniciar Taller.bat)
    echo  3. Ambas PCs esten en la misma red WiFi
    echo.
    pause
    exit
)

echo  Servidor encontrado! Abriendo navegador...
echo.
start "" "http://192.168.1.174:8080"
echo  Si el navegador no abre automaticamente, ve a:
echo  http://192.168.1.174:8080
echo.
timeout /t 5 /nobreak >nul
exit
