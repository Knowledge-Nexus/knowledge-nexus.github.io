"""Banco de perguntas, fase A: perguntas tal e qual dos enunciados de avaliação.

A IA (skill `/extrair-perguntas`) lê o texto das páginas e propõe, por ordem, os blocos do
enunciado: textos comuns (o caso prático de um grupo) e perguntas, com o número de cada uma.
O motor só aceita a proposta se tiver a certeza de que cada bloco está no ficheiro tal e qual:

- o documento é um enunciado de avaliação arrumado (tipo com `is_assessment` e papel
  `statement`), sem revisão aberta, não removido nem cópia de outro;
- todas as páginas tocadas têm texto do próprio ficheiro (`native`), sem OCR nem páginas
  marcadas para transcrição;
- cada bloco aparece exactamente no texto (só os espaços e as quebras de linha se ignoram), pela
  ordem proposta, sem sobreposições, e entre dois blocos só há pouco texto (cabeçalhos de grupo,
  cotações, rodapés); depois da última pergunta, quase nada;
- a numeração está completa (1, 2, 3… ou I.1, I.2, II.1…) e cada pergunta começa pelo seu
  número.

Se alguma destas falhar, nada é gravado. Uma pergunta (ou texto comum) que fala de figuras,
tabelas ou anexos, que tem matemática ou texto estragado fica guardada mas não se mostra
(`excluded`): sem a figura ou sem a fórmula bem escrita estaria incompleta ou errada.

O texto guardado é o do ficheiro, não o da proposta. Quem verifica (dono, Editor ou Gestor)
confirma ou rejeita depois; a decisão fica enquanto o texto for o mesmo (`text_sha256`).
"""

from __future__ import annotations

import hashlib
import re
import unicodedata
from dataclasses import dataclass
from typing import Any

from nexus import clock
from nexus.datarepo.store import DataRepo
from nexus.datarepo.yamlio import read_yaml, write_yaml_if_changed
from nexus.domain.documents import Document, Status
from nexus.domain.provenance import Generated, SourceRef
from nexus.domain.questions import (
    Exclusion,
    Question,
    QuestionContext,
    QuestionReview,
    QuestionSet,
)
from nexus.domain.vocab import ROLE_STATEMENT

AI_METHOD = "ai:claude-code"

# Entre dois blocos seguidos: cabeçalhos ("Grupo II (8 valores)"), cotações e rodapés.
GAP_MAX = 160
# Depois da última pergunta: "Fim", "Bom trabalho", o rodapé da página.
TAIL_MAX = 250
MIN_CHARS = 20
MAX_CHARS = 6000
MAX_BLOCKS = 200

_LABEL_NUMBER = re.compile(r"^(\d{1,3})$")
_LABEL_GROUP = re.compile(r"^([IVXL]{1,6})\.(\d{1,3})$")
_ROMAN = {"I": 1, "V": 5, "X": 10, "L": 50}

# Fala de algo que não está no texto: sem isso, a pergunta fica incompleta.
# Só palavras que apontam para uma figura ou anexo: «quadro» e «imagem» soltos ficam de fora
# («no quadro da lei», «direito à imagem»).
_FIGURE = re.compile(
    r"\b(?:figuras?|tabelas?|graficos?|diagramas?|esquemas?|desenhos?|fotografias?|"
    r"ilustrac(?:ao|oes)|(?:em|no|do|nos|dos|ver o) anexos?|"
    r"imagens? (?:seguintes?|abaixo|acima|em baixo))\b|\bfig\."
)
# Matemática ou código: o texto extraído de um PDF perde expoentes, índices e símbolos.
_MATH = re.compile(
    r"[=<>≤≥≠±×÷√∫∑∏∞∂∈∉⊂⊆⊃∪∩→←↔⇒⇔^_{}|~∀∃∇]"
    r"|\b[a-zA-Z]\s*\(\s*[a-zA-Z0-9]\s*\)"
    r"|\b(lim|log|ln|sen|sin|cos|tg|tan|exp|max|min)\b"
    r"|(?<![A-Za-zÀ-ÿ])[a-z]\d(?!\d)"
)
_GARBLED = re.compile(r"[\ue000-\uf8ff\ufffd\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
# Entre blocos ou depois do último: algo que começa como uma pergunta («4. …», «b) …»,
# «Pergunta 5») quer dizer que ficou uma pergunta (ou parte dela) de fora.
_QUESTION_START = re.compile(
    r"(?:^|\s)(?:\d{1,3}\s*[.)]|[a-z]\)|(?:pergunta|quest[aã]o|exerc[ií]cio)\s+\d{1,3})(?=\s|$)",
    re.IGNORECASE,
)
# Um cabeçalho de grupo entre duas perguntas fecha o caso prático do grupo anterior.
_GROUP_HEADER = re.compile(r"\b(?:grupo|parte|sec[cç][aã]o)\s+(?:[IVXL]{1,6}|\d{1,2})\b",
                           re.IGNORECASE)


class QuestionError(ValueError):
    """Proposta recusada: nada é gravado. `code` explica porquê."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


# --- quem pode ter perguntas ---------------------------------------------------------------


def eligibility(repo: DataRepo, doc: Document) -> str | None:
    """None se o documento pode ter perguntas; senão, o código da razão."""
    if doc.removed is not None or doc.duplicate_of:
        return "removido_ou_copia"
    if doc.needs_review or not doc.reached(Status.FILED):
        return "nao_arrumado"
    term = repo.vocabularies.get("document_types", doc.classification.value("document_type"))
    if term is None or not term.is_assessment or term.role != ROLE_STATEMENT:
        return "nao_e_enunciado"
    meta = repo.extraction_meta(doc.blob.sha256)
    if meta is None or not meta.pages:
        return "sem_texto"
    return None


def native_pages(repo: DataRepo, sha256: str) -> set[int]:
    meta = repo.extraction_meta(sha256)
    if meta is None:
        return set()
    return {p.n for p in meta.pages if p.method == "native" and not p.needs_ai_transcription}


def load(repo: DataRepo, sha256: str) -> QuestionSet | None:
    path = repo.layout.questions_path(sha256)
    if not path.exists():
        return None
    return QuestionSet.model_validate(read_yaml(path))


def pending(repo: DataRepo) -> list[Document]:
    """Enunciados que podem ter perguntas e ainda não têm (um por conteúdo)."""
    seen: set[str] = set()
    out: list[Document] = []
    for doc in sorted(repo.documents.values(), key=lambda d: d.id):
        sha = doc.blob.sha256
        if sha in seen or eligibility(repo, doc) is not None:
            continue
        seen.add(sha)
        if repo.layout.questions_path(sha).exists():
            continue
        if not native_pages(repo, sha):
            continue
        out.append(doc)
    return out


# --- texto normalizado, com o caminho de volta ao texto das páginas ------------------------


def normalized(text: str) -> str:
    """Só os espaços e as quebras de linha deixam de contar (e a forma Unicode, NFC)."""
    return " ".join(unicodedata.normalize("NFC", text).split())


def text_digest(text: str) -> str:
    return hashlib.sha256(normalized(text).encode("utf-8")).hexdigest()


@dataclass
class _Corpus:
    """O texto de todas as páginas, normalizado, com a página e a posição de cada carácter."""

    text: str
    page_of: list[int]
    index_of: list[int]
    pages: dict[int, str]

    @classmethod
    def build(cls, page_texts: list[str]) -> _Corpus:
        chars: list[str] = []
        page_of: list[int] = []
        index_of: list[int] = []
        pages: dict[int, str] = {}
        for number, raw in enumerate(page_texts, start=1):
            text = unicodedata.normalize("NFC", raw)
            pages[number] = text
            for i, ch in enumerate(text):
                if ch.isspace():
                    if chars and chars[-1] != " ":
                        chars.append(" ")
                        page_of.append(number)
                        index_of.append(i)
                    continue
                chars.append(ch)
                page_of.append(number)
                index_of.append(i)
            if chars and chars[-1] != " ":
                chars.append(" ")
                page_of.append(number)
                index_of.append(len(text))
        while chars and chars[-1] == " ":
            chars.pop()
            page_of.pop()
            index_of.pop()
        return cls("".join(chars), page_of, index_of, pages)

    def find(self, needle: str, start: int) -> int:
        """Primeira ocorrência a partir de `start` que começa e acaba numa fronteira."""
        position = self.text.find(needle, start)
        while position != -1:
            end = position + len(needle)
            before = position == 0 or self.text[position - 1] == " "
            after = end == len(self.text) or self.text[end] == " "
            if before and after:
                return position
            position = self.text.find(needle, position + 1)
        return -1

    def original(self, start: int, end: int) -> tuple[str, list[int]]:
        """O texto das páginas entre duas posições normalizadas, e as páginas tocadas."""
        touched = sorted({self.page_of[i] for i in range(start, end) if self.text[i] != " "})
        parts: list[str] = []
        for page in touched:
            indices = [self.index_of[i] for i in range(start, end)
                       if self.page_of[i] == page and self.text[i] != " "]
            parts.append(self.pages[page][indices[0]:indices[-1] + 1])
        return "\n".join(parts), touched


# --- numeração -----------------------------------------------------------------------------


def _roman(value: str) -> int:
    total = 0
    for i, ch in enumerate(value):
        n = _ROMAN[ch]
        total += -n if i + 1 < len(value) and _ROMAN[value[i + 1]] > n else n
    return total


def _check_numbering(labels: list[str]) -> None:
    if not labels:
        raise QuestionError("sem_perguntas", "a proposta não tem perguntas")
    if len(set(labels)) != len(labels):
        raise QuestionError("numeracao", "há números de pergunta repetidos")
    if all(_LABEL_NUMBER.match(label) for label in labels):
        numbers = [int(label) for label in labels]
        if numbers != list(range(1, len(numbers) + 1)):
            raise QuestionError("numeracao", f"a numeração não é 1, 2, 3…: {labels}")
        return
    groups: list[tuple[int, int]] = []
    for label in labels:
        match = _LABEL_GROUP.match(label)
        if not match:
            raise QuestionError("rotulo_invalido", f"número de pergunta inválido: {label!r} "
                                "(usa 1, 2, 3… ou I.1, I.2, II.1…)")
        groups.append((_roman(match.group(1)), int(match.group(2))))
    expected_group, expected_number = 1, 1
    for group, number in groups:
        if group == expected_group + 1 and number == 1 and expected_number > 1:
            expected_group, expected_number = group, 1
        if (group, number) != (expected_group, expected_number):
            raise QuestionError("numeracao", f"a numeração não está completa: {labels}")
        expected_number += 1


def _number_of(label: str) -> str:
    match = _LABEL_GROUP.match(label)
    return match.group(2) if match else label


def _starts_with_number(text: str, label: str) -> bool:
    number = re.escape(_number_of(label))
    pattern = (rf"^(?:(?:pergunta|quest[aã]o|exerc[ií]cio)\s+{number}\b"
               rf"|{number}\s*(?:[.)ºª:]|-|–))")
    return re.match(pattern, text, re.IGNORECASE) is not None


def _folded(text: str) -> str:
    stripped = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in stripped if not unicodedata.combining(ch)).lower()


def exclusion(text: str) -> Exclusion | None:
    if _GARBLED.search(text):
        return "garbled"
    if _FIGURE.search(_folded(text)):
        return "figure"
    if _MATH.search(text):
        return "math"
    return None


# --- propor --------------------------------------------------------------------------------


def _document(repo: DataRepo, ref: str) -> Document:
    docs = repo.documents
    if ref in docs:
        return docs[ref]
    matches = [d for d in docs.values() if d.id.startswith(ref) or d.blob.sha256 == ref]
    if len(matches) != 1:
        raise QuestionError("documento_inexistente", f"documento não encontrado: {ref}")
    return matches[0]


def _blocks(payload: Any) -> list[dict[str, Any]]:
    blocks = payload.get("blocks") if isinstance(payload, dict) else None
    if not isinstance(blocks, list) or not blocks:
        raise QuestionError("proposta_invalida", "a proposta tem de ter uma lista `blocks`")
    if len(blocks) > MAX_BLOCKS:
        raise QuestionError("proposta_invalida", "demasiados blocos")
    for block in blocks:
        if not isinstance(block, dict) or block.get("kind") not in ("context", "question"):
            raise QuestionError("proposta_invalida",
                                "cada bloco é {kind: context|question, text, label}")
        if not isinstance(block.get("text"), str):
            raise QuestionError("proposta_invalida", "cada bloco tem de ter `text`")
        if block["kind"] == "question" and not isinstance(block.get("label"), str):
            raise QuestionError("proposta_invalida", "cada pergunta tem de ter `label`")
    return blocks


def build(repo: DataRepo, ref: str, payload: Any, by: str = AI_METHOD) -> QuestionSet:
    """Verifica a proposta e devolve o banco de perguntas (sem gravar)."""
    doc = _document(repo, ref)
    reason = eligibility(repo, doc)
    if reason:
        raise QuestionError(reason, f"{doc.display_name}: não pode ter perguntas ({reason})")
    sha = doc.blob.sha256
    blocks = _blocks(payload)
    _check_numbering([b["label"].strip() for b in blocks if b["kind"] == "question"])
    corpus = _Corpus.build(repo.page_texts(sha))
    allowed = native_pages(repo, sha)

    contexts: list[QuestionContext] = []
    questions: list[Question] = []
    cursor = 0
    previous_end: int | None = None
    current: QuestionContext | None = None
    current_group: str | None = None
    for index, block in enumerate(blocks, start=1):
        needle = normalized(block["text"])
        name = block.get("label") or f"bloco {index}"
        if not MIN_CHARS <= len(needle) <= MAX_CHARS:
            raise QuestionError("tamanho", f"{name}: texto demasiado curto ou longo")
        start = corpus.find(needle, cursor)
        if start == -1:
            raise QuestionError("texto_nao_encontrado",
                                f"{name}: o texto não está no ficheiro tal e qual, a seguir ao "
                                "bloco anterior")
        end = start + len(needle)
        gap = corpus.text[previous_end:start] if previous_end is not None else ""
        if previous_end is not None and (len(gap) > GAP_MAX or _QUESTION_START.search(gap)):
            raise QuestionError("intervalo", f"{name}: entre este bloco e o anterior há texto "
                                f"que não está na proposta: {gap.strip()[:80]!r}")
        if _GROUP_HEADER.search(gap):
            current, current_group = None, None
        text, pages = corpus.original(start, end)
        if not set(pages) <= allowed:
            raise QuestionError("pagina_nao_nativa", f"{name}: página sem texto do próprio "
                                f"ficheiro (OCR ou para transcrever): {pages}")
        cursor = previous_end = end
        if block["kind"] == "context":
            label = block.get("label")
            current = QuestionContext(
                id=f"c{len(contexts) + 1}",
                label=label.strip() if isinstance(label, str) and label.strip() else None,
                pages=pages, text=text, text_sha256=text_digest(text),
                excluded=exclusion(needle),
            )
            current_group = None
            contexts.append(current)
            continue
        label = block["label"].strip()
        if not _starts_with_number(needle, label):
            raise QuestionError("comeco", f"a pergunta {label} não começa pelo seu número")
        group = label.split(".")[0] if _LABEL_GROUP.match(label) else None
        if current is not None and current_group is not None and group != current_group:
            current = None  # o caso de um grupo não passa para o seguinte
        if current is not None and current_group is None:
            current_group = group
        own = exclusion(needle)
        excluded = own or (current.excluded if current is not None else None)
        questions.append(Question(
            id=label, label=label, order=len(questions) + 1,
            context=current.id if current is not None else None,
            pages=pages, text=text, text_sha256=text_digest(text), excluded=excluded,
        ))
    tail = corpus.text[previous_end or 0:]
    if len(tail) > TAIL_MAX or _QUESTION_START.search(tail):
        raise QuestionError("fim", "depois da última pergunta ainda há texto que pode ser uma "
                            f"pergunta ou parte dela: {tail.strip()[:80]!r}")
    if blocks[-1]["kind"] != "question":
        raise QuestionError("proposta_invalida", "o último bloco tem de ser uma pergunta")

    used = sorted({p for q in questions for p in q.pages} | {p for c in contexts for p in c.pages})
    qset = QuestionSet(
        sha256=sha,
        generated=Generated(by=by, at=clock.now(),
                            sources=[SourceRef(sha256=sha, page=p) for p in used]),
        contexts=contexts, questions=questions,
    )
    _keep_reviews(qset, load(repo, sha))
    return qset


def _keep_reviews(new: QuestionSet, old: QuestionSet | None) -> None:
    """As decisões de quem verificou ficam, se o texto da pergunta for o mesmo."""
    if old is None:
        return
    reviews = {q.text_sha256: q.review for q in old.questions if q.review is not None}
    for question in new.questions:
        if question.text_sha256 in reviews:
            question.review = reviews[question.text_sha256]
    # O resto (a data da proposta) só muda se as perguntas mudarem: idempotente (regra 4).
    if old.contexts == new.contexts and old.questions == new.questions:
        new.generated = old.generated


def propose(repo: DataRepo, ref: str, payload: Any, by: str = AI_METHOD) -> QuestionSet:
    qset = build(repo, ref, payload, by)
    write_yaml_if_changed(repo.layout.questions_path(qset.sha256), qset)
    return qset


def review(repo: DataRepo, ref: str, label: str, status: str, by: str) -> QuestionSet:
    """Confirmar ou rejeitar uma pergunta (o mesmo que a interface grava)."""
    doc = _document(repo, ref)
    qset = load(repo, doc.blob.sha256)
    if qset is None:
        raise QuestionError("sem_perguntas", f"{doc.display_name} ainda não tem perguntas")
    if status not in ("confirmed", "rejected"):
        raise QuestionError("estado_invalido", "o estado é confirmed ou rejected")
    question = next((q for q in qset.questions if q.label == label), None)
    if question is None:
        raise QuestionError("pergunta_inexistente", f"pergunta {label} não existe")
    question.review = QuestionReview(status=status, by=by, at=clock.now())
    write_yaml_if_changed(repo.layout.questions_path(qset.sha256), qset)
    return qset


def still_in_file(repo: DataRepo, qset: QuestionSet) -> set[str]:
    """As perguntas cujo texto (e o do caso) ainda está no ficheiro tal e qual (uma nova
    extracção pode mudar o texto: o que deixou de bater não se mostra)."""
    corpus = _Corpus.build(repo.page_texts(qset.sha256))
    allowed = native_pages(repo, qset.sha256)
    present = {c.id for c in qset.contexts
               if corpus.find(normalized(c.text), 0) != -1 and set(c.pages) <= allowed}
    return {
        q.id for q in qset.questions
        if corpus.find(normalized(q.text), 0) != -1 and set(q.pages) <= allowed
        and (q.context is None or q.context in present)
    }


def describe(repo: DataRepo, doc: Document) -> dict[str, Any]:
    meta = repo.extraction_meta(doc.blob.sha256)
    return {
        "id": doc.id,
        "sha256": doc.blob.sha256,
        "name": doc.display_name,
        "unit": doc.classification.value("unit"),
        "academic_year": doc.classification.value("academic_year"),
        "exam_season": doc.classification.value("exam_season"),
        "pages": len(meta.pages) if meta else 0,
        "native_pages": sorted(native_pages(repo, doc.blob.sha256)),
    }
