"""narrow item kinds to product and fund

Existing rows of the retired kind are deleted before the check is tightened.

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-09-13 21:18:00.000000+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d5e6f7a8b9c0"
down_revision: str | None = "c4d5e6f7a8b9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(sa.text("DELETE FROM registry_items WHERE kind = 'voucher'"))
    op.drop_constraint("ck_item_kind", "registry_items", type_="check")
    op.create_check_constraint(
        "ck_item_kind",
        "registry_items",
        "kind IN ('product', 'fund')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_item_kind", "registry_items", type_="check")
    op.create_check_constraint(
        "ck_item_kind",
        "registry_items",
        "kind IN ('product', 'fund', 'voucher')",
    )
