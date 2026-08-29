"""sessions and login tokens

Also makes one-registry-per-couple structural. The editor's routes are
`/me/registry` and carry no identifier, so the constraint has to live where it
cannot be forgotten. The demo seed gives each of its five registries its own
couple to match.

Revision ID: d08ba1abf896
Revises: 59a72a4492c0
Create Date: 2026-08-29 11:35:47.293104+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d08ba1abf896"
down_revision: str | None = "59a72a4492c0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "login_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_login_tokens_email", "login_tokens", ["email"], unique=False)

    op.create_table(
        "sessions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("couple_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["couple_id"], ["couples.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_sessions_couple", "sessions", ["couple_id"], unique=False)

    # An existing database has the five demo registries hanging off one couple,
    # so the constraint cannot be built over them. They are fixtures, and
    # `npm run seed` rebuilds them from the demo JSON, so the duplicates go: only
    # the earliest registry per couple survives the migration.
    op.execute(
        """
        DELETE FROM registries
         WHERE id IN (
            SELECT id FROM (
                SELECT id, row_number() OVER (
                           PARTITION BY couple_id ORDER BY created_at, id
                       ) AS rank
                  FROM registries
            ) ranked
            WHERE rank > 1
         )
        """
    )
    op.drop_index("ix_registries_couple_id", table_name="registries")
    op.create_unique_constraint("uq_registries_couple_id", "registries", ["couple_id"])


def downgrade() -> None:
    op.drop_constraint("uq_registries_couple_id", "registries", type_="unique")
    op.create_index("ix_registries_couple_id", "registries", ["couple_id"], unique=False)

    op.drop_index("ix_sessions_couple", table_name="sessions")
    op.drop_table("sessions")
    op.drop_index("ix_login_tokens_email", table_name="login_tokens")
    op.drop_table("login_tokens")
