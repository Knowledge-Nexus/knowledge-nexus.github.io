"""OCR com o Tesseract (CLI), com detecção de orientação e confiança média."""

from __future__ import annotations

import csv
import io
import os
import subprocess
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from nexus.pipeline.extract.base import ExtractionError, MissingToolError, require, which


@dataclass
class OcrResult:
    text: str
    confidence: float  # 0-100, média ponderada pelo comprimento das palavras
    words: int


@lru_cache(maxsize=1)
def _has_osd() -> bool:
    if not which("tesseract"):
        return False
    out = subprocess.run(["tesseract", "--list-langs"], capture_output=True, text=True, check=False)
    return "osd" in out.stdout.split()


def _parse_tsv(tsv: str) -> OcrResult:
    lines: dict[tuple[int, int, int], list[str]] = {}
    total_conf = 0.0
    total_len = 0
    words = 0
    reader = csv.DictReader(io.StringIO(tsv), delimiter="\t", quoting=csv.QUOTE_NONE)
    for row in reader:
        text = (row.get("text") or "").strip()
        if not text or row.get("level") != "5":
            continue
        conf = float(row.get("conf") or -1)
        key = (int(row["block_num"]), int(row["par_num"]), int(row["line_num"]))
        lines.setdefault(key, []).append(text)
        if conf >= 0:
            total_conf += conf * len(text)
            total_len += len(text)
        words += 1
    out: list[str] = []
    previous: tuple[int, int] | None = None
    for (block, par, _line), tokens in sorted(lines.items()):
        if previous is not None and previous != (block, par):
            out.append("")
        out.append(" ".join(tokens))
        previous = (block, par)
    confidence = total_conf / total_len if total_len else 0.0
    return OcrResult(text="\n".join(out), confidence=round(confidence, 1), words=words)


def ocr_image(image: Path, languages: str, timeout: int) -> OcrResult:
    require("tesseract", "OCR de documentos digitalizados")
    psm = "1" if _has_osd() else "3"
    try:
        proc = subprocess.run(
            ["tesseract", str(image), "stdout", "-l", languages, "--psm", psm, "tsv"],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
            env={**os.environ, "OMP_THREAD_LIMIT": "1"},
        )
    except subprocess.TimeoutExpired as exc:
        raise ExtractionError(f"OCR excedeu {timeout}s") from exc
    if proc.returncode != 0:
        if "Failed loading language" in proc.stderr:
            raise MissingToolError(
                f"o Tesseract não tem os idiomas {languages} (ex.: tesseract-ocr-por)"
            )
        raise ExtractionError(f"OCR falhou: {proc.stderr.strip()[:300]}")
    return _parse_tsv(proc.stdout)
