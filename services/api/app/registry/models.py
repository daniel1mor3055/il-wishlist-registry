"""Registries and their items.

Two things here are load-bearing rather than incidental.

**Catalog data is copied, not referenced.** `chain_slug`, `external_id`,
`canonical_url`, `title`, `image_url` and `price_agorot` are snapshotted onto
the item when the couple adds it. No foreign key crosses into `catalog_items`,
so a chain renaming or repricing a product cannot silently change a gift a
guest is looking at.

**Counters are stored, everything else is derived.** `quantity_claimed`,
`contributed_agorot` and `contributor_count` are columns because C3's reserve
path locks them inside one conditional `UPDATE ... RETURNING`, and you cannot
lock a derived value. Every other aspect of item state - is it available, is
the group gift complete, how much is left - is computed from those three.

Lifecycle is two timestamps, not a state machine (D30). `published_at IS NULL`
means guests get "not found", indistinguishable from a wrong slug.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

ITEM_KINDS = ("product", "fund", "voucher")
CLAIM_STATES = ("available", "reserved", "purchased")
PAYMENT_METHODS = ("bit", "paybox")


class Registry(Base):
    __tablename__ = "registries"
    __table_args__ = (
        CheckConstraint(
            f"payment_method IS NULL OR payment_method IN {PAYMENT_METHODS}",
            name="ck_registry_payment_method",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    #: Unique: one registry per couple, which is why the editor's routes are
    #: `/me/registry` and carry no id. A second list is a product question - whose
    #: link is in the group chat? - and there is no evidence for it yet.
    couple_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("couples.id", ondelete="CASCADE"), unique=True
    )

    #: The capability. Readable prefix plus a random suffix, so the link is
    #: recognisable in a WhatsApp group without being guessable.
    slug: Mapped[str] = mapped_column(String(80), unique=True)

    couple_names: Mapped[str] = mapped_column(String(120))
    story: Mapped[str] = mapped_column(Text, default="")
    cover_image_url: Mapped[str | None] = mapped_column(String(500), default=None)
    city: Mapped[str | None] = mapped_column(String(80), default=None)
    #: Private (D49). Revealed to a guest only on the product handoff, never in
    #: the public payload. City above stays the public caption.
    shipping_street: Mapped[str | None] = mapped_column(String(160), default=None)
    shipping_apartment: Mapped[str | None] = mapped_column(String(80), default=None)
    shipping_postal_code: Mapped[str | None] = mapped_column(String(10), default=None)
    due_date: Mapped[date | None] = mapped_column(Date, default=None)
    baby_name: Mapped[str | None] = mapped_column(String(80), default=None)

    #: Null means the couple is still building it. Guests get 404 (D30).
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    #: Revealed to a guest only on explicit interaction (D13). Never part of the
    #: public registry payload, which is what the golden-key test enforces.
    payment_method: Mapped[str | None] = mapped_column(String(10), default=None)
    payment_handle: Mapped[str | None] = mapped_column(String(40), default=None)
    payment_display_name: Mapped[str | None] = mapped_column(String(80), default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    items: Mapped[list[RegistryItem]] = relationship(
        back_populates="registry",
        order_by="RegistryItem.position",
        cascade="all, delete-orphan",
    )


class RegistryItem(Base):
    __tablename__ = "registry_items"
    __table_args__ = (
        CheckConstraint(f"kind IN {ITEM_KINDS}", name="ck_item_kind"),
        CheckConstraint(f"claim_state IN {CLAIM_STATES}", name="ck_item_claim_state"),
        CheckConstraint("quantity_wanted >= 1", name="ck_item_quantity_wanted"),
        # The invariant C3's reserve path defends. A conditional UPDATE cannot
        # oversell what a CHECK will not let it write.
        CheckConstraint(
            "quantity_claimed >= 0 AND quantity_claimed <= quantity_wanted",
            name="ck_item_quantity_claimed",
        ),
        CheckConstraint("contributed_agorot >= 0", name="ck_item_contributed"),
        CheckConstraint("contributor_count >= 0", name="ck_item_contributors"),
        CheckConstraint("target_agorot IS NULL OR target_agorot > 0", name="ck_item_target"),
        # D28, structurally: group gifting is a product's target price, and the
        # cash envelope has no target of any kind.
        CheckConstraint("NOT group_gift_enabled OR kind = 'product'", name="ck_item_group_product"),
        CheckConstraint("kind <> 'fund' OR target_agorot IS NULL", name="ck_item_fund_no_target"),
        Index("ix_registry_items_registry_position", "registry_id", "position"),
        # At most one envelope per registry (D28), enforced by the database
        # rather than by whoever writes the editor's save handler.
        Index(
            "uq_registry_items_one_fund",
            "registry_id",
            unique=True,
            postgresql_where=text("kind = 'fund'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("registries.id", ondelete="CASCADE"), index=True
    )
    position: Mapped[int] = mapped_column(Integer, default=0)
    kind: Mapped[str] = mapped_column(String(10))

    title: Mapped[str] = mapped_column(String(200))
    source_title: Mapped[str | None] = mapped_column(String(300), default=None)
    note: Mapped[str | None] = mapped_column(Text, default=None)
    #: Null for the envelope and vouchers, and for a manually added item.
    category: Mapped[str | None] = mapped_column(String(20), default=None)
    image_url: Mapped[str | None] = mapped_column(String(500), default=None)
    subtitle: Mapped[str | None] = mapped_column(String(200), default=None)
    caption: Mapped[str | None] = mapped_column(String(200), default=None)

    #: Copied from the catalog at add time. No foreign key, deliberately.
    chain_slug: Mapped[str | None] = mapped_column(String(40), default=None)
    chain_name_he: Mapped[str | None] = mapped_column(String(80), default=None)
    external_id: Mapped[str | None] = mapped_column(String(64), default=None)
    canonical_url: Mapped[str | None] = mapped_column(String(500), default=None)
    price_agorot: Mapped[int | None] = mapped_column(Integer, default=None)

    quantity_wanted: Mapped[int] = mapped_column(Integer, default=1)
    quantity_claimed: Mapped[int] = mapped_column(Integer, default=0)
    claim_state: Mapped[str] = mapped_column(String(12), default="available")

    group_gift_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    target_agorot: Mapped[int | None] = mapped_column(Integer, default=None)
    contributed_agorot: Mapped[int] = mapped_column(Integer, default=0)
    contributor_count: Mapped[int] = mapped_column(Integer, default=0)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    registry: Mapped[Registry] = relationship(back_populates="items")
