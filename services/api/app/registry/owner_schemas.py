"""Request and response models for the couple's own view.

The mirror image of `schemas.py`. That file exists to keep private things out of
a payload; this one exists to put them in, because the couple owns them: the
lifecycle timestamps, the payment handle, the inactive items a guest never sees.

What is *still* not here is anyone else's private data. Who gave what, and the
blessings they wrote, belong to the gift tracker and arrive with it - a couple
browsing their own list should not be handed the giver names as a side effect of
loading a page. `contributed_agorot` and `contributor_count` are already public,
so they carry no new exposure.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel

WireModel = ConfigDict(alias_generator=to_camel, populate_by_name=True)

Category = Literal["linens", "feeding", "mobility", "bath", "clothing", "toys"]

#: A registry longer than this is not a wishlist, it is a shopping mall. The cap
#: exists so an editor bug cannot fill a table.
MAX_ITEMS = 60
MAX_QUANTITY = 20
#: ₪1 to ₪100,000, in agorot. Wide enough for a stroller, narrow enough that a
#: fat-fingered price is caught here rather than by a confused guest.
MIN_PRICE_AGOROT = 100
MAX_PRICE_AGOROT = 10_000_000


class OwnerItem(BaseModel):
    model_config = WireModel

    id: UUID
    position: int
    kind: Literal["product", "fund", "voucher"]

    title: str
    source_title: str | None
    note: str | None
    category: Category | None
    image_url: str | None
    subtitle: str | None
    caption: str | None

    chain_slug: str | None
    chain_name_he: str | None
    canonical_url: str | None
    price_agorot: int | None

    quantity_wanted: int
    quantity_claimed: int
    claim_state: Literal["available", "reserved", "purchased"]

    group_gift_enabled: bool
    target_agorot: int | None
    contributed_agorot: int
    contributor_count: int

    #: Hidden from guests without being deleted, so a claimed item can leave the
    #: list without taking its history with it.
    is_active: bool


class OwnerRegistry(BaseModel):
    model_config = WireModel

    id: UUID
    slug: str
    couple_names: str
    story: str
    cover_image_url: str | None
    city: str | None
    due_date: date | None
    baby_name: str | None

    published_at: datetime | None
    closed_at: datetime | None

    payment_method: Literal["bit", "paybox"] | None
    payment_handle: str | None
    payment_display_name: str | None

    items_total: int
    items_claimed: int
    items: list[OwnerItem]


class CreateRegistryRequest(BaseModel):
    """What the create wizard collects (PRD ed-C1).

    Three questions and nothing else. Story, cover and payment details are asked
    for later, by the screens that own them.
    """

    model_config = WireModel

    couple_names: str = Field(min_length=2, max_length=120)
    due_date: date | None = None
    city: str | None = Field(default=None, max_length=80)
    #: "מאיפה נתחיל": categories to pre-fill from the catalog, or none for blank.
    starter_categories: list[Category] = Field(default_factory=list, max_length=6)
    #: The envelope is opt-in, and the wizard is where it is offered.
    include_envelope: bool = True

    @field_validator("couple_names", "city")
    @classmethod
    def _trim(cls, value: str | None) -> str | None:
        return value.strip() if value else value


class RegistryPatch(BaseModel):
    """Partial update. Absent means "leave it alone", which is not the same as null."""

    model_config = WireModel

    couple_names: str | None = Field(default=None, min_length=2, max_length=120)
    story: str | None = Field(default=None, max_length=2000)
    city: str | None = Field(default=None, max_length=80)
    due_date: date | None = None
    baby_name: str | None = Field(default=None, max_length=80)
    payment_method: Literal["bit", "paybox"] | None = None
    payment_handle: str | None = Field(default=None, max_length=40)
    payment_display_name: str | None = Field(default=None, max_length=80)


class AddCatalogItemRequest(BaseModel):
    """Add from the seeded catalog. The fields are copied server-side.

    The client sends an id, never the title and price: letting the browser supply
    those would make the snapshot the catalog module exists to protect
    (`catalog/models.py`) a client-side suggestion.
    """

    model_config = WireModel

    catalog_item_id: UUID
    quantity_wanted: int = Field(default=1, ge=1, le=MAX_QUANTITY)
    note: str | None = Field(default=None, max_length=500)


class AddManualItemRequest(BaseModel):
    """Add something the catalog does not have (PRD ed-C3, third tab)."""

    model_config = WireModel

    title: str = Field(min_length=2, max_length=200)
    price_agorot: int | None = Field(default=None, ge=MIN_PRICE_AGOROT, le=MAX_PRICE_AGOROT)
    category: Category | None = None
    note: str | None = Field(default=None, max_length=500)
    quantity_wanted: int = Field(default=1, ge=1, le=MAX_QUANTITY)
    #: A link the couple pasted. Not fetched, not parsed - that is the resolver's
    #: job and it lands later.
    canonical_url: str | None = Field(default=None, max_length=500)

    @field_validator("title", "note")
    @classmethod
    def _trim(cls, value: str | None) -> str | None:
        return value.strip() if value else value


class ItemPatch(BaseModel):
    """Item settings (PRD ed-C4)."""

    model_config = WireModel

    title: str | None = Field(default=None, min_length=2, max_length=200)
    note: str | None = Field(default=None, max_length=500)
    quantity_wanted: int | None = Field(default=None, ge=1, le=MAX_QUANTITY)
    price_agorot: int | None = Field(default=None, ge=MIN_PRICE_AGOROT, le=MAX_PRICE_AGOROT)
    group_gift_enabled: bool | None = None
    is_active: bool | None = None
