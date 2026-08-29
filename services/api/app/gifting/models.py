"""Reservations: the ledger behind the one number that matters.

`registry_items.quantity_claimed` is the value guests race for, and every row
here is one unit of it. The two must agree, so `tests/test_reserve.py`
reconciles them after every mixed sequence of holds, releases and reports.

**There is no guests table.** A guest is identified to itself by an unguessable
per-registry cookie the web app mints, and that value lands in `guest_id`.
Holding it is the entire authorisation model for reporting or releasing your own
hold, which is all the guest side needs and all D23 allows us to build now.

**Idempotency is a unique key, not a store.** Creating a hold is the only guest
write that is not idempotent by construction - reporting sets a state and
releasing sets a state, so a double tap on either is harmless - so the key is
unique here and a replay returns the reservation the first attempt created.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

#: held      - the guest has the unit and has not said what happened yet (D16)
#: purchased - the guest self-reported buying it (D12)
#: released  - the guest gave the unit back; it no longer counts as claimed
RESERVATION_STATES = ("held", "purchased", "released")

#: The states that occupy a unit of `quantity_claimed`.
OCCUPYING_STATES = ("held", "purchased")


class Reservation(Base):
    __tablename__ = "reservations"
    __table_args__ = (
        CheckConstraint(f"state IN {RESERVATION_STATES}", name="ck_reservation_state"),
        Index("ix_reservations_item", "item_id"),
        Index("ix_reservations_registry_guest", "registry_id", "guest_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("registries.id", ondelete="CASCADE")
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("registry_items.id", ondelete="CASCADE")
    )

    #: The per-registry guest cookie. Never shown to another guest (D8).
    guest_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    state: Mapped[str] = mapped_column(String(12), default="held")

    #: Optional, and asked for as "למי להגיד תודה?" rather than as a login.
    #: Visible to the couple only (D7).
    giver_name: Mapped[str | None] = mapped_column(String(80), default=None)

    #: Unique: a re-POSTed hold must not become a second hold.
    idempotency_key: Mapped[str] = mapped_column(String(64), unique=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    #: When the guest answered "האם רכשת את הפריט?" either way (D12).
    reported_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
