"""What the add-item screen sees of a chain's catalog."""

from __future__ import annotations

from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

WireModel = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class CatalogResult(BaseModel):
    model_config = WireModel

    id: UUID
    title: str
    source_title: str | None
    category: Literal["linens", "feeding", "mobility", "bath", "clothing", "toys"]
    price_agorot: int
    image_url: str
    canonical_url: str
    chain_slug: str
    chain_name_he: str


class CatalogPage(BaseModel):
    model_config = WireModel

    results: list[CatalogResult]
    #: Total matches, so the screen can say "more than this" honestly.
    total: int


StrictWire = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")

CategoryName = Literal["linens", "feeding", "mobility", "bath", "clothing", "toys"]

UnresolvedReason = Literal[
    "unknown_host",
    "not_product",
    "not_https",
    "fetch_failed",
    "bad_document",
    "missing_price",
]


class ResolveRequest(BaseModel):
    model_config = StrictWire

    url: str = Field(min_length=1, max_length=4000)


class ResolveVariantOption(BaseModel):
    model_config = WireModel

    id: str
    label: str
    price_agorot: int
    image_url: str | None


class ResolveProduct(BaseModel):
    model_config = WireModel

    outcome: Literal["product"]
    chain_slug: str
    chain_name_he: str
    external_id: str
    title: str
    source_title: str | None
    category: CategoryName | None
    image_url: str | None
    price_agorot: int
    canonical_url: str
    variant_id: str | None


class ResolveNeedsVariant(BaseModel):
    model_config = WireModel

    outcome: Literal["needsVariant"]
    chain_slug: str
    chain_name_he: str
    external_id: str
    title: str
    source_title: str | None
    category: CategoryName | None
    image_url: str | None
    canonical_url: str
    variants: list[ResolveVariantOption] = Field(min_length=1)


class ResolveUnresolved(BaseModel):
    model_config = WireModel

    outcome: Literal["unresolved"]
    reason: UnresolvedReason
    url: str


ResolveResult = Annotated[
    ResolveProduct | ResolveNeedsVariant | ResolveUnresolved,
    Field(discriminator="outcome"),
]
