"""Request and response models for the guest write path.

A guest write answers with its own reservation and the item as every guest now
sees it, and nothing else. There is no field here for another guest's hold, so
the D8 line - reservation state is public, giver identity is not - holds by
construction rather than by review.
"""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.registry.schemas import PublicItem, WireModel


class ReportRequest(BaseModel):
    model_config = WireModel

    #: D12. `False` is "עוד לא" - not a decline, and it keeps the hold.
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
