#!/usr/bin/env bash
# Vigia o depósito e processa cada envio da interface (`nexus servir`), em qualquer PC:
# a aplicação é a pasta onde este script está (pode ser uma pasta do Windows, /mnt/c/...),
# e o repositório de dados encontra-se sozinho (ou clona-se da primeira vez).
# É o que o vigiar-deposito.bat corre no Ubuntu (WSL).
#
# Variáveis (opcionais):
#   NEXUS_DADOS=/caminho          pasta do repositório de dados
#   NEXUS_REPOSITORIO=dono/nome   repositório de dados a clonar (Knowledge-Nexus/estudo-dados)
set -u

cd "$(dirname "$0")/.." || exit 1
APP="$PWD"

# Numa pasta do Windows, o Git do Ubuntu trata os fins de linha como o do Windows (senão vê
# todos os ficheiros alterados e não actualiza) e confia na pasta (é de outro "dono").
git_app() { git -c safe.directory="$APP" "$@"; }
case "$APP" in
  /mnt/*) git_app config core.autocrlf true ;;
esac

[ -x "$HOME/.local/bin/uv" ] && export PATH="$HOME/.local/bin:$PATH"
if ! command -v uv >/dev/null 2>&1; then
  echo "Falta o uv neste Ubuntu. Instala-o com:"
  echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
  echo "e abre o .bat de novo."
  exit 1
fi
if ! command -v tesseract >/dev/null 2>&1; then
  echo "Aviso: falta o OCR neste Ubuntu (os PDFs digitalizados ficam sem texto). Instala com:"
  echo "  sudo apt install tesseract-ocr tesseract-ocr-por tesseract-ocr-eng pandoc p7zip-full \\"
  echo "    libreoffice-writer-nogui libreoffice-impress-nogui libreoffice-calc-nogui"
  echo
fi

# O ambiente Python fica no disco do Ubuntu: mais rápido do que numa pasta do Windows e sem
# se misturar com nada do Windows.
export UV_PROJECT_ENVIRONMENT="${UV_PROJECT_ENVIRONMENT:-$HOME/.cache/knowledge-nexus/venv}"
[ -d "$UV_PROJECT_ENVIRONMENT" ] ||
  echo "Primeira vez neste PC: a preparar o ambiente (pode demorar uns minutos)."

# O repositório de dados: NEXUS_DADOS, ~/dados, ou uma pasta estudo-dados (ou dados) ao lado
# da aplicação.
DADOS="${NEXUS_DADOS:-}"
if [ -z "$DADOS" ]; then
  for candidate in "$HOME/dados" "$APP/../estudo-dados" "$APP/../dados"; do
    if [ -d "$candidate/.git" ]; then
      DADOS="$(cd "$candidate" && pwd)"
      break
    fi
  done
fi
if [ -z "$DADOS" ]; then
  REPO="${NEXUS_REPOSITORIO:-Knowledge-Nexus/estudo-dados}"
  echo "Não encontrei o repositório de dados neste PC."
  read -r -p "Clonar $REPO para ~/dados agora? [s/N] " answer
  case "$answer" in
    s | S | sim | Sim) ;;
    *)
      echo "Sem o repositório de dados não há nada para vigiar."
      echo "Se já o tens noutra pasta, define NEXUS_DADOS no ~/.bashrc."
      exit 1
      ;;
  esac
  # Com o Git do Windows instalado, o login no GitHub faz-se no browser e fica guardado no
  # Windows (Git Credential Manager); sem ele, o git pede o utilizador e um token.
  helper=()
  for gcm in "/mnt/c/Program Files/Git/mingw64/bin/git-credential-manager.exe" \
    "/mnt/c/Program Files/Git/mingw64/libexec/git-core/git-credential-manager.exe"; do
    if [ -x "$gcm" ]; then
      helper=(-c "credential.helper=${gcm// /\\ }")
      break
    fi
  done
  git "${helper[@]}" clone --filter=blob:none "https://github.com/$REPO.git" "$HOME/dados" ||
    exit 1
  [ ${#helper[@]} -gt 0 ] && git -C "$HOME/dados" config credential.helper "${gcm// /\\ }"
  DADOS="$HOME/dados"
fi

echo "Aplicação: $APP"
echo "Dados:     $DADOS"
echo

# Quando sai uma versão nova da aplicação, o nexus servir termina com o código 75: actualiza
# e volta a arrancar.
while true; do
  git_app pull -q --ff-only ||
    echo "Aviso: não consegui actualizar a aplicação; continua com esta versão."
  uv run --frozen --project "$APP" nexus servir --repo "$DADOS"
  code=$?
  [ "$code" -eq 75 ] || exit "$code"
  echo
  echo "Versão nova: a reiniciar."
done
