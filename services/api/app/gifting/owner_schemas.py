"""Response models for the couple's gift tracker."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.registry.schemas import WireModel


class TrackerItem(BaseModel):
    model_config = WireModel

    id: UUID
    title: str
    kind: Literal["product", "fund"]
    image_url: str | None
    category: str | None
    is_active: bool


class TrackerReservation(BaseModel):
    model_config = WireModel

    id: UUID
    item: TrackerItem
    state: Literal["held", "purchased"]
    resolved_by: Literal["guest", "couple"] | None
    giver_name: str | None
    created_at: datetime
    reported_at: datetime | None
    blessing: str | None


class TrackerContribution(BaseModel):
    model_config = WireModel

    id: UUID
    item: TrackerItem
    giver_name: str | None
    amount_agorot: int
    created_at: datetime
    blessing: str | None


class TrackerBlessing(BaseModel):
    model_config = WireModel

    id: UUID
    giver_name: str | None
    message: str
    created_at: datetime
    item: TrackerItem | None


class GiftTracker(BaseModel):
    """Who gave what. No guest cookie, payment handle, or shipping data (D52)."""

    model_config = WireModel

    held: list[TrackerReservation]
    purchased: list[TrackerReservation]
    contributions: list[TrackerContribution]
    blessings: list[TrackerBlessing]
