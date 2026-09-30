"""`nexus verificar`: que ferramentas de sistema estão disponíveis e para quê."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Check:
    name: str
    ok: bool
    detail: str
    purpose: str
    required: bool


def _version(cmd: list[str]) -> str:
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=30, check=False)
    except (OSError, subprocess.TimeoutExpired):
        return ""
    return (out.stdout or out.stderr).strip().splitlines()[0] if (out.stdout or out.stderr) \
        else ""


def _tesseract_langs() -> set[str]:
    out = subprocess.run(["tesseract", "--list-langs"], capture_output=True, text=True,
                         check=False)
    return set(out.stdout.split()[1:]) if out.returncode == 0 else set()


def _libreoffice_works() -> bool:
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "t.txt"
        src.write_text("teste")
        profile = (Path(tmp) / "p").as_uri()
        proc = subprocess.run(
            ["soffice", "--headless", f"-env:UserInstallation={profile}", "--convert-to",
             "docx", "--outdir", tmp, str(src)],
            capture_output=True, timeout=120, check=False)
        return proc.returncode == 0 and (Path(tmp) / "t.docx").exists()


def run_checks(deep: bool = True) -> list[Check]:
    checks: list[Check] = []
    git = shutil.which("git")
    checks.append(Check("git", bool(git), _version(["git", "--version"]) if git else "em falta",
                        "commits no repositório de dados", True))
    tesseract = shutil.which("tesseract")
    if tesseract:
        langs = _tesseract_langs()
        missing = {"por", "eng"} - langs
        checks.append(Check("tesseract", not missing,
                            _version(["tesseract", "--version"]) + (
                                f" (faltam: {', '.join(sorted(missing))})" if missing else
                                f" (línguas: {', '.join(sorted(langs))})"),
                            "OCR de digitalizações e fotos", True))
    else:
        checks.append(Check("tesseract", False, "em falta (tesseract-ocr, tesseract-ocr-por)",
                            "OCR de digitalizações e fotos", True))
    soffice = shutil.which("soffice")
    works = bool(soffice) and (not deep or _libreoffice_works())
    checks.append(Check("libreoffice", works,
                        (_version(["soffice", "--version"]) if soffice else "em falta")
                        + ("" if works or not soffice else " (sem Writer/Impress/Calc)"),
                        ".doc/.ppt/.xls e versões PDF para abrir na página", False))
    pandoc = shutil.which("pandoc")
    checks.append(Check("pandoc", bool(pandoc),
                        _version(["pandoc", "--version"]) if pandoc else "em falta",
                        "DOCX com equações → Markdown + LaTeX", False))
    rar = next((t for t in ("unrar", "unar", "7z", "bsdtar") if shutil.which(t)), None)
    checks.append(Check("rar", bool(rar), rar or "em falta (unrar, 7z ou bsdtar)",
                        "abrir ficheiros .rar", False))
    return checks
