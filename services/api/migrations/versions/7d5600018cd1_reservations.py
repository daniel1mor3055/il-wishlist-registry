"""reservations

The ledger behind `registry_items.quantity_claimed`. One row is one unit of one
item held by one guest, and the unique `idempotency_key` is what stops a double
tap or a back-button re-POST from becoming a second hold.

No guests table: a guest is its own per-registry cookie, and that value is
`guest_id` here.

Revision ID: 7d5600018cd1
Revises: 61ea850ee95f
Create Date: 2026-08-29 09:54:38.080530+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "7d5600018cd1"
down_revision: str | None = "61ea850ee95f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "reservations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("registry_id", sa.UUID(), nullable=False),
        sa.Column("item_id", sa.UUID(), nullable=False),
        sa.Column("guest_id", sa.UUID(), nullable=False),
        sa.Column("state", sa.String(length=12), nullable=False),
        sa.Column("giver_name", sa.String(length=80), nullable=True),
        sa.Column("idempotency_key", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("reported_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "state IN ('held', 'purchased', 'released')", name="ck_reservation_state"
        ),
        sa.ForeignKeyConstraint(["item_id"], ["registry_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["registry_id"], ["registries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("idempotency_key"),
    )
    op.create_index("ix_reservations_item", "reservations", ["item_id"], unique=False)
    op.create_index(
        "ix_reservations_registry_guest", "reservations", ["registry_id", "guest_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_reservations_registry_guest", table_name="reservations")
    op.drop_index("ix_reservations_item", table_name="reservations")
    op.drop_table("reservations")
