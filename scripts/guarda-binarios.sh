#!/usr/bin/env bash
# Falha se o repositório PÚBLICO tiver documentos binários commitados (possível material
# com direitos de autor). As amostras de teste são geradas em tempo de execução.
set -euo pipefail

pattern='\.(pdf|docx?|pptx?|xlsx?|odt|odp|ods|rtf|zip|rar|7z|heic|jpe?g|png|tiff?|db|sqlite3?)$'
allowed='^frontend/public/(brand/)?[^/]+\.(png|jpe?g|webp)$'

found="$(git ls-files | grep -Ei "$pattern" | grep -Ev "$allowed" || true)"
if [ -n "$found" ]; then
  echo "Ficheiros binários proibidos neste repositório público:" >&2
  echo "$found" >&2
  exit 1
fi
echo "ok: nenhum documento binário commitado"
