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


def strip_accents(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch))


def normalize(text: str) -> str:
    """Minúsculas, sem acentos nem pontuação, com as grafias unificadas."""
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
