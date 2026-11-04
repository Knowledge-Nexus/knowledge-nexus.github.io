@echo off
chcp 65001 >nul
title Knowledge Nexus: a vigiar o deposito
echo A vigiar o deposito (Ctrl+C para parar). Nao feches esta janela.
echo.
rem Corre a partir da pasta onde este .bat esta (a da aplicacao), em qualquer PC e em
rem qualquer pasta. Se o .bat for uma copia solta, usa a aplicacao em ~/nexus no Ubuntu.
rem Para usar outra distribuicao do WSL: set NEXUS_WSL=<nome> antes de o abrir.
set "DISTRO="
if defined NEXUS_WSL set "DISTRO=-d %NEXUS_WSL%"
wsl.exe %DISTRO% --cd "%~dp0." -- bash -lic "for d in . ~/nexus; do if [ -f $d/scripts/vigiar-deposito.sh ]; then cd $d; sed -i 's/\r$//' scripts/vigiar-deposito.sh; exec bash scripts/vigiar-deposito.sh; fi; done; echo 'Nao encontrei a aplicacao: poe este .bat na pasta knowledge-nexus.github.io.'"
echo.
echo A vigilancia terminou.
pause
