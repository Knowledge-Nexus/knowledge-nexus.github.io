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


def test_batch_skips_deferred_items_and_reports_unprocessed_items(
    catalog_root: Path, monkeypatch
) -> None:
    deferred = gerar.imagem_texto(deposit(catalog_root, "a_foto.png"),
                                  gerar.APONTAMENTOS_FG)
    ready = gerar.pdf_nativo(deposit(catalog_root, "b_exame.pdf"), gerar.EXAME_AM1)
    gerar.pdf_nativo(deposit(catalog_root, "c_apontamentos.pdf"), gerar.SLIDES_ALGA)
    monkeypatch.setenv("PATH", "/nonexistent")

    first = Pipeline(DataRepo(catalog_root), max_items=1).run()

    assert deferred.exists()
    assert not ready.exists()
    assert first.processed_items == 1
    assert first.processed_labels == [f"{OWNER}/20251001T100000Z-abcd/b_exame.pdf"]
    assert first.remaining_items
    assert first.skipped and "tesseract" in first.skipped[0][1]

    second = Pipeline(DataRepo(catalog_root), max_items=1).run()

    assert deferred.exists()
    assert second.processed_items == 1
    assert not second.remaining_items


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


def test_same_text_in_different_files_is_kept_once(catalog_root: Path, tmp_path: Path) -> None:
    import gzip
    import sqlite3

    from nexus.index.builder import SEARCH_DB

    # O mesmo exame guardado duas vezes (metadados diferentes → bytes diferentes) e uma
    # versão com uma linha a mais (é outra versão: fica).
    gerar.pdf_nativo(deposit(catalog_root, "AM1/fre1_AM1-24AA.pdf"), gerar.EXAME_AM1, title="a")
    gerar.pdf_nativo(deposit(catalog_root, "AM1/fre1_AM1-24AA (1).pdf"), gerar.EXAME_AM1,
                     title="b")
    gerar.pdf_nativo(deposit(catalog_root, "AM1/fre1_AM1-24AAA.pdf"),
                     gerar.EXAME_AM1 + "\nResolução: a resposta é 2.")
    Pipeline(DataRepo(catalog_root)).run()
    repo = DataRepo(catalog_root)
    docs = {d.sources[0].path.rsplit("/", 1)[-1]: d for d in repo.documents.values()}
    assert len({d.blob.sha256 for d in docs.values()}) == 3, "três ficheiros diferentes"
    first, copy = sorted([docs["fre1_AM1-24AA.pdf"], docs["fre1_AM1-24AA (1).pdf"]],
                         key=lambda d: d.id)
    assert copy.duplicate_of == first.id and first.duplicate_of is None
    assert docs["fre1_AM1-24AAA.pdf"].duplicate_of is None
    assert copy.filed_name is None and not copy.needs_review

    build_indices(repo, tmp_path)
    raw_search = tmp_path / "pesquisa.db"
    raw_search.write_bytes(gzip.decompress((tmp_path / SEARCH_DB).read_bytes()))
    ids = {r[0] for r in sqlite3.connect(raw_search).execute(
        "SELECT DISTINCT doc_id FROM pages_fts")}
    assert copy.id not in ids and first.id in ids

    # "Não são iguais": volta a ser um documento separado, e fica assim.
    repo.save_document(copy.model_copy(update={"near_duplicates_dismissed": [first.id]}))
    Pipeline(DataRepo(catalog_root)).run()
    again = DataRepo(catalog_root).documents[copy.id]
    assert again.duplicate_of is None and (again.filed_name or again.needs_review), \
        "volta a ser um documento separado (arrumado ou em «A rever»)"


def test_project_folder_is_a_bundle_filed_with_its_statement(catalog_root: Path) -> None:
    gerar.pdf_nativo(deposit(catalog_root, "Trabalho/Exame_Recurso_2023-24.pdf"), gerar.EXAME_AM1)
    deposit(catalog_root, "Trabalho/resolucao.py").write_text(
        "def soma(a, b):\n    return a + b\n\nprint(soma(1, 2))\n")
    Pipeline(DataRepo(catalog_root)).run()
    docs = {d.sources[0].path: d for d in DataRepo(catalog_root).documents.values()}
    lead, member = docs["Trabalho/Exame_Recurso_2023-24.pdf"], docs["Trabalho/resolucao.py"]
    assert lead.bundle is not None and member.bundle == lead.bundle
    assert lead.bundle.name == "Trabalho" and lead.bundle.lead == lead.id
    assert lead.status is Status.FILED, (lead.review, lead.classification)
    assert member.classification.value("unit") == "ufe/am1"
    assert member.classification.unit.reasons[0].code == "bundle.inherited"
    assert not member.needs_review and member.status is Status.FILED
    assert member.filed_name == lead.filed_name.rsplit(".", 1)[0] + "/resolucao.py"

    before = {p.name: p.read_text() for p in (catalog_root / "documentos").glob("*.yaml")}
    Pipeline(DataRepo(catalog_root)).run()
    after = {p.name: p.read_text() for p in (catalog_root / "documentos").glob("*.yaml")}
    assert before == after, "o pipeline é idempotente com conjuntos"

    # "Separar": o código deixa de herdar e volta a ser classificado sozinho.
    repo = DataRepo(catalog_root)
    separated = repo.documents[member.id].model_copy(update={"bundle": None,
                                                             "bundle_dismissed": True})
    repo.save_document(separated)
    Pipeline(DataRepo(catalog_root)).run()
    member = DataRepo(catalog_root).documents[member.id]
    assert member.bundle is None and member.classification.value("unit") != "ufe/am1"
    assert DataRepo(catalog_root).documents[lead.id].bundle is None, "um só não é conjunto"


def test_user_bundle_is_kept_and_named(catalog_root: Path) -> None:
    from nexus.domain.documents import BundleRef

    gerar.pdf_nativo(deposit(catalog_root, "AM1/Exame_Recurso_2023-24.pdf"), gerar.EXAME_AM1)
    deposit(catalog_root, "Outra/notas.txt").write_text("apontamentos soltos " * 20)
    Pipeline(DataRepo(catalog_root)).run()
    repo = DataRepo(catalog_root)
    ref = BundleRef(id="meu-conjunto", name="Exame e notas")
    for doc in repo.documents.values():
        repo.save_document(doc.model_copy(update={"bundle": ref}))
    Pipeline(DataRepo(catalog_root)).run()
    docs = {d.sources[0].path: d for d in DataRepo(catalog_root).documents.values()}
    exam, notes = docs["AM1/Exame_Recurso_2023-24.pdf"], docs["Outra/notas.txt"]
    assert exam.bundle and exam.bundle.lead == exam.id and exam.bundle.method == "user"
    assert notes.bundle == exam.bundle and notes.classification.value("unit") == "ufe/am1"
    assert notes.filed_name and notes.filed_name.endswith("/notas.txt")


def test_user_chooses_the_bundle_lead(catalog_root: Path) -> None:
    gerar.pdf_nativo(deposit(catalog_root, "Trabalho/Exame_Recurso_2023-24.pdf"), gerar.EXAME_AM1)
    deposit(catalog_root, "Trabalho/resolucao.py").write_text("print(1 + 2)\n" * 5)
    Pipeline(DataRepo(catalog_root)).run()
    repo = DataRepo(catalog_root)
    docs = {d.sources[0].path: d for d in repo.documents.values()}
    exam, code = docs["Trabalho/Exame_Recurso_2023-24.pdf"], docs["Trabalho/resolucao.py"]
    assert exam.bundle and exam.bundle.lead == exam.id
    ref = exam.bundle.model_copy(update={"method": "user", "lead_choice": code.id})
    for doc in (exam, code):
        repo.save_document(doc.model_copy(update={"bundle": ref}))
    Pipeline(DataRepo(catalog_root)).run()
    docs = {d.sources[0].path: d for d in DataRepo(catalog_root).documents.values()}
    exam, code = docs["Trabalho/Exame_Recurso_2023-24.pdf"], docs["Trabalho/resolucao.py"]
    assert exam.bundle and code.bundle and exam.bundle.lead == code.id == code.bundle.lead
    assert exam.bundle.lead_choice == code.id
    # O exame deixa de herdar (o principal escolhido ainda não está arrumado) e mantém o
    # seu próprio nome; nada se perde.
    assert exam.classification.value("unit") == "ufe/am1"
    assert exam.filed_name and "/" not in exam.filed_name


def _lote(files: dict[str, bytes]) -> bytes:
    import io
    import zipfile

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as zf:
        for name, data in files.items():
            zf.writestr(name, data)
    return buffer.getvalue()


def test_lote_is_opened_as_if_files_were_deposited_one_by_one(catalog_root: Path,
                                                              tmp_path: Path) -> None:
    pdf = gerar.pdf_nativo(tmp_path / "x.pdf", gerar.EXAME_AM1).read_bytes()
    deposit(catalog_root, "_lote-001.nexus-lote.zip").write_bytes(_lote({
        "AM1/Exame_Recurso_2023-24.pdf": pdf,
        "AM1/notas.txt": b"apontamentos de limites " * 20,
    }))
    report = Pipeline(DataRepo(catalog_root)).run()
    docs = DataRepo(catalog_root).documents.values()
    assert sorted(d.sources[0].path for d in docs) == ["AM1/Exame_Recurso_2023-24.pdf",
                                                       "AM1/notas.txt"]
    assert all(d.kind is DocumentKind.FILE and d.parent is None for d in docs)
    assert not list((catalog_root / "deposito").rglob("*.nexus-lote.zip"))
    assert any("lote aberto" in w for w in report.warnings)


def test_lote_in_parts_waits_until_complete(catalog_root: Path) -> None:
    import yaml

    data = _lote({"AM1/a.txt": b"texto " * 50, "AM1/b.txt": b"outro " * 50})
    half = len(data) // 2
    base = "_lote-001.nexus-lote.zip"
    deposit(catalog_root, f"{base}.nexus-part-0001").write_bytes(data[:half])
    deposit(catalog_root, f"{base}.nexus-parts.yaml").write_text(yaml.safe_dump({
        "parts": 2, "size": len(data), "sha256": hashlib.sha256(data).hexdigest()}))
    report = Pipeline(DataRepo(catalog_root)).run()
    assert not DataRepo(catalog_root).documents and report.skipped
    deposit(catalog_root, f"{base}.nexus-part-0002").write_bytes(data[half:])
    Pipeline(DataRepo(catalog_root)).run()
    assert len(DataRepo(catalog_root).documents) == 2
    assert not list((catalog_root / "deposito").rglob("*nexus-*"))


def test_lote_with_path_traversal_is_refused(catalog_root: Path) -> None:
    deposit(catalog_root, "_lote.nexus-lote.zip").write_bytes(_lote({"../fora.txt": b"x"}))
    report = Pipeline(DataRepo(catalog_root)).run()
    assert report.errors and not (catalog_root / "deposito" / "aluna" / "fora.txt").exists()
    assert not (catalog_root / "fora.txt").exists()


def test_source_layout_gives_year_unit_type_and_groups(catalog_root: Path) -> None:
    base = "UFE/2020_2021/2º Semestre/Álgebra Linear e Geometria Analítica"
    deposit(catalog_root, f"{base}/Material Prático/ficha_vectores.txt").write_text(
        "Considere os vectores u e v. Calcule u + v.\n")
    deposit(catalog_root, f"{base}/Material Prático/ficha_matrizes.txt").write_text(
        "Considere as matrizes A e B. Calcule AB.\n")
    deposit(catalog_root, f"{base}/exemplos/a.php").write_text("<?php echo 1; ?>\n")
    deposit(catalog_root, f"{base}/exemplos/b.php").write_text("<?php echo 2; ?>\n")
    deposit(catalog_root, "UFE/2020_2021/2º Semestre/Programação Web II/aula1.txt").write_text(
        "Introdução ao PHP e datas.\n")
    report = Pipeline(DataRepo(catalog_root)).run()
    docs = {d.sources[0].path.rsplit("/", 1)[-1]: d
            for d in DataRepo(catalog_root).documents.values()}
    sheet = docs["ficha_vectores.txt"]
    assert sheet.classification.value("unit") == "ufe/alga", sheet.classification
    assert sheet.classification.value("academic_year") == "2020-2021"
    assert sheet.classification.value("document_type") == "fichas-exercicios"
    assert sheet.bundle is None and docs["ficha_matrizes.txt"].bundle is None, \
        "pastas de material não formam conjuntos"
    assert docs["a.php"].bundle is not None and docs["a.php"].bundle == docs["b.php"].bundle
    assert docs["a.php"].bundle.name == "exemplos"
    assert docs["aula1.txt"].needs_review
    assert "unit-programacao-web-ii" in report.proposals, report


def test_remove_unit_merging_and_not(catalog_root: Path) -> None:
    gerar.pdf_nativo(deposit(catalog_root, "Exame_Recurso_2023-24.pdf"), gerar.EXAME_AM1)
    run(catalog_root)
    requests = catalog_root / "catalogo" / "_importar"
    requests.mkdir(parents=True)
    (requests / "a.yaml").write_text(
        "format: nexus-catalogo\nversion: 1\ninstitutions:\n"
        "  - slug: ufe\n    name: Universidade Fictícia de Exemplo\n"
        "    units:\n      - slug: calculo\n        name: Cálculo\n"
        "units_remove:\n  - { unit: ufe/am1, merge_into: ufe/calculo }\n")
    run(catalog_root)
    repo = DataRepo(catalog_root)
    assert "ufe/am1" not in repo.catalog.units
    merged = repo.catalog.units["ufe/calculo"]
    assert "Análise Matemática I" in merged.aliases
    course = next(iter(repo.catalog.courses.values()))
    assert "calculo" in [link.unit for link in course.units]
    assert "am1" not in [link.unit for link in course.units]
    [doc] = docs(catalog_root)
    assert doc["classification"]["unit"]["value"] == "ufe/calculo"
    assert doc.get("filed_name"), doc

    (requests / "b.yaml").write_text(
        "format: nexus-catalogo\nversion: 1\nunits_remove:\n  - { unit: ufe/calculo }\n")
    run(catalog_root)
    assert "ufe/calculo" not in DataRepo(catalog_root).catalog.units
    [doc] = docs(catalog_root)
    assert (doc["classification"].get("unit") or {}).get("value") != "ufe/calculo"


def test_bundle_lead_is_stable_between_runs(catalog_root: Path) -> None:
    """O principal de um conjunto não alterna entre execuções (o PDF sozinho fica em dúvida,
    o texto é arrumado; antes, a escolha mudava a meio de cada execução)."""
    base = "UFE/2020_2021/1º Semestre/Álgebra Linear e Geometria Analítica/Geral"
    gerar.pdf_nativo(deposit(catalog_root, f"{base}/planeamento.pdf"),
                     "Planeamento\nlivro de apoio e apresentação da matéria\n")
    deposit(catalog_root, f"{base}/ficha_exercicios_1.txt").write_text(
        "Ficha de exercícios 1\nResolva os exercícios seguintes sobre matrizes.\n")
    for _ in range(2):
        Pipeline(DataRepo(catalog_root)).run()
    before = {p.name: p.read_text() for p in (catalog_root / "documentos").glob("*.yaml")}
    for _ in range(2):
        Pipeline(DataRepo(catalog_root)).run()
        after = {p.name: p.read_text() for p in (catalog_root / "documentos").glob("*.yaml")}
        assert after == before, "o pipeline é idempotente com conjuntos"


def test_type_ties_do_not_depend_on_hash_seed(tmp_path: Path) -> None:
    """Famílias de tipos empatadas desempatam sempre da mesma forma (antes dependia da
    semente de hash do Python, que muda em cada processo)."""
    import sys

    script = tmp_path / "empate.py"
    script.write_text(
        "from nexus.config import load_settings\n"
        "from nexus.datarepo.store import DataRepo\n"
        "from nexus.domain.catalog import Catalog\n"
        "from nexus.domain.documents import BlobRef, Document, Source\n"
        "from nexus.pipeline.classify.classifier import Classifier\n"
        "from nexus.datarepo.yamlio import read_yaml\n"
        "from nexus.domain.vocab import Vocabularies\n"
        "import nexus.config as c, pathlib\n"
        "vocab = Vocabularies.model_validate(read_yaml(c.config_dir() / 'vocabularios.yaml'))\n"
        "settings = c.Settings().classification\n"
        "cl = Classifier(vocab, Catalog(), settings)\n"
        "doc = Document(id='d', owner='o', blob=BlobRef(sha256='0'*64, size=1, ext='txt',"
        " mime='text/plain'), sources=[Source(via='upload', path='x.txt')])\n"
        "out = cl.classify(doc, None, ['livro e apresentação'], None, [])\n"
        "print(out.classification.value('document_type'))\n")
    results = set()
    for seed in ("1", "2", "3", "4"):
        done = subprocess.run([sys.executable, str(script)], capture_output=True, text=True,
                              env={**os.environ, "PYTHONHASHSEED": seed}, check=True)
        results.add(done.stdout.strip())
    assert len(results) == 1, results


def test_user_unit_is_not_held_by_open_proposal(catalog_root: Path) -> None:
    """Escolheste a cadeira: uma proposta de cadeira que cita o documento já não o prende em
    «A rever». E uma proposta cuja cadeira entretanto existe fica aceite."""
    gerar.pdf_nativo(deposit(catalog_root, "grafos_ficha2.pdf"), gerar.FICHA_DESCONHECIDA)
    run(catalog_root)
    [doc] = docs(catalog_root)
    pid = "unit-teoria-dos-grafos-imaginarios"
    assert any(r["code"] == "review.unit_proposed" for r in doc["review"]["reasons"])

    resolve(DataRepo(catalog_root), doc["id"], {"unit": "ufe/am1",
                                                "document_type": "fichas-exercicios"}, OWNER)
    run(catalog_root)
    [doc] = docs(catalog_root)
    assert doc["review"]["status"] == "resolved", doc["review"]
    assert doc.get("filed_name")
    assert read_yaml(catalog_root / "revisao" / "propostas" / f"{pid}.yaml")["status"] == "open"

    # A cadeira passa a existir (criada na biblioteca, sem aceitar a proposta).
    requests = catalog_root / "catalogo" / "_importar"
    requests.mkdir(parents=True)
    (requests / "nova.yaml").write_text(
        "format: nexus-catalogo\nversion: 1\ninstitutions:\n"
        "  - slug: ufe\n    name: Universidade Fictícia de Exemplo\n"
        "    units:\n      - slug: tgi\n        name: Teoria dos Grafos Imaginários\n")
    run(catalog_root)
    assert read_yaml(catalog_root / "revisao" / "propostas" / f"{pid}.yaml")["status"] \
        == "accepted"
