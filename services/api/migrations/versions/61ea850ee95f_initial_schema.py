"""initial schema

Couples, registries and their items, plus the harvested chain catalog. Written
by autogenerate against the models, so the CHECK constraints below are the ones
documented there rather than a hand-rolled second version of them.

Revision ID: 61ea850ee95f
Revises:
Create Date: 2026-08-29 09:19:42.429045+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "61ea850ee95f"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "chains",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("slug", sa.String(length=40), nullable=False),
        sa.Column("name_he", sa.String(length=80), nullable=False),
        sa.Column("site_url", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_table(
        "couples",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "catalog_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("chain_id", sa.UUID(), nullable=False),
        sa.Column("external_id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("source_title", sa.String(length=300), nullable=True),
        sa.Column("category", sa.String(length=20), nullable=False),
        sa.Column("price_agorot", sa.Integer(), nullable=False),
        sa.Column("compare_at_agorot", sa.Integer(), nullable=True),
        sa.Column("canonical_url", sa.String(length=500), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column("vendor", sa.String(length=120), nullable=True),
        sa.Column("sku", sa.String(length=80), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "category IN ('linens', 'feeding', 'mobility', 'bath', 'clothing', 'toys')",
            name="ck_catalog_category",
        ),
        sa.CheckConstraint("price_agorot > 0", name="ck_catalog_price_positive"),
        sa.ForeignKeyConstraint(["chain_id"], ["chains.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("chain_id", "external_id", name="uq_catalog_chain_external"),
    )
    op.create_index(op.f("ix_catalog_items_chain_id"), "catalog_items", ["chain_id"], unique=False)
    op.create_table(
        "registries",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("couple_id", sa.UUID(), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("couple_names", sa.String(length=120), nullable=False),
        sa.Column("story", sa.Text(), nullable=False),
        sa.Column("cover_image_url", sa.String(length=500), nullable=True),
        sa.Column("city", sa.String(length=80), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("baby_name", sa.String(length=80), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("payment_method", sa.String(length=10), nullable=True),
        sa.Column("payment_handle", sa.String(length=40), nullable=True),
        sa.Column("payment_display_name", sa.String(length=80), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "payment_method IS NULL OR payment_method IN ('bit', 'paybox')",
            name="ck_registry_payment_method",
        ),
        sa.ForeignKeyConstraint(["couple_id"], ["couples.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_registries_couple_id"), "registries", ["couple_id"], unique=False)
    op.create_table(
        "registry_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("registry_id", sa.UUID(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(length=10), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("source_title", sa.String(length=300), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=20), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("subtitle", sa.String(length=200), nullable=True),
        sa.Column("caption", sa.String(length=200), nullable=True),
        sa.Column("chain_slug", sa.String(length=40), nullable=True),
        sa.Column("chain_name_he", sa.String(length=80), nullable=True),
        sa.Column("external_id", sa.String(length=64), nullable=True),
        sa.Column("canonical_url", sa.String(length=500), nullable=True),
        sa.Column("price_agorot", sa.Integer(), nullable=True),
        sa.Column("quantity_wanted", sa.Integer(), nullable=False),
        sa.Column("quantity_claimed", sa.Integer(), nullable=False),
        sa.Column("claim_state", sa.String(length=12), nullable=False),
        sa.Column("group_gift_enabled", sa.Boolean(), nullable=False),
        sa.Column("target_agorot", sa.Integer(), nullable=True),
        sa.Column("contributed_agorot", sa.Integer(), nullable=False),
        sa.Column("contributor_count", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "NOT group_gift_enabled OR kind = 'product'", name="ck_item_group_product"
        ),
        sa.CheckConstraint(
            "claim_state IN ('available', 'reserved', 'purchased')", name="ck_item_claim_state"
        ),
        sa.CheckConstraint(
            "kind <> 'fund' OR target_agorot IS NULL", name="ck_item_fund_no_target"
        ),
        sa.CheckConstraint("kind IN ('product', 'fund')", name="ck_item_kind"),
        sa.CheckConstraint("contributed_agorot >= 0", name="ck_item_contributed"),
        sa.CheckConstraint("contributor_count >= 0", name="ck_item_contributors"),
        sa.CheckConstraint(
            "quantity_claimed >= 0 AND quantity_claimed <= quantity_wanted",
            name="ck_item_quantity_claimed",
        ),
        sa.CheckConstraint("quantity_wanted >= 1", name="ck_item_quantity_wanted"),
        sa.CheckConstraint("target_agorot IS NULL OR target_agorot > 0", name="ck_item_target"),
        sa.ForeignKeyConstraint(["registry_id"], ["registries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_registry_items_registry_id"), "registry_items", ["registry_id"], unique=False
    )
    op.create_index(
        "ix_registry_items_registry_position",
        "registry_items",
        ["registry_id", "position"],
        unique=False,
    )
    # At most one cash envelope per registry (D28).
    op.create_index(
        "uq_registry_items_one_fund",
        "registry_items",
        ["registry_id"],
        unique=True,
        postgresql_where=sa.text("kind = 'fund'"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_registry_items_one_fund",
        table_name="registry_items",
        postgresql_where=sa.text("kind = 'fund'"),
    )
    op.drop_index("ix_registry_items_registry_position", table_name="registry_items")
    op.drop_index(op.f("ix_registry_items_registry_id"), table_name="registry_items")
    op.drop_table("registry_items")
    op.drop_index(op.f("ix_registries_couple_id"), table_name="registries")
    op.drop_table("registries")
    op.drop_index(op.f("ix_catalog_items_chain_id"), table_name="catalog_items")
    op.drop_table("catalog_items")
    op.drop_table("couples")
    op.drop_table("chains")
