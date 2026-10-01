"""conjuntos de ficheiros que vão juntos

Revision ID: 0004
Revises: 0003
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("bundle_id", sa.String(length=80), nullable=True))
    op.add_column("documents", sa.Column("bundle_name", sa.Text(), nullable=True))
    op.add_column("documents", sa.Column("bundle_method", sa.String(length=40), nullable=True))
    op.add_column("documents", sa.Column("bundle_lead", sa.String(length=36), nullable=True))


def downgrade() -> None:
    for column in ("bundle_lead", "bundle_method", "bundle_name", "bundle_id"):
        op.drop_column("documents", column)
