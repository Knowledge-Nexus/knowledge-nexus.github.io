from __future__ import annotations

import hashlib
import os
import shutil
import subprocess
from pathlib import Path

import pytest
from conftest import OWNER, deposit, requires_ocr

from amostras import gerar
from nexus.datarepo.store import DataRepo
from nexus.datarepo.yamlio import read_yaml
from nexus.domain.documents import DocumentKind, Status
from nexus.index.builder import build_indices, near_duplicate_pairs
from nexus.pipeline.run import Pipeline
from nexus.review import propose, resolve


def run(root: Path) -> Pipeline:
    pipeline = Pipeline(DataRepo(root))
    pipeline.run()
    return pipeline


def tree_digest(root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(p for p in root.rglob("*") if p.is_file() and ".git" not in p.parts):
        digest.update(path.relative_to(root).as_posix().encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()


def docs(root: Path) -> list[dict]:
    return [read_yaml(p) for p in sorted((root / "documentos").glob("*.yaml"))]


def test_exam_is_filed_and_leaves_deposit(catalog_root: Path) -> None:
    src = gerar.pdf_nativo(deposit(catalog_root, "AM1/Exame_Recurso_2023-24.pdf"),
                           gerar.EXAME_AM1)
    report = run(catalog_root).report
    assert not src.exists(), "o ficheiro deve sair do depósito depois de processado"
    assert len(report.new_documents) == 1 and report.filed == report.new_documents
    [doc] = docs(catalog_root)
    assert doc["status"] == "filed"
    assert doc["filed_name"] == "2023-2024_exame-recurso-2024-02-05-enunciado.pdf"
    sha = doc["blob"]["sha256"]
    assert (catalog_root / "originais" / sha[:2] / f"{sha}.pdf").exists()
    assert (catalog_root / "texto" / sha / "paginas" / "0001.md").exists()
    assert (catalog_root / "utilizadores" / f"{OWNER}.yaml").exists()


def test_second_run_changes_nothing(catalog_root: Path) -> None:
    gerar.pasta_exemplo(catalog_root / "deposito" / OWNER)
    run(catalog_root)
    before = tree_digest(catalog_root)
    report = run(catalog_root).report
    assert tree_digest(catalog_root) == before
    assert not report.new_documents and not report.extracted and not report.updated


def test_same_user_resend_is_deduplicated(catalog_root: Path) -> None:
    first = gerar.pdf_nativo(deposit(catalog_root, "exame.pdf"), gerar.EXAME_AM1)
    data = first.read_bytes()
    run(catalog_root)
    deposit(catalog_root, "copia/exame (1).pdf", batch="20251002T100000Z-bbbb").write_bytes(data)
    report = run(catalog_root).report
    assert report.new_documents == [] and len(report.new_sources) == 1
    [doc] = docs(catalog_root)
    assert len(doc["sources"]) == 2


def test_other_user_gets_own_logical_copy(catalog_root: Path) -> None:
    data = gerar.pdf_nativo(deposit(catalog_root, "exame.pdf"), gerar.EXAME_AM1).read_bytes()
    run(catalog_root)
    (catalog_root / "utilizadores" / "colega.yaml").write_text("login: colega\n")
    deposit(catalog_root, "exame.pdf", owner="colega").write_bytes(data)
    run(catalog_root)
    records = docs(catalog_root)
    assert sorted(d["owner"] for d in records) == ["aluna", "colega"]
    assert len({d["blob"]["sha256"] for d in records}) == 1
    assert len(list((catalog_root / "originais").rglob("*.pdf"))) == 1
    assert len(list((catalog_root / "texto").iterdir())) == 1


def test_low_confidence_goes_to_review_and_user_resolves(catalog_root: Path) -> None:
    gerar.pdf_nativo(deposit(catalog_root, "scan_0001.pdf"), "texto sem pistas úteis " * 5)
    run(catalog_root)
    [doc] = docs(catalog_root)
    assert doc["status"] == "extracted" or doc["status"] == "classified"
    assert doc["review"]["status"] == "open"
    codes = {r["code"] for r in doc["review"]["reasons"]}
    assert "review.missing" in codes or "review.low_confidence" in codes
    assert not doc.get("filed_name")

    resolve(DataRepo(catalog_root), doc["id"], {"unit": "ufe/fg", "document_type": "apontamentos"},
            OWNER)
    run(catalog_root)
    [doc] = docs(catalog_root)
    assert doc["status"] == "reviewed"
    assert doc["filed_name"].startswith("sem-ano_apontamentos-")
    assert doc["classification"]["unit"]["method"] == "user"


def test_ai_proposal_never_overrides_user(catalog_root: Path) -> None:
    gerar.pdf_nativo(deposit(catalog_root, "scan_0002.pdf"), "texto sem pistas úteis " * 5)
    run(catalog_root)
    [doc] = docs(catalog_root)
    repo = DataRepo(catalog_root)
    resolve(repo, doc["id"], {"unit": "ufe/fg"}, OWNER)
    propose(DataRepo(catalog_root), doc["id"], {
        "unit": {"value": "ufe/am1", "confidence": 0.95, "justification": "x"},
        "document_type": {"value": "formularios", "confidence": 0.9,
                          "justification": "Tabela de derivadas na página 1"}})
    run(catalog_root)
    [doc] = docs(catalog_root)
    assert doc["classification"]["unit"]["value"] == "ufe/fg"
    assert doc["classification"]["document_type"]["method"] == "ai:claude-code"
    assert doc["status"] == "filed"


def test_unknown_unit_creates_proposal(catalog_root: Path) -> None:
    gerar.pdf_nativo(deposit(catalog_root, "grafos_ficha2.pdf"), gerar.FICHA_DESCONHECIDA)
    report = run(catalog_root).report
    assert report.proposals == ["unit-teoria-dos-grafos-imaginarios"]
    [doc] = docs(catalog_root)
    codes = [r["code"] for r in doc["review"]["reasons"]]
    assert "review.unit_proposed" in codes
    proposal = read_yaml(catalog_root / "revisao" / "propostas"
                         / "unit-teoria-dos-grafos-imaginarios.yaml")
    assert proposal["data"]["institution"] == "ufe"
    assert proposal["evidence"][0]["document"] == doc["id"]


def test_failure_goes_to_errors_with_log(catalog_root: Path) -> None:
    broken = deposit(catalog_root, "partido.pdf")
    broken.write_bytes(b"%PDF-1.4 isto nao e um pdf")
    report = run(catalog_root).report
    assert len(report.errors) == 1
    errors = catalog_root / "deposito" / OWNER / "_erros" / "20251001T100000Z-abcd"
    assert (errors / "partido.pdf").exists()
    log = (errors / "partido.pdf.log").read_text()
    assert "PDF ilegível" in log
    assert docs(catalog_root) == []
    assert not list((catalog_root / "originais").rglob("*.pdf"))


def test_missing_tool_keeps_file_in_deposit(catalog_root: Path, monkeypatch) -> None:
    src = gerar.pdf_nativo(deposit(catalog_root, "a.pdf"), gerar.EXAME_AM1)
    gerar.imagem_texto(deposit(catalog_root, "foto.png"), gerar.APONTAMENTOS_FG)
    monkeypatch.setenv("PATH", "/nonexistent")
    report = run(catalog_root).report
    monkeypatch.undo()
    assert not src.exists()
    assert deposit(catalog_root, "foto.png").exists()
    assert report.skipped and "tesseract" in report.skipped[0][1]


def test_archive_with_code_project_and_nested_zip(catalog_root: Path, tmp_path: Path) -> None:
    project = gerar.projecto_codigo(tmp_path / "trabalho")
    inner = gerar.zip_de(tmp_path / "inner.zip", {"fg/apontamentos.txt": b"Fisica Geral"})
    members = {f"trabalho/{p.relative_to(project).as_posix()}": p.read_bytes()
               for p in project.rglob("*") if p.is_file()}
    members["AM1/exame.pdf"] = gerar.pdf_bytes(gerar.EXAME_AM1)
    members["extra/inner.zip"] = inner.read_bytes()
    gerar.zip_de(deposit(catalog_root, "material_P1.zip"), members)
    run(catalog_root)
    by_kind: dict[str, list[dict]] = {}
    for record in docs(catalog_root):
        by_kind.setdefault(record["kind"], []).append(record)
    assert len(by_kind["archive"]) == 2
    [project_doc] = by_kind["code_project"]
    assert {f["path"] for f in project_doc["manifest"]["files"]} == {
        "pyproject.toml", "src/main.py", "src/util.py", "README.md"}
    assert project_doc["manifest"]["ignored"][0]["path"] == "node_modules"
    assert project_doc["classification"]["unit"]["value"] == "ufe/p1"
    paths = sorted(d["sources"][0]["path"] for d in by_kind["file"])
    assert paths == ["material_P1.zip!/AM1/exame.pdf",
                     "material_P1.zip!/extra/inner.zip!/fg/apontamentos.txt"]
    archive = next(d for d in by_kind["archive"] if d.get("parent") is None)
    assert all(d.get("parent") for d in by_kind["file"])
    assert archive["status"] == "filed" and "review" not in archive


def test_deposit_folder_code_project_stays_together(catalog_root: Path) -> None:
    gerar.projecto_codigo(catalog_root / "deposito" / OWNER / "lote" / "meu-projecto")
    run(catalog_root)
    [project] = docs(catalog_root)
    assert project["kind"] == "code_project"
    assert project["blob"]["ext"] == "zip"
    assert not (catalog_root / "deposito" / OWNER / "lote").exists()


def test_ref_reuses_existing_blob(catalog_root: Path) -> None:
    gerar.pdf_nativo(deposit(catalog_root, "exame.pdf"), gerar.EXAME_AM1)
    run(catalog_root)
    [original] = docs(catalog_root)
    (catalog_root / "utilizadores" / "colega.yaml").write_text("login: colega\n")
    ref = deposit(catalog_root, "exame.pdf.ref.yaml", owner="colega")
    ref.write_text(f"sha256: {original['blob']['sha256']}\npath: AM1/exame.pdf\n")
    run(catalog_root)
    assert not ref.exists()
    colega = next(d for d in docs(catalog_root) if d["owner"] == "colega")
    assert colega["sources"][0]["via"] == "ref"
    assert colega["classification"]["unit"]["value"] == "ufe/am1"


def test_near_duplicates_are_marked_not_discarded(catalog_root: Path) -> None:
    text = gerar.EXAME_AM1
    gerar.pdf_nativo(deposit(catalog_root, "exame_v1.pdf"), text)
    gerar.pdf_nativo(deposit(catalog_root, "exame_v2.pdf"), text + "\nBom trabalho!")
    run(catalog_root)
    repo = DataRepo(catalog_root)
    assert len(repo.documents) == 2
    pairs = near_duplicate_pairs(repo)
    assert len(pairs) == 1 and pairs[0][3] > 0.9


@requires_ocr
def test_scanned_exam_end_to_end(catalog_root: Path, tmp_path: Path) -> None:
    gerar.pdf_digitalizado(deposit(catalog_root, "AM1/exame_recurso_digitalizado.pdf"),
                           gerar.EXAME_AM1, tmp_path)
    run(catalog_root)
    [doc] = docs(catalog_root)
    assert doc["classification"]["unit"]["value"] == "ufe/am1"
    meta = read_yaml(catalog_root / "texto" / doc["blob"]["sha256"] / "meta.json")
    assert meta["pages"][0]["method"] == "ocr"


def test_originals_are_read_only_and_indices_build(catalog_root: Path, tmp_path: Path) -> None:
    gerar.pasta_exemplo(catalog_root / "deposito" / OWNER)
    run(catalog_root)
    for original in (catalog_root / "originais").rglob("*.*"):
        assert not os.access(original, os.W_OK) or os.geteuid() == 0
        assert oct(original.stat().st_mode)[-3:] == "444"
    result = build_indices(DataRepo(catalog_root), tmp_path / "idx")
    assert result.documents == len(docs(catalog_root)) and result.pages > 0
    statuses = {d["status"] for d in docs(catalog_root)}
    assert Status.FILED.value in statuses


def test_export_tree(catalog_root: Path, tmp_path: Path) -> None:
    from nexus.export import export_tree

    gerar.pdf_nativo(deposit(catalog_root, "AM1/Exame_Recurso_2023-24.pdf"), gerar.EXAME_AM1)
    gerar.pdf_nativo(deposit(catalog_root, "AM1/Exame_Recurso_2023-24_resolucao.pdf"),
                     gerar.RESOLUCAO_AM1)
    run(catalog_root)
    report = export_tree(DataRepo(catalog_root), tmp_path / "arvore")
    rel = sorted(p.relative_to(tmp_path / "arvore").as_posix() for p in report.written)
    assert rel == [
        "lei/am1/enunciados-avaliacao/2023-2024_exame-recurso-2024-02-05-enunciado.pdf",
        "lei/am1/resolucoes-avaliacao/2023-2024_exame-recurso-resolucao.pdf",
    ]


def test_git_sparse_originals_are_found(git_root: Path) -> None:
    gerar.pdf_nativo(deposit(git_root, "exame.pdf"), gerar.EXAME_AM1)
    run(git_root)
    subprocess.run(["git", "add", "-A"], cwd=git_root, check=True)
    subprocess.run(["git", "commit", "-qm", "x"], cwd=git_root, check=True)
    shutil.rmtree(git_root / "originais")
    from nexus.storage.blobstore import GitRepoBlobStore

    [doc] = DataRepo(git_root).documents.values()
    store = GitRepoBlobStore(DataRepo(git_root).layout)
    assert store.exists(doc.blob.sha256)
    assert store.materialize(doc.blob.sha256, "pdf", git_root.parent / "m").read_bytes()[:4] \
        == b"%PDF"
    assert doc.kind is DocumentKind.FILE


@pytest.mark.parametrize("name", ["Thumbs.db", ".DS_Store"])
def test_os_junk_is_removed(catalog_root: Path, name: str) -> None:
    junk = deposit(catalog_root, name)
    junk.write_bytes(b"lixo")
    run(catalog_root)
    assert not junk.exists() and docs(catalog_root) == []


def test_catalog_request_from_interface(catalog_root: Path) -> None:
    gerar.pdf_nativo(deposit(catalog_root, "grafos_ficha2.pdf"), gerar.FICHA_DESCONHECIDA)
    run(catalog_root)
    requests = catalog_root / "catalogo" / "_importar"
    requests.mkdir(parents=True)
    (requests / "20251001T120000Z-ui.yaml").write_text(
        "format: nexus-catalogo\nversion: 1\ninstitutions:\n"
        "  - slug: ufe\n    name: Universidade Fictícia de Exemplo\n"
        "    units:\n      - slug: tgi\n        name: Teoria dos Grafos Imaginários\n"
        "proposals:\n  accept: [unit-teoria-dos-grafos-imaginarios]\n")
    (requests / "mau.yaml").write_text("format: outra-coisa\ninstitutions: [{slug: x}]\n")
    report = run(catalog_root).report
    assert not (requests / "20251001T120000Z-ui.yaml").exists()
    assert (requests / "_erros" / "mau.yaml").exists()
    assert (requests / "_erros" / "mau.yaml.log").exists()
    assert any("mau.yaml" in label for label, _ in report.errors)
    [doc] = docs(catalog_root)
    assert doc["classification"]["unit"]["value"] == "ufe/tgi"
    assert "review" not in doc or doc["review"]["status"] == "resolved"
    proposal = read_yaml(catalog_root / "revisao" / "propostas"
                         / "unit-teoria-dos-grafos-imaginarios.yaml")
    assert proposal["status"] == "accepted"


# --- ficheiros grandes enviados em partes ------------------------------------------------


def _split(root: Path, rel: str, data: bytes, pieces: int, *, parts_declared: int | None = None,
           sha: str | None = None) -> list[Path]:
    import hashlib

    from nexus.datarepo.yamlio import write_yaml_if_changed

    size = -(-len(data) // pieces)
    paths = []
    for i in range(pieces):
        path = deposit(root, f"{rel}.nexus-part-{i + 1:04d}")
        path.write_bytes(data[i * size:(i + 1) * size])
        paths.append(path)
    manifest = deposit(root, f"{rel}.nexus-parts.yaml")
    write_yaml_if_changed(manifest, {
        "path": rel, "size": len(data), "parts": parts_declared or pieces,
        "sha256": sha or hashlib.sha256(data).hexdigest()})
    return [manifest, *paths]


def test_file_sent_in_parts_is_reassembled(catalog_root: Path, tmp_path: Path) -> None:
    import hashlib

    source = tmp_path / "exame.pdf"
    gerar.pdf_nativo(source, gerar.EXAME_AM1)
    data = source.read_bytes()
    files = _split(catalog_root, "AM1/Exame_Recurso_2023-24.pdf", data, 3)
    report = Pipeline(DataRepo(catalog_root)).run()
    assert len(report.new_documents) == 1 and not report.errors
    doc = DataRepo(catalog_root).documents[report.new_documents[0]]
    assert doc.blob.sha256 == hashlib.sha256(data).hexdigest() and doc.blob.ext == "pdf"
    assert doc.sources[0].path == "AM1/Exame_Recurso_2023-24.pdf"
    assert doc.classification.value("unit") == "ufe/am1"
    assert not any(p.exists() for p in files)


def test_incomplete_parts_wait_and_bad_parts_go_to_errors(catalog_root: Path) -> None:
    data = b"conteudo de teste " * 1000
    waiting = _split(catalog_root, "a/espera.bin", data, 2, parts_declared=3)
    wrong = _split(catalog_root, "a/errado.txt", data, 2, sha="0" * 64)
    report = Pipeline(DataRepo(catalog_root)).run()
    assert [label for label, _ in report.skipped] == [f"{OWNER}/20251001T100000Z-abcd/a/espera.bin"]
    assert all(p.exists() for p in waiting), "fica no depósito à espera das partes em falta"
    assert len(report.errors) == 1 and "SHA-256" in report.errors[0][1]
    assert not any(p.exists() for p in wrong)
    errors = catalog_root / "deposito" / OWNER / "_erros" / "20251001T100000Z-abcd" / "a"
    assert (errors / "errado.txt.nexus-parts.yaml").exists()


def test_software_archive_is_kept_whole(catalog_root: Path) -> None:
    import zipfile

    archive = deposit(catalog_root, "LOGICA/Programas.zip")
    with zipfile.ZipFile(archive, "w") as zf:
        for i in range(25):
            zf.writestr(f"Programas/bin/lib{i}.dll", b"MZ\x90\x00" + bytes([i]) * 64)
        zf.writestr("Programas/jre/lib/rt", b"\x00binario")
        zf.writestr("Programas/LEIA-ME.txt", "Instalar o programa.")
    report = Pipeline(DataRepo(catalog_root)).run()
    docs = list(DataRepo(catalog_root).documents.values())
    assert len(docs) == 1 and docs[0].kind is DocumentKind.ARCHIVE
    assert any("arquivo de software" in w for w in report.warnings)
