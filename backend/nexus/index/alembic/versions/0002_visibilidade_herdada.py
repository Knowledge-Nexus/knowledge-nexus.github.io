"""visibilidade efectiva e herdada da cadeira

Revision ID: 0002
Revises: 0001
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("sharing", sa.JSON(), nullable=False,
                                     server_default="{}"))
    op.add_column(
        "documents",
        sa.Column("visibility_inherited", sa.Boolean(), nullable=False,
                  server_default=sa.true()),
    )


def downgrade() -> None:
    op.drop_column("documents", "visibility_inherited")
    op.drop_column("users", "sharing")
