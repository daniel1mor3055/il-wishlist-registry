"""shipping address lines

Splits כניסה from דירה, and adds קומה plus a free-text note for buildings
that do not fit those three. shipping_apartment stays; it now means apartment
only.

Revision ID: f7a1c4d2e8b0
Revises: c3f8e2a91b04
Create Date: 2026-08-29 15:50:00.000000+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f7a1c4d2e8b0"
down_revision: str | None = "c3f8e2a91b04"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("registries", sa.Column("shipping_entrance", sa.String(length=40), nullable=True))
    op.add_column("registries", sa.Column("shipping_floor", sa.String(length=40), nullable=True))
    op.add_column("registries", sa.Column("shipping_notes", sa.String(length=300), nullable=True))


def downgrade() -> None:
    op.drop_column("registries", "shipping_notes")
    op.drop_column("registries", "shipping_floor")
    op.drop_column("registries", "shipping_entrance")
