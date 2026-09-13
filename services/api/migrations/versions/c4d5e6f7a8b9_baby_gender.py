"""baby gender on registries

Optional boy or girl, or unset. Existing rows stay null.

Revision ID: c4d5e6f7a8b9
Revises: a1b2c3d4e5f6
Create Date: 2026-09-13 21:05:15.000000+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c4d5e6f7a8b9"
down_revision: str | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("registries", sa.Column("baby_gender", sa.String(length=8), nullable=True))
    op.create_check_constraint(
        "ck_registry_baby_gender",
        "registries",
        "baby_gender IS NULL OR baby_gender IN ('boy', 'girl')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_registry_baby_gender", "registries", type_="check")
    op.drop_column("registries", "baby_gender")
