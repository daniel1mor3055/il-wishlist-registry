"""independent bit and paybox handles

Bit and PayBox are two phone numbers, not one XOR method. A filled handle
is the rail; an empty one is off.

Revision ID: a1b2c3d4e5f6
Revises: f7a1c4d2e8b0
Create Date: 2026-09-13 20:56:00.000000+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "f7a1c4d2e8b0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("registries", sa.Column("bit_handle", sa.String(length=40), nullable=True))
    op.add_column("registries", sa.Column("paybox_handle", sa.String(length=40), nullable=True))
    op.execute(
        """
        UPDATE registries
        SET bit_handle = payment_handle
        WHERE payment_method = 'bit'
        """
    )
    op.execute(
        """
        UPDATE registries
        SET paybox_handle = payment_handle
        WHERE payment_method = 'paybox'
        """
    )
    op.drop_constraint("ck_registry_payment_method", "registries", type_="check")
    op.drop_column("registries", "payment_method")
    op.drop_column("registries", "payment_handle")


def downgrade() -> None:
    op.add_column("registries", sa.Column("payment_method", sa.String(length=10), nullable=True))
    op.add_column("registries", sa.Column("payment_handle", sa.String(length=40), nullable=True))
    op.execute(
        """
        UPDATE registries
        SET payment_method = 'bit', payment_handle = bit_handle
        WHERE bit_handle IS NOT NULL
        """
    )
    op.execute(
        """
        UPDATE registries
        SET payment_method = 'paybox', payment_handle = paybox_handle
        WHERE bit_handle IS NULL AND paybox_handle IS NOT NULL
        """
    )
    op.create_check_constraint(
        "ck_registry_payment_method",
        "registries",
        "payment_method IS NULL OR payment_method IN ('bit', 'paybox')",
    )
    op.drop_column("registries", "paybox_handle")
    op.drop_column("registries", "bit_handle")
