"""Read path for the public registry page.

An unpublished registry and a wrong slug return the same thing, on purpose
(D30): a guest holds the link only because the couple sent it, and confirming
that a registry exists but is not ready leaks more than a flat "not found".
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.registry.models import Registry, RegistryItem
from app.registry.schemas import PublicItem, PublicRegistry


def to_public_item(item: RegistryItem) -> PublicItem:
    """One item, exactly as any guest may see it.

    Shared with the guest write path, so a reserve response and a page load can
    never disagree about what an item looks like.
    """
    return PublicItem(
        id=item.id,
        kind=item.kind,
        title=item.title,
        source_title=item.source_title,
        note=item.note,
        category=item.category,
        image_url=item.image_url,
        chain_slug=item.chain_slug,
        chain_name_he=item.chain_name_he,
        canonical_url=item.canonical_url,
        price_agorot=item.price_agorot,
        quantity_wanted=item.quantity_wanted,
        quantity_claimed=item.quantity_claimed,
        claim_state=item.claim_state,
        group_gift_enabled=item.group_gift_enabled,
        target_agorot=item.target_agorot,
        contributed_agorot=item.contributed_agorot,
        contributor_count=item.contributor_count,
        subtitle=item.subtitle,
        caption=item.caption,
    )


def get_public_registry(session: Session, slug: str) -> PublicRegistry | None:
    stmt = (
        select(Registry)
        .where(Registry.slug == slug, Registry.published_at.is_not(None))
        .options(selectinload(Registry.items))
    )
    registry = session.execute(stmt).scalar_one_or_none()
    if registry is None:
        return None

    items = [item for item in registry.items if item.is_active]
    products = [item for item in items if item.kind == "product"]

    return PublicRegistry(
        slug=registry.slug,
        couple_names=registry.couple_names,
        story=registry.story,
        cover_image_url=registry.cover_image_url,
        city=registry.city,
        due_date=registry.due_date,
        baby_name=registry.baby_name,
        lifecycle="closed" if registry.closed_at is not None else "published",
        # Progress counts products. An envelope has nothing to complete (D28),
        # so counting it would make a full list unreachable.
        items_total=len(products),
        items_claimed=sum(1 for item in products if item.claim_state != "available"),
        has_shipping_address=bool((registry.shipping_street or "").strip()),
        has_bit=bool((registry.bit_handle or "").strip()),
        has_paybox=bool((registry.paybox_handle or "").strip()),
        items=[to_public_item(item) for item in items],
    )
