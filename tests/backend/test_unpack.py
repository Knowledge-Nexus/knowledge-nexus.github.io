from __future__ import annotations

import io
import tarfile
import zipfile
from pathlib import Path

import pytest

from nexus.config import ArchiveSettings, load_settings
from nexus.pipeline import codeproject
from nexus.pipeline.unpack import UnsafeArchiveError, safe_member_path, unpack


def _zip(path: Path, members: dict[str, bytes]) -> Path:
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, data in members.items():
            zf.writestr(name, data)
    return path


@pytest.mark.parametrize("name", ["../fora.txt", "/etc/passwd", "a/../../b", "C:/x.txt"])
def test_rejects_unsafe_paths(name: str) -> None:
    with pytest.raises(UnsafeArchiveError):
        safe_member_path(name)


def test_zip_traversal_is_refused(tmp_path: Path) -> None:
    archive = _zip(tmp_path / "mau.zip", {"../../fora.txt": b"x"})
    with pytest.raises(UnsafeArchiveError):
        unpack(archive, "zip", tmp_path / "out", ArchiveSettings())
    assert not (tmp_path / "fora.txt").exists()


def test_zip_bomb_is_refused(tmp_path: Path) -> None:
    archive = _zip(tmp_path / "bomba.zip", {"zeros.bin": b"\0" * (30 * 1024 * 1024)})
    with pytest.raises(UnsafeArchiveError):
        unpack(archive, "zip", tmp_path / "out", ArchiveSettings(max_ratio=50))


def test_too_many_entries(tmp_path: Path) -> None:
    archive = _zip(tmp_path / "muitos.zip", {f"f{i}.txt": b"x" for i in range(20)})
    with pytest.raises(UnsafeArchiveError):
        unpack(archive, "zip", tmp_path / "out", ArchiveSettings(max_entries=10))


def test_junk_is_dropped_and_order_is_stable(tmp_path: Path) -> None:
    archive = _zip(tmp_path / "a.zip", {
        "b.txt": b"b", "a.txt": b"a", "__MACOSX/._a.txt": b"", "pasta/.DS_Store": b""})
    entries = unpack(archive, "zip", tmp_path / "out", ArchiveSettings())
    assert [e.path for e in entries] == ["a.txt", "b.txt"]


def test_tar_is_supported(tmp_path: Path) -> None:
    archive = tmp_path / "a.tar.gz"
    with tarfile.open(archive, "w:gz") as tf:
        data = b"conteudo"
        info = tarfile.TarInfo("pasta/f.txt")
        info.size = len(data)
        tf.addfile(info, io.BytesIO(data))
    entries = unpack(archive, "tar.gz", tmp_path / "out", ArchiveSettings())
    assert [e.path for e in entries] == ["pasta/f.txt"]


def test_7z_is_supported(tmp_path: Path) -> None:
    import py7zr

    src = tmp_path / "f.txt"
    src.write_text("olá")
    archive = tmp_path / "a.7z"
    with py7zr.SevenZipFile(archive, "w") as sz:
        sz.write(src, "dir/f.txt")
    entries = unpack(archive, "7z", tmp_path / "out", ArchiveSettings())
    assert [e.path for e in entries] == ["dir/f.txt"]
    assert entries[0].local.read_text() == "olá"


def test_code_project_detection() -> None:
    settings = load_settings().code_projects
    files = ["Exame.pdf", "proj/pyproject.toml", "proj/src/a.py", "proj/src/b.py",
             "exercicios/ex1.py", "exercicios/ex2.py", "exercicios/ex3.py", "notas/x.pdf"]
    assert codeproject.find_projects(files, settings) == ["exercicios", "proj"]
    assert codeproject.find_projects(["package.json", "index.js"], settings) == [""]


def test_folder_of_courses_is_not_one_code_project() -> None:
    # Estrutura típica: <instituição>/<cadeira>/…, com muito código numa cadeira e só PDFs
    # noutra. Nada pode ser engolido por um "projecto" que junte as duas.
    settings = load_settings().code_projects
    files = [f"INST/PROG/Cap_{c}/ex{i}.py" for c in (1, 2) for i in range(6)]
    files += [f"INST/PROG/Enunciados/teste{i}.pdf" for i in range(2)]
    files += [f"INST/MAT/Arquivo da cadeira/ficha{i}.pdf" for i in range(4)]
    assert codeproject.find_projects(files, settings) == ["INST/PROG/Cap_1", "INST/PROG/Cap_2"]
    # Sem marcador, o relatório de um trabalho fica como documento e o código como projecto;
    # com marcador (pyproject.toml…), o projecto inteiro fica junto.
    work = ["T1/relatorio.pdf", "T1/src/a.py", "T1/src/b.py", "T1/src/c.py", "T1/README.md"]
    assert codeproject.find_projects(work, settings) == ["T1/src"]
    assert codeproject.find_projects([*work, "T1/pyproject.toml"], settings) == ["T1"]
    # Pasta com exercícios e o enunciado do projecto: o PDF não fica escondido num zip.
    mixed = ["PROG/Projecto/enunciado.pdf", "PROG/Projecto/jogo.py", "PROG/Projecto/a.gif",
             *[f"PROG/Cap_1/ex{i}.py" for i in range(4)]]
    assert codeproject.find_projects(mixed, settings) == ["PROG/Cap_1"]


def test_code_bundle_is_deterministic(tmp_path: Path) -> None:
    settings = load_settings().code_projects
    root = tmp_path / "p"
    (root / "src").mkdir(parents=True)
    (root / "src" / "a.py").write_text("print(1)\n")
    (root / "node_modules" / "x").mkdir(parents=True)
    (root / "node_modules" / "x" / "i.js").write_text("1")
    files = ["src/a.py", "node_modules/x/i.js"]
    m1 = codeproject.build_bundle(root, "", files, tmp_path / "1.zip", settings)
    m2 = codeproject.build_bundle(root, "", files, tmp_path / "2.zip", settings)
    assert (tmp_path / "1.zip").read_bytes() == (tmp_path / "2.zip").read_bytes()
    assert [f.path for f in m1.files] == ["src/a.py"]
    assert m1.ignored[0].path == "node_modules" and m1.ignored[0].files == 1
    assert m1 == m2
