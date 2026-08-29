"""Searching the harvested catalog.

`ILIKE` over a few hundred seeded rows, deliberately. A trigram index or
`tsvector` would be the right answer at a hundred thousand rows and is a wrong
answer now: Hebrew stemming is not something to guess at, and the snapshot fits
in a page of memory.

One property is not negotiable even at this size: results are ordered
deterministically. A search that reshuffles between keystrokes reads as broken.
"""

from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.catalog.models import CatalogItem, Chain
from app.catalog.schemas import CatalogPage, CatalogResult

MAX_LIMIT = 48


def search_catalog(
    session: Session,
    *,
    query: str | None = None,
    category: str | None = None,
    chain: str | None = None,
    limit: int = 24,
) -> CatalogPage:
    limit = max(1, min(limit, MAX_LIMIT))

    stmt = select(CatalogItem, Chain.slug, Chain.name_he).join(
        Chain, Chain.id == CatalogItem.chain_id
    )
    counter = (
        select(func.count()).select_from(CatalogItem).join(Chain, Chain.id == CatalogItem.chain_id)
    )

    if query and query.strip():
        # Matches the retailer's full title too: the words a couple types
        # ("אורגני", a brand) often live there rather than in the short title.
        needle = f"%{query.strip()}%"
        where = or_(
            CatalogItem.title.ilike(needle),
            CatalogItem.source_title.ilike(needle),
            CatalogItem.vendor.ilike(needle),
        )
        stmt = stmt.where(where)
        counter = counter.where(where)
    if category:
        stmt = stmt.where(CatalogItem.category == category)
        counter = counter.where(CatalogItem.category == category)
    if chain:
        stmt = stmt.where(Chain.slug == chain)
        counter = counter.where(Chain.slug == chain)

    # Price then id: a stable order that also puts the affordable options first,
    # which is the order a gift list wants.
    stmt = stmt.order_by(CatalogItem.price_agorot, CatalogItem.id).limit(limit)

    rows = session.execute(stmt).all()
    return CatalogPage(
        results=[
            CatalogResult(
                id=item.id,
                title=item.title,
                source_title=item.source_title,
                category=item.category,
                price_agorot=item.price_agorot,
                image_url=item.image_url,
                canonical_url=item.canonical_url,
                chain_slug=chain_slug,
                chain_name_he=chain_name,
            )
            for item, chain_slug, chain_name in rows
        ],
        total=session.execute(counter).scalar_one(),
    )
