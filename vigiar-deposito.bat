@echo off
chcp 65001 >nul
title Knowledge Nexus: a vigiar o deposito
echo A vigiar o deposito (Ctrl+C para parar). Nao feches esta janela.
echo.
wsl.exe -d Ubuntu -- bash -lic "cd ~/nexus && git pull -q; uv run nexus servir --repo ~/dados"
echo.
echo A vigilancia terminou.
pause
