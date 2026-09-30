#!/usr/bin/env bash
# SessionStart: prepara uma sessão do Claude Code (web ou WSL2) sobre este repositório.
# Instala o motor `nexus` e as ferramentas de extracção se faltarem. Idempotente.
set -euo pipefail

APP_REPOSITORY="$(grep -A2 '^app:' nexus.yaml | awk '/repository:/ {print $2}')"
APP_REF="$(grep -A3 '^app:' nexus.yaml | awk '/ref:/ {print $2}')"
APP_REPOSITORY="${APP_REPOSITORY:-Knowledge-Nexus/knowledge-nexus.github.io}"
APP_REF="${APP_REF:-main}"

if command -v apt-get >/dev/null 2>&1; then
  missing=()
  command -v tesseract >/dev/null || missing+=(tesseract-ocr tesseract-ocr-por tesseract-ocr-eng)
  command -v pandoc >/dev/null || missing+=(pandoc)
  command -v 7z >/dev/null || missing+=(p7zip-full)
  if [ ${#missing[@]} -gt 0 ]; then
    SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"
    $SUDO apt-get update -qq && $SUDO DEBIAN_FRONTEND=noninteractive \
      apt-get install -y -qq --no-install-recommends "${missing[@]}" >/dev/null || true
  fi
fi

if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh >/dev/null
  export PATH="$HOME/.local/bin:$PATH"
fi

uv tool install --force --python 3.12 \
  "nexus @ git+https://github.com/${APP_REPOSITORY}@${APP_REF}" >/dev/null 2>&1 || true

nexus verificar || true
