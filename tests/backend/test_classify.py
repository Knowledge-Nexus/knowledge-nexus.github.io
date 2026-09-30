from __future__ import annotations

from pathlib import Path

from conftest import OWNER

from nexus.datarepo.store import DataRepo
from nexus.domain.documents import BlobRef, Document, FieldValue, Source
from nexus.domain.users import Enrollments, UnitEnrollment, User
from nexus.pipeline.classify.classifier import Classifier
from nexus.pipeline.classify.proposals import detect
from nexus.pipeline.classify.signals import Signal
from nexus.pipeline.classify.years import score_years


def _doc(path: str, ext: str = "pdf") -> Document:
    return Document(id="d1", owner=OWNER,
                    blob=BlobRef(sha256="0" * 64, size=1, ext=ext, mime="x"),
                    sources=[Source(via="upload", path=path)])


def _classifier(root: Path) -> tuple[Classifier, DataRepo]:
    repo = DataRepo(root)
    return Classifier(repo.vocabularies, repo.catalog, repo.settings.classification), repo


def _signal(raw: str, source: str = "header", weight: float = 1.0) -> Signal:
    from nexus.domain.text import normalize, strip_accents

    return Signal(source, normalize(raw), strip_accents(raw).lower(), weight)


def test_exam_statement_is_confident(catalog_root: Path) -> None:
    classifier, _ = _classifier(catalog_root)
    pages = ["Unidade Curricular: Análise Matemática I\nExame - Época de Recurso\n"
             "Ano Lectivo 2023/2024\nGrupo I (6 valores)"]
    out = classifier.classify(_doc("AM1/Exame_Recurso.pdf"), None, pages, None, [])
    c = out.classification
    assert c.value("unit") == "ufe/am1"
    assert c.value("document_type") == "enunciados-avaliacao"
    assert c.value("academic_year") == "2023-2024"
    assert c.value("assessment_type") == "exame"
    assert c.value("exam_season") == "recurso"
    assert c.value("role") == "statement"
    assert out.weak_fields == []
    assert any(r.code == "unit.name" for r in c.unit.reasons)  # type: ignore[union-attr]


def test_solution_detected_from_filename(catalog_root: Path) -> None:
    classifier, _ = _classifier(catalog_root)
    pages = ["Análise Matemática I - Proposta de Resolução\nTeste 2 - 2022/23"]
    out = classifier.classify(_doc("am1_teste2_resolucao.pdf"), None, pages, None, [])
    c = out.classification
    assert c.value("document_type") == "resolucoes-avaliacao"
    assert c.value("role") == "solution"
    assert c.value("assessment_type") == "teste"
    assert c.value("assessment_number") == 2
    assert c.value("academic_year") == "2022-2023"
    assert c.value("solution_origin") == "oficial"


def test_ambiguous_goes_to_review_with_alternatives(catalog_root: Path) -> None:
    classifier, _ = _classifier(catalog_root)
    out = classifier.classify(_doc("digitalizacao_0003.pdf"), None, ["derivadas e matrizes"],
                              None, [])
    assert "unit" in out.weak_fields
    assert "document_type" in out.weak_fields


def test_enrolled_units_are_preferred(catalog_root: Path) -> None:
    classifier, _ = _classifier(catalog_root)
    user = User(login=OWNER, enrollments=Enrollments(units=[UnitEnrollment(unit="ufe/alga")]))
    pages = ["Matrizes, determinantes e derivadas"]
    anonymous = classifier.classify(_doc("resumo.pdf"), None, pages, None, [])
    mine = classifier.classify(_doc("resumo.pdf"), None, pages, user, [])
    assert mine.classification.value("unit") == "ufe/alga"
    assert mine.classification.unit.confidence >= anonymous.classification.unit.confidence  # type: ignore[union-attr]


def test_user_fields_condition_dependent_fields(catalog_root: Path) -> None:
    classifier, _ = _classifier(catalog_root)
    doc = _doc("scan.pdf")
    doc.classification.document_type = FieldValue(value="enunciados-avaliacao", confidence=1,
                                                  method="user")
    out = classifier.classify(doc, None, ["Frequência 2019/2020"], None, [],
                              fixed=doc.classification)
    assert out.classification.value("document_type") == "enunciados-avaliacao"
    assert out.classification.value("assessment_type") == "frequencia"


def test_slides_from_format(catalog_root: Path) -> None:
    classifier, _ = _classifier(catalog_root)
    out = classifier.classify(_doc("ALGA_T3.pptx", "pptx"), None, ["## Matrizes"], None, [])
    assert out.classification.value("document_type") == "slides"
    assert out.weak_fields == []


def test_years() -> None:
    def best(text: str) -> str | None:
        ranked = score_years([_signal(text)], 9)
        return ranked[0].value if ranked else None

    assert best("Ano lectivo 2021/22") == "2021-2022"
    assert best("Data: 15/01/2024") == "2023-2024"
    assert best("Lisboa, 3 de outubro de 2024") == "2024-2025"
    assert best("2024-06-20") == "2023-2024"
    assert best("sem datas") is None


def test_unknown_unit_is_proposed(catalog_root: Path) -> None:
    repo = DataRepo(catalog_root)
    found = detect(["Unidade Curricular: Teoria dos Grafos Imaginários\nFicha 2"],
                   repo.catalog)
    assert [(p.kind, p.name) for p in found] == [("unit", "Teoria dos Grafos Imaginários")]
    assert detect(["Unidade Curricular: Análise Matemática I"], repo.catalog) == []


def test_acronym_folders_propose_institution_and_units() -> None:
    from nexus.domain.catalog import Catalog
    from nexus.pipeline.classify.proposals import detect, path_acronyms

    assert path_acronyms(["INST/PDA/Arquivo - x/teste_PDA-24BB.pdf"]) == ["INST", "PDA", "BB"]
    header = ("Departamento de Inform´atica da Universidade Fict´ıcia de Aveiro\n"
              "Frequˆencia de Programa¸c˜ao e Desenho de Algoritmos B\n2024/25")
    found = detect([header], Catalog(), paths=["UFA/PDA/teste_PDA-24BB.pdf"])
    got = {(c.kind, c.name, c.acronym) for c in found}
    assert ("unit", "Programação e Desenho de Algoritmos", "PDA") in got
    assert not any(c.acronym == "BB" for c in found), "a letra da versão não é uma cadeira"
    found = detect([header], Catalog(), paths=["UFA/PDA/x.pdf"])
    # "Universidade Fictícia de Aveiro" tem as iniciais UFA
    assert ("institution", "Universidade Fictícia de Aveiro", "UFA") in {
        (c.kind, c.name, c.acronym) for c in found}


def test_proposals_ignore_paths_and_listings() -> None:
    from nexus.domain.catalog import Catalog
    from nexus.pipeline.classify.proposals import detect

    listing = "- `X/Repositório Geral da Disciplina - abc/ficha1.pdf` (131409 B)"
    assert detect([listing], Catalog()) == []


def test_role_comes_from_names_and_titles_not_from_questions(catalog_root: Path) -> None:
    classifier, _ = _classifier(catalog_root)
    exam = ["Exame de Recurso de Análise Matemática I\nAno Lectivo 2023/2024\nDuração: 2h\n"
            + "Nome completo:\n" + "texto da prova " * 30
            + "\n3. Indique uma solução da equação e justifique a resolução."]
    c = classifier.classify(_doc("AM1/exameB_am1-recurso-23-24.pdf"), None, exam, None,
                            []).classification
    assert c.value("role") == "statement"
    assert c.value("document_type") == "enunciados-avaliacao"
    for name in ("res_fre1_AM1-24A.pdf", "corr_teste1A-2023-24.pdf", "resfreq-06-jan2024.pdf"):
        c = classifier.classify(_doc(f"AM1/{name}"), None, exam, None, []).classification
        assert c.value("role") == "solution", name
        assert c.value("document_type") == "resolucoes-avaliacao", name
    neutral = ["Análise Matemática I\nAno Lectivo 2024/2025\nDuração: 1:30"]
    c = classifier.classify(_doc("AM1/fre1_AM1-24A.pdf"), None, neutral, None,
                            []).classification
    assert c.value("assessment_type") == "frequencia", "«fre1» no nome do ficheiro"


def test_unit_name_is_not_a_role_signal(catalog_root: Path) -> None:
    from nexus.datarepo.catalog_io import import_bundle
    from nexus.datarepo.layout import Layout

    import_bundle(Layout(catalog_root), {"format": "nexus-catalogo", "version": 1,
                                         "institutions": [{"slug": "ufe", "name": "UFE",
        "units": [{"slug": "mrn", "name": "Métodos e Resolução Numérica", "acronym": "MRN"}]}]})
    classifier, _ = _classifier(catalog_root)
    pages = ["Métodos e Resolução Numérica\n2024/2025\nTeste 1\nDuração: 45min"]
    c = classifier.classify(_doc("MRN/MRN_Teste1_2024_2025.pdf"), None, pages, None,
                            []).classification
    assert c.value("unit") == "ufe/mrn"
    assert c.value("role") == "statement"
