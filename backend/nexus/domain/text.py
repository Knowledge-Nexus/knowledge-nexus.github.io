"""Normalização de texto para correspondência (nunca para mostrar ao utilizador)."""

from __future__ import annotations

import re
import unicodedata

_NON_ALNUM = re.compile(r"[^a-z0-9]+")
_CAMEL = re.compile(r"(?<=[a-z])(?=[A-Z])")
_LETTER_DIGIT = re.compile(r"(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])")
# Unifica as grafias pré-AO e AO90 (lectivo/letivo, correcção/correção, óptimo/ótimo).
# Aplica-se aos dois lados da comparação, por isso colisões (facto/fato) são inofensivas.
_SPELLING_RULES = (("cc", "c"), ("ct", "t"), ("pc", "c"), ("pt", "t"))


# PDFs feitos em LaTeX trazem muitas vezes o acento separado da letra ("Inform´atica",
# "Dura¸c˜ao", "`a"): junta-se de novo ao carácter seguinte.
_SPACING_ACCENTS = {"´": "\u0301", "`": "\u0300", "ˆ": "\u0302", "˜": "\u0303",
                    "¨": "\u0308", "¸": "\u0327", "ˇ": "\u030c"}
_SPACING_RE = re.compile(r"([´ˆ˜¨¸ˇ])\s?([A-Za-zı])|(`)([aeiouAEIOU])")
_LIGATURES = {"ﬁ": "fi", "ﬂ": "fl", "ﬀ": "ff", "ﬃ": "ffi", "ﬄ": "ffl"}


def fix_spacing_accents(text: str) -> str:
    """Junta acentos soltos à letra ("Inform´atica" → "Informática") e desfaz ligaduras."""
    def join(match: re.Match[str]) -> str:
        accent = match.group(1) or match.group(3)
        letter = match.group(2) or match.group(4)
        return ("i" if letter == "ı" else letter) + _SPACING_ACCENTS[accent]

    for ligature, letters in _LIGATURES.items():
        text = text.replace(ligature, letters)
    return unicodedata.normalize("NFC", _SPACING_RE.sub(join, text))


def strip_accents(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch))


def normalize(text: str) -> str:
    """Minúsculas, sem acentos nem pontuação, com as grafias unificadas."""
    text = fix_spacing_accents(text)
    value = _NON_ALNUM.sub(" ", strip_accents(_CAMEL.sub(" ", text)).lower())
    # "AM1" → "am 1", "1.ª" → "1 a", "ficha3" → "ficha 3": os dois lados ficam iguais.
    value = _LETTER_DIGIT.sub(" ", value)
    for old, new in _SPELLING_RULES:
        value = value.replace(old, new)
    return " ".join(value.split())


def slugify(text: str, max_length: int = 60) -> str:
    value = _NON_ALNUM.sub("-", strip_accents(text).lower()).strip("-")
    value = re.sub(r"-{2,}", "-", value)
    return value[:max_length].rstrip("-") or "sem-nome"


def contains_phrase(haystack: str, needle: str) -> bool:
    """`needle` aparece em `haystack` como sequência de palavras completas (ambos normalizados)."""
    if not needle:
        return False
    return f" {needle} " in f" {haystack} "
