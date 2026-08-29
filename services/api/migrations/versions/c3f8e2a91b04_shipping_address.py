"""shipping address

Optional street, apartment and postal code on the registry. City was already
there and stays public; these three are the D49 reveal, fetched only when a
guest on the product handoff asks for them.

Revision ID: c3f8e2a91b04
Revises: d08ba1abf896
Create Date: 2026-08-29 14:40:00.000000+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c3f8e2a91b04"
down_revision: str | None = "d08ba1abf896"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("registries", sa.Column("shipping_street", sa.String(length=160), nullable=True))
    op.add_column(
        "registries", sa.Column("shipping_apartment", sa.String(length=80), nullable=True)
    )
    op.add_column(
        "registries", sa.Column("shipping_postal_code", sa.String(length=10), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("registries", "shipping_postal_code")
    op.drop_column("registries", "shipping_apartment")
    op.drop_column("registries", "shipping_street")
