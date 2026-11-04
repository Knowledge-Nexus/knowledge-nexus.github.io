"""banco de perguntas (fase A)

Revision ID: 0005
Revises: 0004
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "questions",
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("ord", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=32), nullable=False),
        sa.Column("pages", sa.JSON(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("context_id", sa.String(length=16), nullable=True),
        sa.Column("context_label", sa.String(length=120), nullable=True),
        sa.Column("context_text", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("excluded", sa.String(length=16), nullable=True),
        sa.Column("review_status", sa.String(length=16), nullable=True),
        sa.Column("review_by", sa.String(length=120), nullable=True),
        sa.Column("review_at", sa.String(length=32), nullable=True),
        sa.Column("generated_by", sa.String(length=64), nullable=False),
        sa.Column("generated_at", sa.String(length=32), nullable=True),
        sa.PrimaryKeyConstraint("sha256", "id"),
    )


def downgrade() -> None:
    op.drop_table("questions")
