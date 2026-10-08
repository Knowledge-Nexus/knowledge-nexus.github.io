from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

import pytest
from conftest import requires_ocr, requires_pandoc, requires_soffice

from amostras import gerar
from nexus.config import load_settings
from nexus.pipeline.extract import extract_file, write_extraction
from nexus.pipeline.filetypes import detect_extension

SETTINGS = load_settings()


def test_native_pdf(tmp_path: Path) -> None:
    pdf = gerar.pdf_nativo(tmp_path / "exame.pdf", gerar.EXAME_AM1, title="Exame AM1")
    result = extract_file(pdf, "pdf", SETTINGS, tmp_path / "w")
    assert result.pages[0].method == "native"
    assert "Análise Matemática I" in result.pages[0].text
    assert result.metadata["title"] == "Exame AM1"


@pytest.mark.skipif(not any(Path(f).exists() for f in gerar.FONT_PATHS),
                    reason="sem fonte TrueType para gerar os caracteres de teste")
def test_latex_style_accents_are_joined(tmp_path: Path) -> None:
    # Muitos PDFs feitos em LaTeX trazem o acento separado da letra.
    text = "Lic. Eng. Inform´atica\nDura¸c˜ao: 1:30\nIntrodu¸c˜ao `a Programa¸c˜ao\nFrequˆencia"
    pdf = gerar.pdf_nativo(tmp_path / "t.pdf", text)
    page = extract_file(pdf, "pdf", SETTINGS, tmp_path / "w").pages[0].text
    for word in ("Informática", "Duração", "Introdução à Programação", "Frequência"):
        assert word in page


@requires_ocr
def test_scanned_pdf_uses_ocr(tmp_path: Path) -> None:
    pdf = gerar.pdf_digitalizado(tmp_path / "scan.pdf", gerar.FICHA_DESCONHECIDA, tmp_path)
    result = extract_file(pdf, "pdf", SETTINGS, tmp_path / "w")
    page = result.pages[0]
    assert page.method == "ocr"
    assert page.ocr_confidence is not None and page.ocr_confidence > 60
    assert "Grafos" in page.text or "grafos" in page.text


@requires_ocr
def test_image_ocr(tmp_path: Path) -> None:
    png = gerar.imagem_texto(tmp_path / "foto.png", gerar.APONTAMENTOS_FG)
    result = extract_file(png, "png", SETTINGS, tmp_path / "w")
    assert "Cinemática" in result.pages[0].text or "cinemática" in result.pages[0].text.lower()


@requires_pandoc
def test_docx_equation_becomes_latex(tmp_path: Path) -> None:
    docx = gerar.docx_com_equacao(tmp_path / "a.docx", gerar.APONTAMENTOS_FG)
    result = extract_file(docx, "docx", SETTINGS, tmp_path / "w")
    assert result.document_md is not None
    assert "$$" in result.document_md and "c^{2}" in result.document_md


@requires_soffice
def test_pptx_slides_and_rendition(tmp_path: Path) -> None:
    pptx = gerar.pptx_slides(tmp_path / "t.pptx", "Matrizes", ["Determinante", "Inversa"])
    result = extract_file(pptx, "pptx", SETTINGS, tmp_path / "w")
    assert result.pages[0].label == "Matrizes"
    assert "Determinante" in result.pages[0].text
    assert "Notas" in result.pages[0].text
    assert result.rendition is not None and result.rendition.exists()


@requires_soffice
def test_legacy_doc_is_converted(tmp_path: Path) -> None:
    docx = gerar.docx_com_equacao(tmp_path / "a.docx", gerar.APONTAMENTOS_FG)
    subprocess.run(["soffice", "--headless", "--convert-to", "doc", "--outdir", str(tmp_path),
                    f"-env:UserInstallation={(tmp_path / 'lo').as_uri()}", str(docx)],
                   check=True, capture_output=True, timeout=180)
    doc = tmp_path / "a.doc"
    assert detect_extension(doc) == "doc"
    result = extract_file(doc, "doc", SETTINGS, tmp_path / "w")
    assert result.extractor == "legacy-docx"
    assert "Cinemática" in (result.document_md or result.pages[0].text)


def test_xlsx_notebook_and_code(tmp_path: Path) -> None:
    xlsx = gerar.xlsx_notas(tmp_path / "n.xlsx")
    assert "Aluno Fictício" in extract_file(xlsx, "xlsx", SETTINGS, tmp_path / "w").pages[0].text
    nb = gerar.notebook(tmp_path / "f.ipynb")
    text = extract_file(nb, "ipynb", SETTINGS, tmp_path / "w").pages[0].text
    assert "# Ficha 1" in text and "```python" in text
    code = tmp_path / "a.py"
    code.write_text("def f():\n    return 1\n")
    assert extract_file(code, "py", SETTINGS, tmp_path / "w").pages[0].text.startswith("```python")


def test_detect_extension_without_name(tmp_path: Path) -> None:
    pdf = gerar.pdf_nativo(tmp_path / "x.pdf", "texto")
    renamed = tmp_path / "sem_extensao"
    shutil.copyfile(pdf, renamed)
    assert detect_extension(renamed) == "pdf"
    pptx = gerar.pptx_slides(tmp_path / "s.pptx", "T", ["a"])
    shutil.copyfile(pptx, tmp_path / "slides")
    assert detect_extension(tmp_path / "slides") == "pptx"


def test_write_extraction_layout(tmp_path: Path) -> None:
    pdf = gerar.pdf_nativo(tmp_path / "exame.pdf", gerar.EXAME_AM1)
    result = extract_file(pdf, "pdf", SETTINGS, tmp_path / "w")
    meta = write_extraction(result, "a" * 64, tmp_path / "t")
    assert (tmp_path / "t" / "paginas" / "0001.md").exists()
    assert (tmp_path / "t" / "documento.md").read_text().startswith("<!-- página 1 -->")
    assert meta.simhash and meta.words > 40


def test_pdf_ocr_parallel_keeps_page_order(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    import pymupdf

    from nexus.pipeline.extract import ocr, pdf

    doc = pymupdf.open()
    for _ in range(9):
        doc.new_page()
    source = tmp_path / "branco.pdf"
    doc.save(source)
    doc.close()

    def fake_ocr(image: Path, languages: str, timeout: int) -> ocr.OcrResult:
        return ocr.OcrResult(text=f"texto {image.stem}", confidence=90.0, words=10)

    monkeypatch.setattr(pdf, "ocr_image", fake_ocr)
    work = tmp_path / "work"
    work.mkdir()
    pages, _meta = pdf.pdf_pages(source, load_settings().extraction, work)
    assert [page.text for page in pages] == [f"texto page-{n:04d}" for n in range(1, 10)]
    assert not list(work.iterdir())
