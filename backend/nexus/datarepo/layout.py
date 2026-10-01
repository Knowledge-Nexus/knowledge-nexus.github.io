"""Layout do repositório de dados privado (ver docs/repo-dados.md)."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

ERRORS_DIR = "_erros"
REF_SUFFIX = ".ref.yaml"
# Ficheiros grandes enviados pelo browser chegam em partes (a API do GitHub recusa blobs
# grandes): `<nome>.nexus-parts.yaml` + `<nome>.nexus-part-0001`, `-0002`…
PARTS_SUFFIX = ".nexus-parts.yaml"
PART_MARK = ".nexus-part-"
# Lote: muitos ficheiros enviados juntos num zip (menos pedidos à API do GitHub).
LOTE_SUFFIX = ".nexus-lote.zip"
LOG_SUFFIX = ".log"


@dataclass(frozen=True)
class Layout:
    root: Path

    @property
    def settings_file(self) -> Path:
        return self.root / "nexus.yaml"

    @property
    def catalog_dir(self) -> Path:
        return self.root / "catalogo"

    @property
    def vocab_file(self) -> Path:
        return self.catalog_dir / "vocabularios.yaml"

    @property
    def requests_dir(self) -> Path:
        """Pedidos de alteração ao catálogo feitos pela interface (processados e apagados)."""
        return self.catalog_dir / "_importar"

    @property
    def users_dir(self) -> Path:
        return self.root / "utilizadores"

    @property
    def groups_dir(self) -> Path:
        return self.root / "grupos"

    @property
    def deposit_root(self) -> Path:
        return self.root / "deposito"

    @property
    def originals_root(self) -> Path:
        return self.root / "originais"

    @property
    def documents_dir(self) -> Path:
        return self.root / "documentos"

    @property
    def text_root(self) -> Path:
        return self.root / "texto"

    @property
    def proposals_dir(self) -> Path:
        return self.root / "revisao" / "propostas"

    @property
    def generated_root(self) -> Path:
        return self.root / "gerado"

    def deposit_dir(self, login: str) -> Path:
        return self.deposit_root / login

    def errors_dir(self, login: str) -> Path:
        return self.deposit_dir(login) / ERRORS_DIR

    def original_path(self, sha256: str, ext: str) -> Path:
        name = f"{sha256}.{ext}" if ext else sha256
        return self.originals_root / sha256[:2] / name

    def find_original(self, sha256: str) -> Path | None:
        folder = self.originals_root / sha256[:2]
        if not folder.is_dir():
            return None
        return next(iter(sorted(folder.glob(f"{sha256}*"))), None)

    def text_dir(self, sha256: str) -> Path:
        return self.text_root / sha256

    def document_path(self, document_id: str) -> Path:
        return self.documents_dir / f"{document_id}.yaml"

    def user_path(self, login: str) -> Path:
        return self.users_dir / f"{login}.yaml"

    def relative(self, path: Path) -> str:
        return path.relative_to(self.root).as_posix()
