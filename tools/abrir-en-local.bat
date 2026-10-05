@echo off
rem Abre Career Board en http://localhost:5500
rem (el login con Google de Firebase no funciona abriendo index.html con doble clic; necesita una direccion http).
title Career Board - servidor local
cd /d "%~dp0.."
echo.
echo  Career Board en http://localhost:5500
echo  Deja esta ventana abierta mientras uses la app. Cierrala para apagarla.
echo.
start "" "http://localhost:5500"
python -m http.server 5500
