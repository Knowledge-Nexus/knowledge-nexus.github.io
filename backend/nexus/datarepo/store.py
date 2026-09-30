"""Acesso aos registos do repositório de dados (fonte de verdade em YAML/Markdown)."""

from __future__ import annotations

import json
from functools import cached_property
from pathlib import Path
from typing import Any

from nexus import FORMAT_VERSION, clock
from nexus.config import Settings, config_dir, load_settings
from nexus.datarepo.catalog_io import load_catalog
from nexus.datarepo.layout import Layout
from nexus.datarepo.yamlio import read_yaml, write_yaml_if_changed
from nexus.domain.catalog import Catalog
from nexus.domain.documents import Document
from nexus.domain.extraction import ExtractionMeta
from nexus.domain.proposals import CatalogProposal
from nexus.domain.users import Group, User
from nexus.domain.vocab import Vocabularies

SETTINGS_RESERVED_KEYS = {"format_version", "app"}


class DataRepoError(RuntimeError):
    pass


class DataRepo:
    """Vista em memória de um repositório de dados. Carrega de forma preguiçosa."""

    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.layout = Layout(self.root)

    # --- configuração ---------------------------------------------------------------

    @cached_property
    def raw_settings(self) -> dict[str, Any]:
        if not self.layout.settings_file.exists():
            return {}
        data = read_yaml(self.layout.settings_file)
        return data if isinstance(data, dict) else {}

    @property
    def format_version(self) -> int:
        return int(self.raw_settings.get("format_version", FORMAT_VERSION))

    @cached_property
    def settings(self) -> Settings:
        overrides = {k: v for k, v in self.raw_settings.items() if k not in SETTINGS_RESERVED_KEYS}
        return load_settings(overrides)

    def is_initialized(self) -> bool:
        return self.layout.settings_file.exists()

    def check_format(self) -> None:
        if not self.is_initialized():
            raise DataRepoError(
                f"{self.root} não é um repositório de dados (falta nexus.yaml). "
                "Corre `nexus scaffold` primeiro."
            )
        if self.format_version > FORMAT_VERSION:
            raise DataRepoError(
                f"O repositório usa o formato {self.format_version}, mas este motor só conhece "
                f"até ao {FORMAT_VERSION}. Actualiza o nexus."
            )
        if self.format_version < FORMAT_VERSION:
            raise DataRepoError(
                f"O repositório usa o formato {self.format_version}; corre `nexus migrar`."
            )

    # --- vocabulários e catálogo ------------------------------------------------------

    @cached_property
    def vocabularies(self) -> Vocabularies:
        path = self.layout.vocab_file
        if not path.exists():
            path = config_dir() / "vocabularios.yaml"
        return Vocabularies.model_validate(read_yaml(path))

    @cached_property
    def catalog(self) -> Catalog:
        return load_catalog(self.layout)

    def reload_catalog(self) -> None:
        self.__dict__.pop("catalog", None)

    # --- utilizadores e grupos --------------------------------------------------------

    @cached_property
    def users(self) -> dict[str, User]:
        out: dict[str, User] = {}
        for path in sorted(self.layout.users_dir.glob("*.yaml")):
            user = User.model_validate(read_yaml(path))
            out[user.login] = user
        return out

    def ensure_user(self, login: str) -> User:
        user = self.users.get(login)
        if user is None:
            user = User(login=login, created_at=clock.now())
            self.users[login] = user
            write_yaml_if_changed(self.layout.user_path(login), user)
        return user

    @cached_property
    def groups(self) -> dict[str, Group]:
        out: dict[str, Group] = {}
        for path in sorted(self.layout.groups_dir.glob("*.yaml")):
            group = Group.model_validate(read_yaml(path))
            out[group.slug] = group
        return out

    # --- documentos ---------------------------------------------------------------------

    @cached_property
    def documents(self) -> dict[str, Document]:
        out: dict[str, Document] = {}
        for path in sorted(self.layout.documents_dir.glob("*.yaml")):
            doc = Document.model_validate(read_yaml(path))
            out[doc.id] = doc
        return out

    def find_document(self, owner: str, sha256: str) -> Document | None:
        return next(
            (d for d in self.documents.values() if d.owner == owner and d.blob.sha256 == sha256),
            None,
        )

    def save_document(self, doc: Document) -> bool:
        self.documents[doc.id] = doc
        return write_yaml_if_changed(self.layout.document_path(doc.id), doc)

    # --- propostas ----------------------------------------------------------------------

    @cached_property
    def proposals(self) -> dict[str, CatalogProposal]:
        out: dict[str, CatalogProposal] = {}
        for path in sorted(self.layout.proposals_dir.glob("*.yaml")):
            proposal = CatalogProposal.model_validate(read_yaml(path))
            out[proposal.id] = proposal
        return out

    def save_proposal(self, proposal: CatalogProposal) -> bool:
        self.proposals[proposal.id] = proposal
        return write_yaml_if_changed(self.layout.proposals_dir / f"{proposal.id}.yaml", proposal)

    # --- texto extraído -----------------------------------------------------------------

    def extraction_meta(self, sha256: str) -> ExtractionMeta | None:
        path = self.layout.text_dir(sha256) / "meta.json"
        if not path.exists():
            return None
        return ExtractionMeta.model_validate(json.loads(path.read_text(encoding="utf-8")))

    def page_texts(self, sha256: str) -> list[str]:
        pages_dir = self.layout.text_dir(sha256) / "paginas"
        return [p.read_text(encoding="utf-8") for p in sorted(pages_dir.glob("*.md"))]
