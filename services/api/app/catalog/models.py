"""Chain catalogs, seeded from the harvested snapshot (D22).

Nothing outside this module may hold a foreign key into these tables. When the
couple adds a catalog item to a registry, the fields are *copied* onto the
registry item, because the gift the guest sees must not change when a chain
renames or reprices a product. That is the one rule this module exists to keep.

There is no stock column (D26): availability captured once is stale within the
hour, and a wrong "אזל מהמלאי" costs the same trust as a wrong price.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

CATEGORIES = ("linens", "feeding", "mobility", "bath", "clothing", "toys")


class Chain(Base):
    __tablename__ = "chains"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(40), unique=True)
    name_he: Mapped[str] = mapped_column(String(80))
    site_url: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[list[CatalogItem]] = relationship(back_populates="chain")


class CatalogItem(Base):
    __tablename__ = "catalog_items"
    __table_args__ = (
        # Re-harvesting must update a product, never duplicate it.
        UniqueConstraint("chain_id", "external_id", name="uq_catalog_chain_external"),
        CheckConstraint("price_agorot > 0", name="ck_catalog_price_positive"),
        CheckConstraint(
            f"category IN {CATEGORIES}",
            name="ck_catalog_category",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chain_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chains.id", ondelete="CASCADE"), index=True
    )
    external_id: Mapped[str] = mapped_column(String(64))

    #: Short display name, derived from the retailer's own title.
    title: Mapped[str] = mapped_column(String(200))
    #: The retailer's full title when it differs; it encodes the variant.
    source_title: Mapped[str | None] = mapped_column(String(300), default=None)
    category: Mapped[str] = mapped_column(String(20))
    price_agorot: Mapped[int] = mapped_column(Integer)
    compare_at_agorot: Mapped[int | None] = mapped_column(Integer, default=None)
    canonical_url: Mapped[str] = mapped_column(String(500))
    image_url: Mapped[str] = mapped_column(String(500))
    vendor: Mapped[str | None] = mapped_column(String(120), default=None)
    sku: Mapped[str | None] = mapped_column(String(80), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    chain: Mapped[Chain] = relationship(back_populates="items")
