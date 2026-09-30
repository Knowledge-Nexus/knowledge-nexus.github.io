from __future__ import annotations

import uuid
from pathlib import Path

import pytest
from conftest import ROOT

from nexus.config import load_settings
from nexus.datarepo.catalog_io import CatalogError, export_bundle, import_bundle, load_catalog
from nexus.datarepo.layout import Layout
from nexus.datarepo.yamlio import dump_yaml, read_yaml
from nexus.domain.common import uuid7
from nexus.domain.documents import Document, FieldValue
from nexus.domain.text import normalize, slugify
from nexus.formats import migrate


@pytest.mark.parametrize(("a", "b"), [
    ("Ano Lectivo", "ano letivo"),
    ("Correcção", "correção"),
    ("Óptimo", "ótimo"),
    ("projecto", "projeto"),
    ("Exame — Época de Recurso", "exame epoca de recurso"),
    ("1.ª época", "1a epoca"),
    ("AM1", "am 1"),
])
def test_normalize_unifies_spellings(a: str, b: str) -> None:
    assert normalize(a) == normalize(b)


def test_slugify() -> None:
    assert slugify("Análise Matemática I") == "analise-matematica-i"
    assert slugify("   ") == "sem-nome"


def test_uuid7_is_version_7_and_sortable() -> None:
    first, second = uuid7(), uuid7()
    assert uuid.UUID(first).version == 7
    assert first[:8] <= second[:8]


def test_settings_merge_overrides() -> None:
    settings = load_settings({"classification": {"auto_file_threshold": 0.9}})
    assert settings.classification.auto_file_threshold == 0.9
    assert settings.classification.source_weights.filename == 1.0


def test_field_value_rejects_unknown_method() -> None:
    with pytest.raises(ValueError):
        FieldValue(value="x", method="magic")
    assert FieldValue(value="x", method="ai:claude-code").method == "ai:claude-code"


def test_document_visibility_values() -> None:
    blob = {"sha256": "0" * 64, "size": 1, "ext": "pdf", "mime": "application/pdf"}
    with pytest.raises(ValueError):
        Document(id="x", owner="a", blob=blob, visibility="toda-a-gente")  # type: ignore[arg-type]
    assert Document(id="x", owner="a", blob=blob).visibility is None  # type: ignore[arg-type]
    assert Document(id="x", owner="a", blob=blob,  # type: ignore[arg-type]
                    visibility="public").visibility == "public"
    doc = Document(id="x", owner="a", blob=blob, visibility="group:estudo-am1")  # type: ignore[arg-type]
    assert doc.visibility == "group:estudo-am1"


def test_yaml_is_deterministic_and_keeps_unknown_fields() -> None:
    data = {"b": 1, "a": "linha 1\nlinha 2", "c": "Época"}
    assert dump_yaml(data) == dump_yaml(data)
    assert "Época" in dump_yaml(data)
    blob = {"sha256": "0" * 64, "size": 1, "ext": "pdf", "mime": "application/pdf"}
    doc = Document.model_validate({"id": "x", "owner": "a", "blob": blob, "futuro": 42})
    assert doc.model_dump()["futuro"] == 42


def test_catalog_import_is_idempotent(data_root: Path) -> None:
    layout = Layout(data_root)
    bundle = read_yaml(ROOT / "config" / "catalogo" / "exemplo.yaml")
    first = import_bundle(layout, bundle)
    assert "ufe/am1" in first.created
    second = import_bundle(layout, bundle)
    assert not second.created and not second.updated
    catalog = load_catalog(layout)
    assert catalog.units["ufe/am1"].name == "Análise Matemática I"
    assert [c.key for c in catalog.courses_of_unit("ufe/am1")] == ["ufe/lei"]
    exported = export_bundle(layout)
    assert exported["institutions"][0]["units"][0]["slug"]


def test_catalog_import_rejects_unknown_unit_reference(data_root: Path) -> None:
    bundle = {"format": "nexus-catalogo", "institutions": [{
        "slug": "x", "name": "X", "courses": [
            {"slug": "c", "name": "C", "units": [{"unit": "inexistente"}]}]}]}
    with pytest.raises(CatalogError):
        import_bundle(Layout(data_root), bundle)


def test_catalog_import_rejects_bad_slug(data_root: Path) -> None:
    bundle = {"format": "nexus-catalogo", "institutions": [{"slug": "Má Slug", "name": "X"}]}
    with pytest.raises(CatalogError):
        import_bundle(Layout(data_root), bundle)


def test_migrations_apply_in_order(data_root: Path) -> None:
    calls: list[int] = []
    layout = Layout(data_root)
    text = layout.settings_file.read_text().replace("format_version: 2", "format_version: 0")
    layout.settings_file.write_text(text)
    applied = migrate(data_root, target=1, migrations={0: lambda root: calls.append(0)})
    assert applied == [0] and calls == [0]
    assert read_yaml(layout.settings_file)["format_version"] == 1
