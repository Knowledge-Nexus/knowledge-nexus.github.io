#!/usr/bin/env bash
# Knowledge Nexus num Raspberry Pi (ou noutro Linux com systemd): instala o `nexus servir`
# como serviço, para os depósitos serem processados sem o computador ligado. Faz o mesmo
# que o vigiar-deposito.bat, mas arranca sozinho com o Pi e actualiza-se sozinho.
#
#   bash instalar.sh --verificar     só mostra se o Pi serve e o que mais lá corre
#   bash instalar.sh                 instala ou actualiza (pode correr-se as vezes que for preciso)
#   bash instalar.sh --desinstalar   pára e retira o serviço (os dados ficam)
#
#   --repo dono/nome   repositório de dados (por defeito Knowledge-Nexus/estudo-dados)
#   --sim              não pergunta antes de continuar
#
# Fica tudo à parte do resto do Pi: um utilizador próprio (nexus), as pastas dele
# (/home/nexus/nexus e /home/nexus/dados), o Python dele (uv) e um serviço com prioridade
# baixa no processador e no disco. Não mexe no Node, no npm, no cron nem em mais nenhuma
# pasta; só acrescenta programas do sistema (OCR, Pandoc, LibreOffice).
set -euo pipefail

APP_URL="https://github.com/Knowledge-Nexus/knowledge-nexus.github.io.git"
DATA_REPO="Knowledge-Nexus/estudo-dados"
USER_NAME="nexus"
SERVICE="knowledge-nexus"
ENV_DIR="/etc/knowledge-nexus"
ENV_FILE="$ENV_DIR/ambiente"
UNIT_FILE="/etc/systemd/system/$SERVICE.service"
# Chave pública do GitHub (https://docs.github.com/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints).
GITHUB_HOST_KEY="github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl"
MODE="instalar"
ASSUME_YES=0

while [ $# -gt 0 ]; do
  case "$1" in
    --repo) DATA_REPO="${2:?falta dono/nome depois de --repo}"; shift 2 ;;
    --verificar) MODE="verificar"; shift ;;
    --desinstalar) MODE="desinstalar"; shift ;;
    --sim | -y) ASSUME_YES=1; shift ;;
    -h | --ajuda) sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "opção desconhecida: $1 (vê --ajuda)" >&2; exit 2 ;;
  esac
done

HOME_DIR="/home/$USER_NAME"
APP_DIR="$HOME_DIR/nexus"
DATA_DIR="$HOME_DIR/dados"
UV="$HOME_DIR/.local/bin/uv"
KEY="$HOME_DIR/.ssh/estudo-dados"
REMOTE="git@github-dados:$DATA_REPO.git"

say() { printf '\n\033[1;33m== %s\033[0m\n' "$*"; }
info() { printf '   %s\n' "$*"; }
warn() { printf '\033[1;31m   ! %s\033[0m\n' "$*"; }
ask() {
  [ "$ASSUME_YES" = 1 ] && return 0
  local answer
  read -rp "   $1 [s/N] " answer
  [[ "$answer" =~ ^[sS] ]]
}
# Corre como o utilizador nexus, na pasta dele, com o uv no caminho.
as_nexus() {
  runuser -u "$USER_NAME" -- env HOME="$HOME_DIR" USER="$USER_NAME" \
    PATH="$HOME_DIR/.local/bin:/usr/local/bin:/usr/bin:/bin" bash -c "cd ~ && $1"
}

cd /

RAM_MB=$(awk '/MemTotal/ {print int($2 / 1024)}' /proc/meminfo)
SWAP_MB=$(awk '/SwapTotal/ {print int($2 / 1024)}' /proc/meminfo)
CORES=$(nproc)
# Páginas de OCR em paralelo: deixa núcleos livres para o que mais corre no Pi.
if [ "$CORES" -ge 4 ] && [ "$RAM_MB" -ge 3500 ]; then OCR_WORKERS=2; else OCR_WORKERS=1; fi

verify() {
  say "Este computador"
  local model arch os free_gb
  model=$({ tr -d '\0' </proc/device-tree/model; } 2>/dev/null || echo "desconhecido")
  arch=$(uname -m)
  os=$(. /etc/os-release && echo "${PRETTY_NAME:-Linux}")
  free_gb=$(df -Pk /home | awk 'NR == 2 {print int($4 / 1024 / 1024)}')
  info "modelo: $model"
  info "sistema: $os ($arch), $CORES núcleos"
  info "memória: $RAM_MB MB (mais $SWAP_MB MB de swap)"
  info "espaço livre em /home: $free_gb GB"
  VERIFY_OK=1
  case "$arch" in
    aarch64 | x86_64) ;;
    *) warn "é preciso um sistema de 64 bits; este é $arch (o leitor de PDF não existe para ele)."
       warn "No DietPi, instala a imagem «ARMv8 64-bit»."
       VERIFY_OK=0 ;;
  esac
  if ! command -v systemctl >/dev/null; then warn "sem systemd: este instalador não serve."; VERIFY_OK=0; fi
  if [ "$RAM_MB" -lt 1800 ]; then
    warn "pouca memória: o OCR e o LibreOffice ficam muito lentos ou falham. Aconselho 2 GB ou mais."
  fi
  if [ "$SWAP_MB" -lt 1000 ] && [ "$RAM_MB" -lt 4000 ]; then
    warn "aconselho 1 GB de swap ou mais (DietPi: dietpi-config → Advanced Options → Swap file)."
  fi
  if [ "$free_gb" -lt 10 ]; then
    warn "pouco espaço: o repositório de dados ocupa uns 6 GB (e vai crescendo). Aconselho 10 GB livres."
  fi

  say "O que mais corre aqui (o Knowledge Nexus fica com prioridade mais baixa do que isto)"
  local services
  services=$(systemctl list-units --type=service --state=running --no-legend --plain 2>/dev/null |
    awk '{print $1}' |
    grep -vE '^(systemd-|dbus|getty|serial-getty|user@|ssh|dropbear|cron|rsyslog|ifup|networking|wpa_supplicant|dhcpcd|avahi|chrony|polkit|rng-tools|haveged|triggerhappy|bluetooth|ModemManager|NetworkManager|unattended-upgrades|'"$SERVICE"')' || true)
  info "serviços: $(printf '%s' "${services:-nenhum além dos do sistema}" | paste -sd' ')"
  local jobs=""
  for u in root $(ls /home 2>/dev/null); do
    jobs+=$(crontab -l -u "$u" 2>/dev/null | grep -vE '^\s*(#|$)' | sed "s|^|$u: |" || true)
    jobs+=$'\n'
  done
  jobs=$(printf '%s' "$jobs" | sed '/^$/d')
  if [ -n "$jobs" ]; then info "tarefas agendadas (cron):"; printf '%s\n' "$jobs" | sed 's/^/     /'; else info "tarefas agendadas (cron): nenhuma"; fi
  info "o que mais usa o processador agora (% processador, % memória, programa):"
  ps -eo pcpu,pmem,comm --sort=-pcpu | sed -n '2,6p' | sed 's/^/     /' || true
  info "carga: $(cut -d' ' -f1-3 /proc/loadavg) (1, 5 e 15 minutos)"

  say "O que o Knowledge Nexus vai usar"
  info "utilizador próprio «$USER_NAME»: $APP_DIR (aplicação) e $DATA_DIR (repositório de dados)"
  info "OCR com $OCR_WORKERS página(s) de cada vez, prioridade baixa (nice 15, disco em «idle»)"
  info "rede: uma pergunta pequena ao GitHub a cada 30 s; downloads só ao instalar e ao processar"
  info "não abre portas nem mexe no Node, no npm, no cron ou noutras pastas"
}

uninstall() {
  say "A retirar o serviço"
  systemctl disable --now "$SERVICE" 2>/dev/null || true
  rm -f "$UNIT_FILE"
  systemctl daemon-reload
  info "Pronto. Os dados ficam em $HOME_DIR e as credenciais em $ENV_FILE."
  info "Para apagar tudo: userdel -r $USER_NAME && rm -r $ENV_DIR"
}

uses_r2() { grep -qE '^\s*backend:\s*r2' "$DATA_DIR/nexus.yaml" 2>/dev/null; }

# Uma linha VAR=valor no ficheiro do ambiente (sem passar por sed: os valores podem ter /, & ou |).
set_env() {
  local tmp
  tmp=$(mktemp)
  grep -vE "^$1=" "$ENV_FILE" >"$tmp" || true
  printf '%s=%s\n' "$1" "$2" >>"$tmp"
  install -m 600 -o root -g root "$tmp" "$ENV_FILE"
  rm -f "$tmp"
}
env_value() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2-; }

install_all() {
  say "Programas do sistema (OCR, Pandoc, LibreOffice): só se acrescentam"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq --no-install-recommends \
    git curl ca-certificates openssh-client \
    tesseract-ocr tesseract-ocr-por tesseract-ocr-eng pandoc \
    libreoffice-writer-nogui libreoffice-impress-nogui libreoffice-calc-nogui \
    fonts-dejavu-core fonts-liberation2 libarchive-tools p7zip-full >/dev/null

  say "Utilizador «$USER_NAME» e a aplicação"
  id "$USER_NAME" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$USER_NAME"
  install -d -o "$USER_NAME" -g "$USER_NAME" "$HOME_DIR/tmp"
  if [ ! -x "$UV" ]; then
    as_nexus 'curl -LsSf https://astral.sh/uv/install.sh | env UV_NO_MODIFY_PATH=1 sh >/dev/null'
  fi
  if [ -d "$APP_DIR/.git" ]; then
    as_nexus "git -C '$APP_DIR' pull -q --ff-only"
  else
    as_nexus "git clone -q '$APP_URL' '$APP_DIR'"
  fi
  info "a preparar o Python (da primeira vez demora uns minutos)"
  as_nexus "cd '$APP_DIR' && uv sync -q --no-dev --python 3.12"
  as_nexus "cd '$APP_DIR' && uv run -q --no-dev nexus verificar" || true

  say "Acesso ao repositório de dados ($DATA_REPO)"
  as_nexus "install -d -m 700 ~/.ssh"
  [ -f "$KEY" ] || as_nexus "ssh-keygen -q -t ed25519 -N '' -C 'knowledge-nexus em $(hostname)' -f '$KEY'"
  as_nexus "printf 'Host github-dados\n  HostName github.com\n  User git\n  IdentityFile ~/.ssh/estudo-dados\n  IdentitiesOnly yes\n' > ~/.ssh/config && chmod 600 ~/.ssh/config"
  as_nexus "grep -qF '$GITHUB_HOST_KEY' ~/.ssh/known_hosts 2>/dev/null || echo '$GITHUB_HOST_KEY' >> ~/.ssh/known_hosts"
  until as_nexus "git ls-remote '$REMOTE' HEAD >/dev/null 2>&1"; do
    info "Este Pi precisa de uma chave para ler e gravar no repositório de dados (só nesse):"
    info "1. Abre https://github.com/$DATA_REPO/settings/keys/new"
    info "2. Title: Raspberry Pi. Em «Key», cola a linha abaixo (é pública, pode copiar-se)."
    info "3. Marca «Allow write access» e carrega em «Add key»."
    echo
    cat "$KEY.pub"
    echo
    read -rp "   Quando estiver feito, carrega em Enter (Ctrl+C para sair)... " _
  done
  info "acesso confirmado"
  if [ ! -d "$DATA_DIR/.git" ]; then
    info "a trazer o repositório de dados: só a versão actual, sem o histórico (uns 3 GB; pode levar"
    info "um bom bocado, conforme a rede)"
    as_nexus "git clone -q --filter=blob:none '$REMOTE' '$DATA_DIR'"
  else
    as_nexus "git -C '$DATA_DIR' remote set-url origin '$REMOTE'"
  fi

  say "Definições deste Pi ($ENV_FILE, só o root as lê)"
  install -d -m 755 "$ENV_DIR"
  if [ ! -f "$ENV_FILE" ]; then
    install -m 600 -o root -g root /dev/null "$ENV_FILE"
    printf '%s\n' \
      "# Knowledge Nexus neste Pi. Depois de mudar: systemctl restart $SERVICE" \
      "# Credenciais do Cloudflare R2 (docs/configuracao.md, 4.2)." >"$ENV_FILE"
  fi
  [ -n "$(env_value NEXUS_OCR_WORKERS)" ] || set_env NEXUS_OCR_WORKERS "$OCR_WORKERS"
  if uses_r2; then
    local value
    for var in NEXUS_R2_ENDPOINT NEXUS_R2_ACCESS_KEY_ID NEXUS_R2_SECRET_ACCESS_KEY; do
      [ -n "$(env_value "$var")" ] && continue
      if [ "$var" = NEXUS_R2_ENDPOINT ]; then
        read -rp "   $var (https://….r2.cloudflarestorage.com; Enter para deixar para depois): " value
      else
        read -rsp "   $var (não aparece ao colar; Enter para deixar para depois): " value
        echo
      fi
      [ -n "$value" ] && set_env "$var" "$value"
    done
    for var in NEXUS_R2_ENDPOINT NEXUS_R2_ACCESS_KEY_ID NEXUS_R2_SECRET_ACCESS_KEY; do
      [ -n "$(env_value "$var")" ] || warn "falta $var: os ficheiros novos esperam no depósito até a pores em $ENV_FILE"
    done
  fi

  say "Serviço «$SERVICE» (arranca com o Pi)"
  cat >"$UNIT_FILE" <<EOF
# Instalado por scripts/raspberry-pi/instalar.sh (Knowledge Nexus). Corre-o outra vez para actualizar.
[Unit]
Description=Knowledge Nexus: vigiar o depósito e processar o que chega
Wants=network-online.target
After=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=$USER_NAME
Group=$USER_NAME
WorkingDirectory=$APP_DIR
EnvironmentFile=-$ENV_FILE
Environment=PATH=$HOME_DIR/.local/bin:/usr/local/bin:/usr/bin:/bin
Environment=PYTHONUNBUFFERED=1
# Ficheiros temporários no disco (no DietPi, /tmp fica na memória).
Environment=TMPDIR=$HOME_DIR/tmp
# Versão nova da aplicação: o servir sai (código 75), o systemd volta a arrancá-lo e este pull
# traz a versão nova. Sem rede, arranca com a que tem.
ExecStartPre=-/usr/bin/git -C $APP_DIR pull -q --ff-only
ExecStart=$UV run -q --no-dev nexus servir --repo $DATA_DIR
Restart=always
RestartSec=10
KillSignal=SIGINT
TimeoutStopSec=60
# Partilha o Pi com outros projectos: cede-lhes o processador, o disco e a memória.
Nice=15
IOSchedulingClass=idle
CPUWeight=20
MemoryHigh=$((RAM_MB * 60 / 100))M

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable -q "$SERVICE"
  systemctl restart "$SERVICE"
  sleep 5
  systemctl --no-pager --lines=0 status "$SERVICE" | sed -n '1,4p' || true
  journalctl -u "$SERVICE" -n 8 --no-pager -o cat || true

  say "Pronto"
  info "Ver o que está a fazer:   journalctl -u $SERVICE -f      (Ctrl+C sai da vista, não pára nada)"
  info "Parar / voltar a arrancar: systemctl stop $SERVICE  /  systemctl start $SERVICE"
  info "Mudar as definições:       nano $ENV_FILE   e depois   systemctl restart $SERVICE"
  info "Fecha o vigiar-deposito.bat no computador: basta um a processar."
}

case "$MODE" in
  verificar) verify ;;
  desinstalar)
    [ "$(id -u)" = 0 ] || { echo "corre como root (ou com sudo)" >&2; exit 1; }
    uninstall ;;
  instalar)
    [ "$(id -u)" = 0 ] || { echo "corre como root (ou com sudo)" >&2; exit 1; }
    verify
    [ "$VERIFY_OK" = 1 ] || { warn "Este computador não serve para o Knowledge Nexus."; exit 1; }
    echo
    ask "Instalar (ou actualizar) o Knowledge Nexus aqui?" || { info "nada foi alterado"; exit 0; }
    install_all ;;
esac
