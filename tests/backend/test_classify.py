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


def test_assessment_date_variant_and_ordinal(catalog_root: Path) -> None:
    classifier, repo = _classifier(catalog_root)
    pages = ["Ano lectivo 2024/25   Primeira Frequência de Análise Matemática I D\n"
             "Lic.ª Eng. Informática   20-11-2024   Duração: 1:30\n1. (a) Calcule…"]
    c = classifier.classify(_doc("AM1/fre1_AM1-24DD.pdf"), None, pages, None, []).classification
    assert c.value("assessment_type") == "frequencia"
    assert c.value("date") == "2024-11-20"
    assert c.value("variant") == "D"
    assert c.value("assessment_number") == 1

    from nexus.pipeline.filing import filed_name
    doc = _doc("AM1/fre1_AM1-24DD.pdf").model_copy(update={"classification": c})
    assert filed_name(doc, repo.vocabularies) == \
        "2024-2025_frequencia-1-2024-11-20-d-enunciado.pdf"
    pages = ["Exame de Recurso B de Análise Matemática I\n24-1-2025\nDuração: 2:30"]
    c = classifier.classify(_doc("AM1/exameB.pdf"), None, pages, None, []).classification
    assert c.value("variant") == "B" and c.value("date") == "2025-01-24"


def test_unique_name() -> None:
    from nexus.pipeline.filing import unique_name

    taken = {"a.pdf", "a-2.pdf"}
    assert unique_name("b.pdf", taken) == "b.pdf"
    assert unique_name("a.pdf", taken) == "a-3.pdf"


def test_numbered_units_are_different_units() -> None:
    from nexus.domain.text import contains_unit_phrase, normalize

    def match(text: str, name: str) -> bool:
        return contains_unit_phrase(normalize(text), normalize(name))

    assert not match("Sebenta_AM_II_2526.pdf", "AM")
    assert not match("Análise Matemática II", "Análise Matemática")
    assert match("Análise Matemática I: exame", "Análise Matemática")
    assert match("AM 2.º ano", "AM"), "2.º ano é o ano do curso, não o número da cadeira"
    for text in ("AM_II", "AM2", "AMII", "Análise Matemática 2"):
        assert match(text, "AM II") or match(text, "Análise Matemática II"), text
    assert not match("Análise Matemática III", "Análise Matemática II")
    assert match("fre1_ED-24AA.pdf", "ED")


def test_sequel_unit_is_not_filed_in_the_first_and_is_proposed(catalog_root: Path) -> None:
    classifier, repo = _classifier(catalog_root)
    pages = ["Análise Matemática II\nSebenta, Parte I\n2025/2026\nCapítulo 1: séries"]
    doc = _doc("1º Ano/Análise Matemática II/Sebenta_AM_II_2526_Parte_I.pdf")
    c = classifier.classify(doc, None, pages, None, []).classification
    assert c.value("unit") != "ufe/am1"
    found = detect(pages, repo.catalog, paths=[doc.sources[0].path])
    assert ("unit", "Análise Matemática II", "AM II") in {
        (p.kind, p.name, p.acronym) for p in found}
    # A primeira continua a ser reconhecida, e não se propõe a si própria.
    assert detect(["Análise Matemática I\nExame"], repo.catalog, paths=["AM1/exame.pdf"]) == []


def _custom(units: list[tuple[str, str, str | None]]) -> Classifier:
    """Classificador com o vocabulário por defeito e um catálogo só com estas cadeiras."""
    from nexus.config import config_dir, load_settings
    from nexus.datarepo.yamlio import read_yaml
    from nexus.domain.catalog import Catalog, CurricularUnit
    from nexus.domain.vocab import Vocabularies

    vocab = Vocabularies.model_validate(read_yaml(config_dir() / "vocabularios.yaml"))
    catalog = Catalog(units={
        f"x/{slug}": CurricularUnit(slug=slug, institution="x", name=name, acronym=acronym)
        for slug, name, acronym in units
    })
    return Classifier(vocab, catalog, load_settings().classification)


def test_acronym_must_be_written_as_acronym() -> None:
    """"SO" (Sistemas Operativos) não é a palavra "só" (sem acentos e em minúsculas eram
    iguais: material de Direito ia parar a Sistemas Operativos)."""
    classifier = _custom([("so", "Sistemas Operativos", "SO")])
    law = classifier.classify(_doc("Acordao.pdf"), None,
                              ["Acórdão do Tribunal\nSó é admissível recurso quando..."], None, [])
    assert law.classification.unit is None
    filed = classifier.classify(_doc("SO_aula3_processos.pdf"), None, ["Processos"], None, [])
    assert filed.classification.value("unit") == "x/so"


def test_folder_beats_enrolled_unit_with_weak_signal() -> None:
    """A pasta da cadeira ganha a uma cadeira inscrita que só aparece nos metadados."""
    from nexus.domain.extraction import ExtractionMeta

    classifier = _custom([("pa", "Programação Aplicada", "PA"),
                          ("poo", "Programação Orientada a Objectos", "POO")])
    user = User(login=OWNER, enrollments=Enrollments(units=[UnitEnrollment(unit="x/poo")]))
    meta = ExtractionMeta(sha256="0" * 64, extractor="pdf", extractor_version=1,
                          metadata={"title": "Programação Orientada a Objectos - Java"})
    doc = _doc("UFE/2020_2021/2º Semestre/Programação Aplicada/Ficha 5 - Sockets.pdf")
    out = classifier.classify(doc, meta, ["Sockets em Java"], user, [])
    assert out.classification.value("unit") == "x/pa"


def test_unit_only_in_body_is_not_enough() -> None:
    classifier = _custom([("ap", "Administração Pública", None)])
    pages = ["Introdução\n" + "x " * 800 + "\na administração pública e o direito"]
    out = classifier.classify(_doc("Introducao do Direito Administrativo.pdf"), None, pages,
                              None, [])
    unit = out.classification.unit
    assert unit is not None and unit.confidence < 0.7
    assert "unit" in out.weak_fields


def test_pdf_made_with_powerpoint_suggests_slides() -> None:
    from nexus.domain.extraction import ExtractionMeta

    classifier = _custom([("pa", "Programação Aplicada", "PA")])
    meta = ExtractionMeta(sha256="0" * 64, extractor="pdf", extractor_version=1,
                          metadata={"creator": "Microsoft® PowerPoint® 2016"})
    out = classifier.classify(_doc("LEI_PA_06 Applets.pdf"), meta, ["Applets e Gráficos"],
                              None, [])
    assert out.classification.value("document_type") == "slides"
    assert any(r.code == "type.producer" for r in out.classification.document_type.reasons)  # type: ignore[union-attr]


def test_proposals_reject_people_generic_terms_and_ocr_noise() -> None:
    from nexus.domain.catalog import Catalog

    header = ("Unidade Curricular\nDireito Administrativo\nBárbara Magalhães Bravo\n"
              "Doutoramento em Direito\nEscola Superior de Tecnologia• e apósGestão de X")
    found = detect([header], Catalog(), paths=["BMB/UC/doc.pdf"],
                   generic=frozenset({"unidade curricular"}))
    names = {(c.kind, c.name) for c in found}
    assert not any("Bárbara" in n for _, n in names), names
    assert not any(n == "Unidade Curricular" for _, n in names), names
    assert ("course", "Doutoramento em Direito") in names
    assert not any("apósGestão" in n for _, n in names), names


def test_degree_and_institution_phrases_are_courses_and_institutions() -> None:
    from nexus.domain.catalog import Catalog

    header = ("PROVA ESCRITA DE DIREITO PENAL E DIREITO PROCESSUAL PENAL Via Académica\n"
              "36.º CURSO DE FORMAÇÃO PARA OS TRIBUNAIS JUDICIAIS\n"
              "Centro de Estudos Judiciários o tempo de duração da prova\n"
              "Licenciatura em Engenharia Informática")
    found = detect([header], Catalog(), paths=["LEI/CEJ/prova.pdf"])
    names = {(c.kind, c.name) for c in found}
    assert ("unit", "Direito Penal e Direito Processual Penal") in names, names
    assert ("course", "Curso de Formação para os Tribunais Judiciais") in names, names
    assert ("institution", "Centro de Estudos Judiciários") in names, names
    assert ("course", "Licenciatura em Engenharia Informática") in names, names
    assert not any(k == "unit" and n.startswith("Licenciatura") for k, n in names), names


def test_sequels_only_from_folders_or_roman_numerals() -> None:
    from nexus.domain.catalog import Catalog, CurricularUnit

    catalog = Catalog(units={"x/tc": CurricularUnit(slug="tc", institution="x",
                                                    name="Teoria da Computação", acronym="TC")})
    chapter = detect(["Teoria da Computação 3 - Gramáticas"], catalog,
                     paths=["UC/TC/TC3_Gramaticas.pdf"])
    assert not any(c.name.startswith("Teoria da Computação I") for c in chapter)
    sequel = detect(["Sebenta"], catalog, paths=["UC/Sebenta_TC_II_2526.pdf"])
    assert any(c.name == "Teoria da Computação II" for c in sequel)
