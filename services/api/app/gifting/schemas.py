"""Request and response models for the guest write path.

A guest write answers with its own action and the item as every guest now sees
it, and nothing else. There is no field here for another guest's hold, name or
amount, so the D8 and D15 lines - state and totals are public, identity and
per-guest amounts are not - hold by construction rather than by review.
"""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.gifting.models import MAX_CONTRIBUTION_AGOROT, MIN_CONTRIBUTION_AGOROT
from app.registry.schemas import PublicItem, WireModel


class ReportRequest(BaseModel):
    model_config = WireModel

    #: D12. `False` is "לא רכשתי", which hands the unit back (D35).
    purchased: bool
    #: Asked as "למי להגיד תודה?", optional, and visible to the couple only (D7).
    giver_name: str | None = Field(default=None, max_length=80)


class ReservationView(BaseModel):
    """What the guest gets back about their own action."""

    model_config = WireModel

    reservation_id: UUID
    state: Literal["held", "purchased", "released"]
    #: The item as the public read path would now return it, so the client can
    #: patch its grid without a second round trip.
    item: PublicItem


class ContributeRequest(BaseModel):
    model_config = WireModel

    #: What the guest says they sent, in agorot. Bounded rather than free, so a
    #: mis-paste cannot land ₪9,999,999 in the couple's tracker.
    amount_agorot: int = Field(ge=MIN_CONTRIBUTION_AGOROT, le=MAX_CONTRIBUTION_AGOROT)


class ContributionView(BaseModel):
    model_config = WireModel

    contribution_id: UUID
    #: Carries the new public total and contributor count. The guest's own
    #: amount is deliberately absent: they know it, and nobody else may.
    item: PublicItem


class BlessingRequest(BaseModel):
    model_config = WireModel

    giver_name: str | None = Field(default=None, max_length=80)
    message: str | None = Field(default=None, max_length=1000)
    #: The gift this blessing came with, so the name lands on it too. Either or
    #: neither; a blessing can also stand alone.
    reservation_id: UUID | None = None
    contribution_id: UUID | None = None

    @model_validator(mode="after")
    def _not_empty(self) -> BlessingRequest:
        """Skipping the blessing sheet must not create a blank row."""
        if not (self.giver_name or "").strip() and not (self.message or "").strip():
            raise ValueError("a blessing needs a name or a message")
        return self


class PaymentHandleView(BaseModel):
    """The D13 reveal. Never part of `PublicRegistry`, only ever this endpoint."""

    model_config = WireModel

    method: Literal["bit", "paybox"]
    handle: str
    display_name: str


class ShippingAddressView(BaseModel):
    """The D49 reveal. Never part of `PublicRegistry`, only ever this endpoint."""

    model_config = WireModel

    recipient_name: str
    street: str
    apartment: str | None
    city: str | None
    postal_code: str | None
    #: Ready to paste into the shop's checkout. Newlines, not commas, so a
    #: guest tapping paste fills the fields the way a handwritten address would.
    copy_text: str
