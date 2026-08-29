"""What the add-item screen sees of a chain's catalog."""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict
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
