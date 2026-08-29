"""Catalog search, for the couple only.

Behind a session even though the data is a public retailer's catalog. Not
because the rows are secret, but because an open, unthrottled search endpoint
over scraped data is a thing other people will point tools at, and there is no
reason to offer it.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.catalog.schemas import CatalogPage
from app.catalog.service import search_catalog
from app.deps import CurrentCouple, DbSessionDep

router = APIRouter(prefix="/api/v1/catalog", tags=["catalog"])


@router.get("/search", response_model=CatalogPage)
def search(
    couple: CurrentCouple,
    session: DbSessionDep,
    q: Annotated[str | None, Query(max_length=80)] = None,
    category: Annotated[str | None, Query(max_length=20)] = None,
    chain: Annotated[str | None, Query(max_length=40)] = None,
    limit: Annotated[int, Query(ge=1, le=48)] = 24,
) -> CatalogPage:
    return search_catalog(session, query=q, category=category, chain=chain, limit=limit)
