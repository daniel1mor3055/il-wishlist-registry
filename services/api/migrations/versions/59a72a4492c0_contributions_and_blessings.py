"""contributions and blessings

Revision ID: 59a72a4492c0
Revises: 7d5600018cd1
Create Date: 2026-08-29 10:55:48.468360+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "59a72a4492c0"
down_revision: str | None = "7d5600018cd1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "blessings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("registry_id", sa.UUID(), nullable=False),
        sa.Column("item_id", sa.UUID(), nullable=True),
        sa.Column("guest_id", sa.UUID(), nullable=False),
        sa.Column("giver_name", sa.String(length=80), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("idempotency_key", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "giver_name IS NOT NULL OR message IS NOT NULL", name="ck_blessing_not_empty"
        ),
        sa.ForeignKeyConstraint(["item_id"], ["registry_items.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["registry_id"], ["registries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("idempotency_key"),
    )
    op.create_index("ix_blessings_registry", "blessings", ["registry_id"], unique=False)
    op.create_table(
        "contributions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("registry_id", sa.UUID(), nullable=False),
        sa.Column("item_id", sa.UUID(), nullable=False),
        sa.Column("guest_id", sa.UUID(), nullable=False),
        sa.Column("amount_agorot", sa.Integer(), nullable=False),
        sa.Column("giver_name", sa.String(length=80), nullable=True),
        sa.Column("idempotency_key", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("amount_agorot BETWEEN 100 AND 10000000", name="ck_contribution_amount"),
        sa.ForeignKeyConstraint(["item_id"], ["registry_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["registry_id"], ["registries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("idempotency_key"),
    )
    op.create_index("ix_contributions_item", "contributions", ["item_id"], unique=False)
    op.create_index(
        "ix_contributions_registry_guest",
        "contributions",
        ["registry_id", "guest_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_contributions_registry_guest", table_name="contributions")
    op.drop_index("ix_contributions_item", table_name="contributions")
    op.drop_table("contributions")
    op.drop_index("ix_blessings_registry", table_name="blessings")
    op.drop_table("blessings")
