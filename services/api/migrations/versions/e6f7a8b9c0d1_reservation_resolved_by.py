"""resolved_by on reservations

Null until a guest or the couple moves the row. Existing rows stay null.

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-09-30 20:45:00.000000+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e6f7a8b9c0d1"
down_revision: str | None = "d5e6f7a8b9c0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "reservations",
        sa.Column("resolved_by", sa.String(length=6), nullable=True),
    )
    op.create_check_constraint(
        "ck_reservation_resolved_by",
        "reservations",
        "resolved_by IS NULL OR resolved_by IN ('guest', 'couple')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_reservation_resolved_by", "reservations", type_="check")
    op.drop_column("reservations", "resolved_by")
