"""Esquema relacional do índice `meta.db` (SQLAlchemy Core, portável para PostgreSQL).

Na arquitectura "só GitHub" esta base é DERIVADA dos ficheiros YAML e reconstruída a
cada execução; o browser lê-a com SQLite em WebAssembly. Na fase 5 (servidor) o mesmo
esquema serve de ponto de partida às migrações Alembic (ver nexus/alembic).

O frontend depende destes nomes de tabela e coluna: qualquer mudança exige subir
`SCHEMA_VERSION` e actualizar `frontend/src/data/sqlite/queries.ts` (teste de contrato).
"""

from __future__ import annotations

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Float,
    Integer,
    MetaData,
    PrimaryKeyConstraint,
    String,
    Table,
    Text,
)

SCHEMA_VERSION = 4

metadata = MetaData()

meta = Table(
    "meta", metadata,
    Column("key", String(64), primary_key=True),
    Column("value", Text, nullable=False),
)

institutions = Table(
    "institutions", metadata,
    Column("slug", String(64), primary_key=True),
    Column("name", Text, nullable=False),
    Column("acronym", String(32)),
)

courses = Table(
    "courses", metadata,
    Column("key", String(130), primary_key=True),
    Column("institution", String(64), nullable=False),
    Column("slug", String(64), nullable=False),
    Column("name", Text, nullable=False),
    Column("degree", String(64)),
)

units = Table(
    "units", metadata,
    Column("key", String(130), primary_key=True),
    Column("institution", String(64), nullable=False),
    Column("slug", String(64), nullable=False),
    Column("code", String(64)),
    Column("name", Text, nullable=False),
    Column("acronym", String(32)),
    Column("ects", Float),
    Column("lecturers", JSON, nullable=False),
)

course_units = Table(
    "course_units", metadata,
    Column("course_key", String(130), nullable=False),
    Column("unit_key", String(130), nullable=False),
    Column("curricular_year", Integer),
    Column("semester", Integer),
    PrimaryKeyConstraint("course_key", "unit_key"),
)

unit_editions = Table(
    "unit_editions", metadata,
    Column("unit_key", String(130), nullable=False),
    Column("academic_year", String(9), nullable=False),
    Column("lecturers", JSON, nullable=False),
    Column("assessment_method", Text),
    Column("assessments", JSON, nullable=False),
    PrimaryKeyConstraint("unit_key", "academic_year"),
)

topics = Table(
    "topics", metadata,
    Column("unit_key", String(130), nullable=False),
    Column("slug", String(64), nullable=False),
    Column("name", Text, nullable=False),
    Column("parent_slug", String(64)),
    Column("sort", Integer, nullable=False),
    PrimaryKeyConstraint("unit_key", "slug"),
)

vocab_terms = Table(
    "vocab_terms", metadata,
    Column("kind", String(32), nullable=False),
    Column("slug", String(64), nullable=False),
    Column("label", Text, nullable=False),
    Column("labels", JSON, nullable=False),
    Column("role", String(16), nullable=False),
    Column("is_assessment", Boolean, nullable=False),
    Column("is_submission", Boolean, nullable=False),
    Column("is_syllabus", Boolean, nullable=False),
    Column("is_fallback", Boolean, nullable=False),
    Column("sort", Integer, nullable=False),
    PrimaryKeyConstraint("kind", "slug"),
)

users = Table(
    "users", metadata,
    Column("login", String(64), primary_key=True),
    Column("name", Text),
    Column("preferences", JSON, nullable=False),
    Column("enrollments", JSON, nullable=False),
    Column("sharing", JSON, nullable=False),
)

documents = Table(
    "documents", metadata,
    Column("id", String(36), primary_key=True),
    Column("owner", String(64), nullable=False, index=True),
    Column("kind", String(16), nullable=False),
    Column("sha256", String(64), nullable=False, index=True),
    Column("size", Integer, nullable=False),
    Column("ext", String(16), nullable=False),
    Column("mime", String(128), nullable=False),
    Column("original_path", String(64), nullable=False),
    Column("parent", String(36)),
    Column("duplicate_of", String(36)),  # cópia (mesmo texto) de outro documento
    # conjunto de ficheiros que vão juntos (enunciado + código + imagens)
    Column("bundle_id", String(80)),
    Column("bundle_name", Text),
    Column("bundle_method", String(40)),
    Column("bundle_lead", String(36)),
    Column("visibility", String(80), nullable=False),  # visibilidade efectiva
    Column("visibility_inherited", Boolean, nullable=False),  # vem da cadeira
    Column("status", String(16), nullable=False),
    Column("display_name", Text, nullable=False),
    Column("source_path", Text),
    Column("batch", String(64)),
    Column("created_at", String(32)),
    Column("unit", String(130), index=True),
    Column("course", String(130)),
    Column("document_type", String(64)),
    Column("academic_year", String(9)),
    Column("assessment_type", String(64)),
    Column("exam_season", String(64)),
    Column("assessment_number", Integer),
    Column("role", String(16)),
    Column("solution_origin", String(64)),
    Column("confidence", Float),
    Column("needs_review", Boolean, nullable=False),
    Column("review_reasons", JSON, nullable=False),
    Column("classification", JSON, nullable=False),
    Column("sources", JSON, nullable=False),
    Column("history", JSON, nullable=False),
    Column("manifest", JSON),
    Column("notes", Text, nullable=False),
    Column("pages", Integer, nullable=False),
    Column("words", Integer, nullable=False),
    Column("rendition", String(80)),
    Column("pages_needing_transcription", Integer, nullable=False),
)

near_duplicates = Table(
    "near_duplicates", metadata,
    Column("doc_a", String(36), nullable=False),
    Column("doc_b", String(36), nullable=False),
    Column("distance", Integer, nullable=False),
    Column("score", Float, nullable=False),
    PrimaryKeyConstraint("doc_a", "doc_b"),
)

proposals = Table(
    "proposals", metadata,
    Column("id", String(80), primary_key=True),
    Column("kind", String(16), nullable=False),
    Column("status", String(16), nullable=False),
    Column("name", Text, nullable=False),
    Column("data", JSON, nullable=False),
    Column("evidence", JSON, nullable=False),
    Column("created_at", String(32)),
)

extractions = Table(
    "extractions", metadata,
    Column("sha256", String(64), primary_key=True),
    Column("extractor", String(32), nullable=False),
    Column("extractor_version", Integer, nullable=False),
    Column("pages", JSON, nullable=False),
    Column("metadata", JSON, nullable=False),
    Column("warnings", JSON, nullable=False),
)

# pesquisa.db (FTS5) é criada com SQL próprio do SQLite: ver nexus/index/search.py.
