"""Banco de perguntas (fase A): só entra o que está no ficheiro tal e qual."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from conftest import OWNER
from typer.testing import CliRunner

from nexus.cli import app
from nexus.datarepo.store import DataRepo
from nexus.datarepo.yamlio import read_yaml, write_json_if_changed, write_yaml_if_changed
from nexus.domain.documents import BlobRef, Classification, Document, FieldValue, Status
from nexus.domain.extraction import ExtractionMeta, PageMeta
from nexus.questions import QuestionError, build, pending, propose, review, still_in_file

SHA = "ab" * 32
DOC_ID = "0190a0b0-0000-7000-8000-000000000001"

# Um exame fictício de Direito: o caso prático do grupo I serve às perguntas 1 e 2.
PAGE_1 = """Universidade Fictícia de Exemplo
Faculdade de Direito
Direito Civil I · Exame · Época normal
Duração: 2 horas

Grupo I (10 valores)
Ana vendeu a Bruno um automóvel por 5000 euros, mas não
lhe entregou os documentos. Bruno recusa-se a pagar.
1. Qualifique o contrato celebrado entre Ana e Bruno,
justificando a resposta.
2. Pode Bruno recusar o pagamento? Fundamente.
"""
PAGE_2 = """Grupo II (10 valores)
3. Distinga a nulidade da anulabilidade, dando um exemplo
de cada uma.
4. Comente a seguinte afirmação: «A boa-fé é um princípio
estruturante do direito das obrigações».
Fim
"""

CONTEXT = "Ana vendeu a Bruno um automóvel por 5000 euros, mas não lhe entregou os documentos. " \
          "Bruno recusa-se a pagar."
Q1 = "1. Qualifique o contrato celebrado entre Ana e Bruno, justificando a resposta."
Q2 = "2. Pode Bruno recusar o pagamento? Fundamente."
Q3 = "3. Distinga a nulidade da anulabilidade, dando um exemplo de cada uma."
Q4 = ("4. Comente a seguinte afirmação: «A boa-fé é um princípio estruturante do direito das "
      "obrigações».")


def blocks(*items: tuple[str, str | None, str]) -> dict:
    return {"blocks": [{"kind": kind, "label": label, "text": text}
                       for kind, label, text in items]}


FULL = blocks(("context", "Grupo I", CONTEXT), ("question", "1", Q1), ("question", "2", Q2),
              ("question", "3", Q3), ("question", "4", Q4))


def make_exam(root: Path, pages: list[str], *, methods: list[str] | None = None,
              doc_type: str = "enunciados-avaliacao", status: Status = Status.FILED) -> DataRepo:
    repo = DataRepo(root)
    doc = Document(
        id=DOC_ID, owner=OWNER, status=status,
        blob=BlobRef(sha256=SHA, size=1000, ext="pdf", mime="application/pdf"),
        classification=Classification(
            document_type=FieldValue(value=doc_type, confidence=0.95),
            unit=FieldValue(value="ufe/am1", confidence=0.95),
        ),
        filed_name="ufe/am1/exame.pdf",
    )
    write_yaml_if_changed(repo.layout.document_path(DOC_ID), doc)
    text_dir = repo.layout.text_dir(SHA)
    for n, text in enumerate(pages, start=1):
        path = text_dir / "paginas" / f"{n:04d}.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    methods = methods or ["native"] * len(pages)
    meta = ExtractionMeta(sha256=SHA, extractor="pdf", extractor_version=1, pages=[
        PageMeta(n=n, method=m, chars=len(t))  # type: ignore[arg-type]
        for n, (t, m) in enumerate(zip(pages, methods, strict=True), start=1)
    ])
    write_json_if_changed(text_dir / "meta.json", meta)
    return DataRepo(root)


@pytest.fixture
def exam(catalog_root: Path) -> DataRepo:
    return make_exam(catalog_root, [PAGE_1, PAGE_2])


def refused(repo: DataRepo, payload: dict, code: str) -> None:
    with pytest.raises(QuestionError) as info:
        propose(repo, DOC_ID, payload)
    assert info.value.code == code, str(info.value)
    assert not repo.layout.questions_path(SHA).exists()


def test_the_text_kept_is_the_files_with_its_line_breaks(exam: DataRepo) -> None:
    qset = propose(exam, DOC_ID, FULL)
    assert [q.label for q in qset.questions] == ["1", "2", "3", "4"]
    assert all(q.visible for q in qset.questions)
    # O texto é o da página (com as quebras de linha), não o da proposta.
    assert qset.questions[0].text == ("1. Qualifique o contrato celebrado entre Ana e Bruno,\n"
                                      "justificando a resposta.")
    assert qset.contexts[0].text.startswith("Ana vendeu a Bruno um automóvel por 5000 euros, "
                                            "mas não\nlhe entregou")
    # O caso do grupo I serve às perguntas 1 e 2; o cabeçalho «Grupo II» fecha-o.
    assert [q.context for q in qset.questions] == ["c1", "c1", None, None]
    assert [q.pages for q in qset.questions] == [[1], [1], [2], [2]]
    assert qset.text_origin == "original"
    assert qset.generated.by == "ai:claude-code"
    assert [s.page for s in qset.generated.sources] == [1, 2]
    stored = read_yaml(exam.layout.questions_path(SHA))
    assert stored["questions"][3]["label"] == "4"


def test_a_question_rewritten_by_the_ai_is_refused(exam: DataRepo) -> None:
    changed = Q2.replace("Fundamente", "Justifique")
    refused(exam, blocks(("context", None, CONTEXT), ("question", "1", Q1),
                         ("question", "2", changed), ("question", "3", Q3),
                         ("question", "4", Q4)), "texto_nao_encontrado")


def test_spaces_and_line_breaks_do_not_count(exam: DataRepo) -> None:
    spaced = blocks(("context", None, CONTEXT.replace(" ", "\n  ")), ("question", "1", Q1),
                    ("question", "2", Q2), ("question", "3", Q3), ("question", "4", Q4))
    assert len(build(exam, DOC_ID, spaced).questions) == 4


def test_numbering_must_be_complete_and_each_question_starts_with_its_number(
        exam: DataRepo, catalog_root: Path) -> None:
    refused(exam, blocks(("question", "1", Q1), ("question", "2", Q2), ("question", "4", Q4)),
            "numeracao")
    # Saltar a pergunta 2 e chamar «2» à 3: a 2 fica pelo meio, sem estar na proposta.
    refused(exam, blocks(("context", None, CONTEXT), ("question", "1", Q1),
                         ("question", "2", Q3), ("question", "3", Q4)), "intervalo")
    refused(exam, blocks(("question", "a", Q1)), "rotulo_invalido")
    # Um enunciado numerado 1 e 3 (gralha): a pergunta «2» começa por «3.».
    page = ("Exame\n1. Explique o princípio da legalidade administrativa.\n"
            "3. Explique o princípio da proporcionalidade administrativa.\n")
    repo = make_exam(catalog_root, [page])
    refused(repo, blocks(
        ("question", "1", "1. Explique o princípio da legalidade administrativa."),
        ("question", "2", "3. Explique o princípio da proporcionalidade administrativa."),
    ), "comeco")


def test_a_missing_question_or_text_between_blocks_is_refused(exam: DataRepo) -> None:
    # Sem a última pergunta: «4. Comente…» fica depois da última.
    refused(exam, blocks(("context", None, CONTEXT), ("question", "1", Q1),
                         ("question", "2", Q2), ("question", "3", Q3)), "fim")
    # O cabeçalho antes da primeira pode ter qualquer tamanho; entre perguntas, não.
    refused(exam, blocks(("question", "1", Q1), ("question", "2", Q2), ("question", "3", Q4)),
            "intervalo")


def test_figures_math_and_garbled_text_are_kept_but_not_shown(catalog_root: Path) -> None:
    page = ("Exame\n1. Observe a figura 1 e identifique os órgãos representados.\n"
            "2. Calcule f(x) para x = 2 e indique o domínio.\n"
            "3. Explique o princípio da legalidade na administração.\n")
    repo = make_exam(catalog_root, [page])
    qset = propose(repo, DOC_ID, blocks(
        ("question", "1", "1. Observe a figura 1 e identifique os órgãos representados."),
        ("question", "2", "2. Calcule f(x) para x = 2 e indique o domínio."),
        ("question", "3", "3. Explique o princípio da legalidade na administração."),
    ))
    assert [q.excluded for q in qset.questions] == ["figure", "math", None]
    assert [q.visible for q in qset.questions] == [False, False, True]


def test_law_wording_is_not_mistaken_for_figures(catalog_root: Path) -> None:
    page = ("Exame\n1. No quadro da lei vigente, analise o direito à imagem de Carla.\n"
            "2. Aprecie o artigo 70.º do Código Civil, n.º 1, e a Lei n.º 23/2007.\n")
    repo = make_exam(catalog_root, [page])
    qset = propose(repo, DOC_ID, blocks(
        ("question", "1", "1. No quadro da lei vigente, analise o direito à imagem de Carla."),
        ("question", "2", "2. Aprecie o artigo 70.º do Código Civil, n.º 1, e a Lei n.º 23/2007."),
    ))
    assert [q.excluded for q in qset.questions] == [None, None]


def test_a_question_using_an_excluded_case_is_not_shown_either(catalog_root: Path) -> None:
    page = ("Grupo I\nConsidere a tabela seguinte com os preços dos contratos celebrados.\n"
            "1. Qual dos contratos é mais vantajoso para o comprador?\n")
    repo = make_exam(catalog_root, [page])
    qset = propose(repo, DOC_ID, blocks(
        ("context", "Grupo I",
         "Considere a tabela seguinte com os preços dos contratos celebrados."),
        ("question", "1", "1. Qual dos contratos é mais vantajoso para o comprador?"),
    ))
    assert qset.contexts[0].excluded == "figure"
    assert qset.questions[0].excluded == "figure"


def test_only_native_pages_of_filed_assessment_statements(catalog_root: Path) -> None:
    repo = make_exam(catalog_root, [PAGE_1, PAGE_2], methods=["native", "ocr"])
    refused(repo, FULL, "pagina_nao_nativa")
    repo = make_exam(catalog_root, [PAGE_1, PAGE_2], doc_type="slides")
    refused(repo, FULL, "nao_e_enunciado")
    repo = make_exam(catalog_root, [PAGE_1, PAGE_2], doc_type="resolucoes-avaliacao")
    refused(repo, FULL, "nao_e_enunciado")
    repo = make_exam(catalog_root, [PAGE_1, PAGE_2], status=Status.CLASSIFIED)
    refused(repo, FULL, "nao_arrumado")


def test_group_labels(catalog_root: Path) -> None:
    page = ("Grupo I\n1. Defina contrato de compra e venda e os seus efeitos.\n"
            "2. Defina contrato de doação e os seus efeitos típicos.\n"
            "Grupo II\n1. Explique o regime da anulabilidade dos negócios.\n")
    repo = make_exam(catalog_root, [page])
    items = [("question", "I.1", "1. Defina contrato de compra e venda e os seus efeitos."),
             ("question", "I.2", "2. Defina contrato de doação e os seus efeitos típicos."),
             ("question", "II.1", "1. Explique o regime da anulabilidade dos negócios.")]
    assert [q.id for q in build(repo, DOC_ID, blocks(*items)).questions] == ["I.1", "I.2", "II.1"]
    swapped = [items[0], ("question", "I.3", items[1][2]), items[2]]
    refused(repo, blocks(*swapped), "numeracao")


def test_reviews_stay_while_the_text_is_the_same_and_reruns_change_nothing(
        exam: DataRepo) -> None:
    propose(exam, DOC_ID, FULL)
    review(exam, DOC_ID, "2", "rejected", "aluna")
    review(exam, DOC_ID, "3", "confirmed", "aluna")
    path = exam.layout.questions_path(SHA)
    before = path.read_text(encoding="utf-8")
    qset = propose(exam, DOC_ID, FULL)
    assert path.read_text(encoding="utf-8") == before  # idempotente (regra 4)
    assert [q.visible for q in qset.questions] == [True, False, True, True]
    assert qset.questions[2].review is not None
    assert qset.questions[2].review.status == "confirmed"


def test_pending_and_still_in_file(exam: DataRepo) -> None:
    assert [d.id for d in pending(exam)] == [DOC_ID]
    qset = propose(exam, DOC_ID, FULL)
    assert pending(DataRepo(exam.root)) == []
    assert still_in_file(exam, qset) == {"1", "2", "3", "4"}
    # Uma nova extracção mudou a pergunta 4 (e o caso): o que já não bate deixa de contar.
    page = exam.layout.text_dir(SHA) / "paginas" / "0002.md"
    page.write_text(PAGE_2.replace("princípio", "principio"), encoding="utf-8")
    assert still_in_file(DataRepo(exam.root), qset) == {"1", "2", "3"}


def test_cli(exam: DataRepo, tmp_path: Path) -> None:
    runner = CliRunner()
    proposal = tmp_path / "proposta.json"
    proposal.write_text(json.dumps(FULL), encoding="utf-8")
    listed = runner.invoke(app, ["perguntas", "pendentes", "--json", "--repo", str(exam.root)])
    assert json.loads(listed.output)[0]["id"] == DOC_ID
    done = runner.invoke(app, ["perguntas", "propor", DOC_ID, "--ficheiro", str(proposal),
                               "--repo", str(exam.root)])
    assert done.exit_code == 0, done.output
    assert "4 pergunta(s) gravadas (4 visíveis" in done.output
    bad = tmp_path / "ma.json"
    bad.write_text(json.dumps(blocks(("question", "1", "1. Isto não está no exame, de todo."))),
                   encoding="utf-8")
    failed = runner.invoke(app, ["perguntas", "propor", DOC_ID, "--ficheiro", str(bad),
                                 "--repo", str(exam.root)])
    assert failed.exit_code == 1
    assert "texto_nao_encontrado" in failed.output
    checked = runner.invoke(app, ["perguntas", "verificar", DOC_ID, "1", "--estado",
                                  "rejeitada", "--repo", str(exam.root)])
    assert checked.exit_code == 0, checked.output
    shown = runner.invoke(app, ["perguntas", "mostrar", DOC_ID, "--repo", str(exam.root)])
    assert json.loads(shown.output)["questions"][0]["review"]["status"] == "rejected"


def _rows(out: Path) -> list[dict]:
    import sqlite3

    con = sqlite3.connect(out / "meta.db")
    con.row_factory = sqlite3.Row
    rows = [dict(r) for r in con.execute("SELECT * FROM questions ORDER BY ord")]
    con.close()
    return rows


def test_index_rows_and_public_material(exam: DataRepo, tmp_path: Path) -> None:
    from nexus.index.builder import build_indices

    propose(exam, DOC_ID, FULL)
    review(exam, DOC_ID, "2", "rejected", "aluna")
    review(exam, DOC_ID, "3", "confirmed", "aluna")
    build_indices(DataRepo(exam.root), tmp_path / "privado")
    rows = _rows(tmp_path / "privado")
    assert [(r["label"], r["status"]) for r in rows] == [
        ("1", "visible"), ("2", "rejected"), ("3", "visible"), ("4", "visible")]
    assert rows[0]["context_text"].startswith("Ana vendeu")
    assert rows[2]["review_status"] == "confirmed" and rows[2]["review_by"] == "aluna"
    assert rows[0]["generated_by"] == "ai:claude-code"

    # Privado: nada no material público.
    build_indices(DataRepo(exam.root), tmp_path / "publico", public=True)
    assert _rows(tmp_path / "publico") == []
    # Público: só as visíveis, sem quem as verificou.
    path = exam.layout.document_path(DOC_ID)
    record = read_yaml(path)
    record["visibility"] = "public"
    write_yaml_if_changed(path, record)
    build_indices(DataRepo(exam.root), tmp_path / "publico2", public=True)
    rows = _rows(tmp_path / "publico2")
    assert [r["label"] for r in rows] == ["1", "3", "4"]
    assert all(r["review_by"] is None and r["generated_at"] is None for r in rows)
