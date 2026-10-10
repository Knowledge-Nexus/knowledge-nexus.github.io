@echo off
chcp 65001 >nul
title Knowledge Nexus: a vigiar o deposito
echo A vigiar o deposito (Ctrl+C para parar). Nao feches esta janela.
echo.
rem Quando sai uma versao nova, o nexus servir termina com o codigo 75: actualiza e volta a arrancar.
wsl.exe -d Ubuntu -- bash -lic "cd ~/nexus && while git pull -q --ff-only; uv run nexus servir --repo ~/dados; [ $? -eq 75 ]; do echo; echo 'Versao nova: a reiniciar.'; done"
echo.
echo A vigilancia terminou.
pause
