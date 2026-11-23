@echo off
chcp 65001 >nul
title Knowledge Nexus: a vigiar o deposito
echo A vigiar o deposito (Ctrl+C para parar). Nao feches esta janela.
echo.
rem Corre a partir da pasta onde este .bat esta (a da aplicacao), em qualquer PC e em
rem qualquer pasta. Se o .bat for uma copia solta, usa a aplicacao em ~/nexus no Ubuntu.
rem Para usar outra distribuicao do WSL: set NEXUS_WSL=<nome> antes de o abrir.
rem --exec: o comando vai directo para o bash (sem --exec, uma primeira shell apagava as
rem variaveis do comando antes de ele correr).
set "DISTRO="
set "REINICIOS=0"
if defined NEXUS_WSL set "DISTRO=-d %NEXUS_WSL%"
:arrancar
wsl.exe %DISTRO% --cd "%~dp0." --exec bash -lic "if [ -f scripts/vigiar-deposito.sh ]; then sed -i 's/\r$//' scripts/vigiar-deposito.sh; exec bash scripts/vigiar-deposito.sh; elif [ -f ~/nexus/scripts/vigiar-deposito.sh ]; then exec bash ~/nexus/scripts/vigiar-deposito.sh; else echo 'Nao encontrei a aplicacao: poe este .bat na pasta knowledge-nexus.github.io.'; fi"
set "CODIGO=%ERRORLEVEL%"
rem 76: o Ubuntu deixou de conseguir ler o proprio disco (Input/output error, quase sempre
rem depois de o Windows suspender ou hibernar); 135: o processo morreu com "Bus error" pelo
rem mesmo motivo. So se resolve reiniciando o WSL. O mesmo .bat serve em qualquer PC.
if "%CODIGO%"=="76" goto reiniciar
if "%CODIGO%"=="135" goto reiniciar
echo.
echo A vigilancia terminou.
pause
exit /b

:reiniciar
set /a REINICIOS+=1
if %REINICIOS% GEQ 5 (
  echo.
  echo O WSL ja foi reiniciado 4 vezes e o disco do Ubuntu continua a falhar.
  echo Ve o espaco livre no disco C: e docs\configuracao.md, seccao 4.1.
  pause
  exit /b
)
echo.
echo O Ubuntu deixou de conseguir ler o disco. A reiniciar o WSL e a vigilancia...
wsl.exe --shutdown
timeout /t 8 /nobreak >nul
goto arrancar
