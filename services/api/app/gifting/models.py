"""The guest-side ledger: reservations, contributions and blessings.

`registry_items.quantity_claimed` is the value guests race for, and every row
here is one unit of it. The two must agree, so `tests/test_reserve.py`
reconciles them after every mixed sequence of holds, releases and reports.

**There is no guests table.** A guest is identified to itself by an unguessable
per-registry cookie the web app mints, and that value lands in `guest_id`.
Holding it is the entire authorisation model for reporting or releasing your own
hold, which is all the guest side needs and all D23 allows us to build now.

**Idempotency is a unique key, not a store.** The two writes that move a
counter - taking a unit and adding money - carry a unique `idempotency_key`, so
a replay returns the row the first attempt created. Reporting and releasing set
a state instead, so a double tap on either is already harmless.

**Money is a record, not a transfer.** A contribution row says "a guest told us
they sent this much" (D11, D12). Nothing here ever touched the money, and the
per-guest amount is private to the couple's tracker (D15).
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

#: ₪1 to ₪100,000. The floor rejects a stray keystroke, the ceiling a runaway
#: paste; neither is a business rule about how much a person may give.
MIN_CONTRIBUTION_AGOROT = 100
MAX_CONTRIBUTION_AGOROT = 10_000_000

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


class Contribution(Base):
    """Money a guest says they sent, toward a group gift or the envelope.

    There is no state column and no hold. A guest reaches this write only after
    seeing the couple's Bit handle and tapping "שלחתי", so the money has already
    left their phone; the row is a record of that, and refusing to write it
    would lose a real gift. Correcting one is the couple's job in the tracker.
    """

    __tablename__ = "contributions"
    __table_args__ = (
        CheckConstraint(
            f"amount_agorot BETWEEN {MIN_CONTRIBUTION_AGOROT} AND {MAX_CONTRIBUTION_AGOROT}",
            name="ck_contribution_amount",
        ),
        Index("ix_contributions_item", "item_id"),
        Index("ix_contributions_registry_guest", "registry_id", "guest_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("registries.id", ondelete="CASCADE")
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("registry_items.id", ondelete="CASCADE")
    )
    guest_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    #: Private to the couple's tracker. `registry_items.contributed_agorot` is
    #: the public aggregate, and it is the only number a guest ever sees (D15).
    amount_agorot: Mapped[int] = mapped_column(Integer)

    giver_name: Mapped[str | None] = mapped_column(String(80), default=None)

    #: Unique: a re-POSTed contribution must not double the total.
    idempotency_key: Mapped[str] = mapped_column(String(64), unique=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Blessing(Base):
    """A message to the couple, private by design (D17).

    No public read path exists for this table and none should. `item_id` is the
    gift it came with, or null for a blessing left on its own.

    Both fields are optional individually and required together: a guest who
    types neither a name nor a message has skipped, and skipping should leave no
    row rather than an empty one.
    """

    __tablename__ = "blessings"
    __table_args__ = (
        CheckConstraint(
            "giver_name IS NOT NULL OR message IS NOT NULL",
            name="ck_blessing_not_empty",
        ),
        Index("ix_blessings_registry", "registry_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("registries.id", ondelete="CASCADE")
    )
    item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("registry_items.id", ondelete="SET NULL"), default=None
    )
    guest_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    giver_name: Mapped[str | None] = mapped_column(String(80), default=None)
    message: Mapped[str | None] = mapped_column(Text, default=None)

    idempotency_key: Mapped[str] = mapped_column(String(64), unique=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
