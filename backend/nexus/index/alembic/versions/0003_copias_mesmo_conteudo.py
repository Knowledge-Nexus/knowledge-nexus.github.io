"""documentos com o mesmo conteúdo que outro (cópias)

Revision ID: 0003
Revises: 0002
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("duplicate_of", sa.String(length=36), nullable=True))


def downgrade() -> None:
    op.drop_column("documents", "duplicate_of")
