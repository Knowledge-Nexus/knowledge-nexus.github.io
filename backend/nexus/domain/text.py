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


_SERIES = {"i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7, "viii": 8, "ix": 9,
           "x": 10, **{str(n): n for n in range(1, 10)}}
_ROMAN = {v: k.upper() for k, v in _SERIES.items() if not k.isdigit()}
# Depois do número, estas palavras fazem dele um ordinal ("2.º ano"), não o número da cadeira.
_ORDINAL_WORDS = {"o", "a", "ano", "anos", "semestre", "sem", "trimestre", "ciclo"}


def series_number(norm: str) -> int | None:
    """Número de uma cadeira de uma série ("analise matematica ii" → 2), se o tiver."""
    last = norm.rsplit(" ", 1)[-1] if " " in norm else ""
    return _SERIES.get(last)


def roman(number: int) -> str:
    return _ROMAN.get(number, str(number))


def _numbers_after(haystack: str, needle: str) -> list[int | None]:
    """Para cada ocorrência de `needle`, o número de série que vem logo a seguir (ou None)."""
    padded, target = f" {haystack} ", f" {needle} "
    out: list[int | None] = []
    start = padded.find(target)
    while start >= 0:
        rest = padded[start + len(target):].split(" ", 2)
        number = _SERIES.get(rest[0]) if rest and rest[0] else None
        if len(rest) > 1 and rest[1] in _ORDINAL_WORDS:
            number = None
        out.append(number)
        start = padded.find(target, start + 1)
    return out


def sequel_after(haystack: str, needle: str) -> int | None:
    """Se `needle` aparece seguido do número de uma série (≥ 2), devolve esse número."""
    return next((n for n in _numbers_after(haystack, needle) if n and n >= 2), None)


def contains_unit_phrase(haystack: str, needle: str) -> bool:
    """Como `contains_phrase`, mas para nomes de cadeiras: cadeiras numeradas são cadeiras
    diferentes. "analise matematica" não conta dentro de "analise matematica ii" (conta em
    "analise matematica i" e em "analise matematica" sozinha). Nos nomes com número, o
    número pode vir em romano ou árabe ("am ii" = "am 2"), ou colado a uma sigla ("amii")."""
    number = series_number(needle)
    if number is None:
        return any(n is None or n < 2 for n in _numbers_after(haystack, needle))
    base = needle.rsplit(" ", 1)[0]
    if number in _numbers_after(haystack, base):
        return True
    glued = " " not in base and len(base) <= 8
    return glued and (contains_phrase(haystack, f"{base}{roman(number).lower()}")
                      or contains_phrase(haystack, f"{base}{number}"))


def contains_phrase(haystack: str, needle: str) -> bool:
    """`needle` aparece em `haystack` como sequência de palavras completas (ambos normalizados)."""
    if not needle:
        return False
    return f" {needle} " in f" {haystack} "
