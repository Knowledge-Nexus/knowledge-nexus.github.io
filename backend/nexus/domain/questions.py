"""Banco de perguntas (fase A): as perguntas de um enunciado de avaliação, tal e qual.

Um ficheiro por conteúdo (`gerado/<sha>/perguntas.yaml`), partilhado por todas as cópias do
mesmo enunciado. A IA (`/extrair-perguntas`) só diz onde começa e acaba cada pergunta; o texto
guardado é o do ficheiro, encontrado e confirmado pelo motor (`nexus/questions.py`). O que a IA
escreve por palavras suas nunca entra aqui.
"""

from __future__ import annotations

import datetime as dt
from typing import Literal

from pydantic import Field

from nexus.domain.common import Record
from nexus.domain.provenance import Generated

QUESTIONS_FORMAT = 1

# Porque é que uma pergunta, mesmo encontrada no ficheiro, não se mostra (por agora).
Exclusion = Literal["figure", "math", "garbled"]


class QuestionReview(Record):
    """Decisão de quem verifica (dono, Editor ou Gestor), depois de publicada."""

    status: Literal["confirmed", "rejected"]
    by: str | None = None
    at: dt.datetime | None = None


class QuestionContext(Record):
    """Texto comum a várias perguntas (o caso prático de um grupo, «Considere...»), tal e
    qual. Mostra-se por cima das perguntas que o seguem."""

    id: str
    label: str | None = None
    pages: list[int] = Field(default_factory=list)
    text: str
    text_sha256: str
    excluded: Exclusion | None = None


class Question(Record):
    id: str
    label: str
    order: int
    # O texto comum (caso prático) que a pergunta continua, se houver.
    context: str | None = None
    pages: list[int] = Field(default_factory=list)
    # O texto do ficheiro, tal e qual (com as quebras de linha da página).
    text: str
    # SHA-256 do texto normalizado: uma decisão de quem verifica só vale para o mesmo texto.
    text_sha256: str
    excluded: Exclusion | None = None
    review: QuestionReview | None = None

    @property
    def visible(self) -> bool:
        return self.excluded is None and (self.review is None or self.review.status != "rejected")


class QuestionSet(Record):
    format: int = QUESTIONS_FORMAT
    sha256: str
    # A origem do texto: sempre o ficheiro (`original`). A marca de IA fica para o que for
    # escrito pela IA (fases seguintes), nunca para estas.
    text_origin: Literal["original"] = "original"
    # Quem dividiu o enunciado em perguntas (a IA) e de que páginas (regra 8).
    generated: Generated
    contexts: list[QuestionContext] = Field(default_factory=list)
    questions: list[Question] = Field(default_factory=list)
