@echo off
title WorkFlow Taller - Servidor Local
color 0A

echo.
echo  =========================================
echo    WORKFLOW TALLER - Iniciando servidor...
echo  =========================================
echo.
echo  Abre tu navegador en:
echo  http://localhost:8080
echo.
echo  Presiona Ctrl+C para detener el servidor.
echo  =========================================
echo.

:: Abrir el navegador automaticamente despues de 2 segundos
start "" timeout /t 2 /nobreak >nul
start "" "http://localhost:8080"

:: Iniciar el servidor web con Python
cd /d "g:\Mi unidad\Microcontroladores Proyectos\WorkFlowTaller"
python -m http.server 8080

pause
