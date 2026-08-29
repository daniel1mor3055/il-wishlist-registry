"""Response models for the public read path.

Privacy is structural here, not a matter of discipline. These models are
hand-written and list every field explicitly; no ORM object is ever returned
from a router, and no model on this path has a field for a giver's name, a
per-guest amount (D8, D15), a blessing (D17) or the couple's payment handle
(D13). `tests/test_public_read.py` asserts the exact key set, so adding a
column cannot quietly widen the payload.

The couple's own view needs the opposite of this - who gave what, and how much
- so it gets its own models when the editor read path lands, rather than a flag
on these.

Field names are camelCase on the wire, matching `apps/web/src/lib/types.ts`.
"""

from __future__ import annotations

from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

WireModel = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class PublicItem(BaseModel):
    model_config = WireModel

    id: UUID
    kind: Literal["product", "fund", "voucher"]
    title: str
    source_title: str | None
    note: str | None
    category: Literal["linens", "feeding", "mobility", "bath", "clothing", "toys"] | None
    image_url: str | None

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
    #: A count. Never the identities, never the individual amounts (D15).
    contributor_count: int

    subtitle: str | None
    caption: str | None


class PublicRegistry(BaseModel):
    model_config = WireModel

    slug: str
    couple_names: str
    story: str
    cover_image_url: str | None
    city: str | None
    due_date: date | None
    baby_name: str | None
    #: Unpublished never reaches a guest, so it is not one of the values (D30).
    lifecycle: Literal["published", "closed"]

    items_total: int
    items_claimed: int

    items: list[PublicItem]
