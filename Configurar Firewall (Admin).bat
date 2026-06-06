@echo off
:: Este archivo debe ejecutarse como Administrador
title Configurar Firewall - WorkFlow Taller

echo Abriendo puerto 8080 (Web) en el Firewall de Windows...
netsh advfirewall firewall add rule name="WorkFlow Taller Puerto 8080" dir=in action=allow protocol=TCP localport=8080

echo Abriendo puerto 3000 (WhatsApp Bot) en el Firewall de Windows...
netsh advfirewall firewall add rule name="WhatsApp Bot Puerto 3000" dir=in action=allow protocol=TCP localport=3000

if errorlevel 1 (
    echo.
    echo ERROR: Ejecuta este archivo como Administrador.
    echo Clic derecho ^> "Ejecutar como administrador"
) else (
    echo.
    echo Puertos 8080 y 3000 habilitados correctamente.
    echo El celular ya puede acceder a la pagina y al bot.
)
echo.
pause
