"""Every write the couple makes: create the list, fill it, tune it, publish it.

Three rules run through the whole file and are worth stating once.

**A guest's action is never silently undone.** Once a unit is held or money has
arrived, the item's shape is not the couple's to change freely: quantity cannot
drop below what is already claimed, an item with history is deactivated rather
than deleted, and group gifting cannot be switched off while contributions are
attached to it. Losing a guest's gift to fix a typo is the one failure this
product cannot absorb.

**Catalog data is copied, never referenced.** The client sends a catalog id and
the fields are read out of the database here. If the browser sent the title and
price, the snapshot in `catalog/models.py` would be a suggestion.

**Ownership is checked on the way in, by query.** Every load filters on the
signed-in couple, so a wrong id and someone else's id are the same `404`. There
is no code path that fetches an item and then compares owners.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.catalog.models import CatalogItem, Chain
from app.identity.models import Couple
from app.registry.models import Registry, RegistryItem
from app.registry.owner_schemas import (
    MAX_ITEMS,
    AddCatalogItemRequest,
    AddManualItemRequest,
    CreateRegistryRequest,
    ItemPatch,
    OwnerItem,
    OwnerRegistry,
    RegistryPatch,
)
from app.registry.slug import build_slug

#: The envelope the wizard offers, worded as D37 settled it.
ENVELOPE_TITLE = "חיבוק בביט / פייבוקס 💛"
ENVELOPE_SUBTITLE = "כל סכום, ישירות אלינו"

#: How many catalog items a chosen starter category contributes.
STARTER_PER_CATEGORY = 3

SLUG_ATTEMPTS = 5


class OwnerError(Exception):
    """An owner write that cannot proceed, as a code the web turns into Hebrew."""

    def __init__(self, code: str, status_code: int) -> None:
        super().__init__(code)
        self.code = code
        self.status_code = status_code


def to_owner_item(item: RegistryItem) -> OwnerItem:
    return OwnerItem(
        id=item.id,
        position=item.position,
        kind=item.kind,
        title=item.title,
        source_title=item.source_title,
        note=item.note,
        category=item.category,
        image_url=item.image_url,
        subtitle=item.subtitle,
        caption=item.caption,
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
        is_active=item.is_active,
    )


def to_owner_registry(registry: Registry) -> OwnerRegistry:
    active_products = [item for item in registry.items if item.is_active and item.kind == "product"]
    return OwnerRegistry(
        id=registry.id,
        slug=registry.slug,
        couple_names=registry.couple_names,
        story=registry.story,
        cover_image_url=registry.cover_image_url,
        city=registry.city,
        due_date=registry.due_date,
        baby_name=registry.baby_name,
        shipping_street=registry.shipping_street,
        shipping_apartment=registry.shipping_apartment,
        shipping_postal_code=registry.shipping_postal_code,
        published_at=registry.published_at,
        closed_at=registry.closed_at,
        payment_method=registry.payment_method,
        payment_handle=registry.payment_handle,
        payment_display_name=registry.payment_display_name,
        items_total=len(active_products),
        items_claimed=sum(1 for item in active_products if item.claim_state != "available"),
        items=[to_owner_item(item) for item in registry.items],
    )


def _load(session: Session, couple: Couple) -> Registry:
    """The couple's registry, or `404`.

    One per couple in the POC, which is why the endpoint is `/me/registry` and
    not `/me/registries`. A second one is a product decision (whose list is the
    link in the group chat?) and there is no evidence for it yet.
    """
    stmt = (
        select(Registry)
        .where(Registry.couple_id == couple.id)
        .options(selectinload(Registry.items))
        .order_by(Registry.created_at)
    )
    registry = session.execute(stmt).scalars().first()
    if registry is None:
        raise OwnerError("no_registry", 404)
    return registry


def get_registry(session: Session, *, couple: Couple) -> OwnerRegistry:
    return to_owner_registry(_load(session, couple))


def create_registry(
    session: Session, *, couple: Couple, body: CreateRegistryRequest
) -> OwnerRegistry:
    """The create wizard's one write.

    Unpublished when it returns. The couple gets a list to look at and a link
    that answers "not found" to everyone including them-as-a-guest, until they
    choose to publish (D30).
    """
    existing = (
        session.execute(select(Registry.id).where(Registry.couple_id == couple.id))
        .scalars()
        .first()
    )
    if existing is not None:
        raise OwnerError("registry_exists", 409)

    registry = Registry(
        couple_id=couple.id,
        slug=_unique_slug(session, body.couple_names),
        couple_names=body.couple_names,
        story="",
        city=body.city,
        shipping_street=body.shipping_street,
        shipping_apartment=body.shipping_apartment,
        shipping_postal_code=body.shipping_postal_code,
        due_date=body.due_date,
    )
    session.add(registry)
    session.flush()

    position = 0
    if body.include_envelope:
        session.add(_envelope(registry.id, position))
        position += 1

    for item in _starter_items(session, body.starter_categories):
        session.add(_from_catalog(registry.id, position, item, quantity_wanted=1, note=None))
        position += 1

    session.commit()
    session.refresh(registry)
    return to_owner_registry(registry)


def _unique_slug(session: Session, couple_names: str) -> str:
    """Retry rather than pre-check: the unique index is the arbiter.

    Eight characters from a 31-letter alphabet is enough that a collision is a
    curiosity, but "enough" is not "never", and a `SELECT` before an `INSERT` is
    not a guarantee anyway.
    """
    for _ in range(SLUG_ATTEMPTS):
        candidate = build_slug(couple_names)
        taken = (
            session.execute(select(Registry.id).where(Registry.slug == candidate)).scalars().first()
        )
        if taken is None:
            return candidate
    raise OwnerError("slug_unavailable", 500)


def _envelope(registry_id: UUID, position: int) -> RegistryItem:
    return RegistryItem(
        registry_id=registry_id,
        position=position,
        kind="fund",
        title=ENVELOPE_TITLE,
        subtitle=ENVELOPE_SUBTITLE,
    )


def _starter_items(session: Session, categories: list[str]) -> list[tuple[CatalogItem, str]]:
    """A few real products per chosen category, spread across the price range.

    Cheapest-first would fill the list with dummies and bibs; a registry needs
    the pram in it too. So: cheapest, middle, dearest of each category, which
    also shows the couple that the range exists.
    """
    picked: list[tuple[CatalogItem, str]] = []
    for category in categories:
        rows = session.execute(
            select(CatalogItem, Chain.name_he)
            .join(Chain, Chain.id == CatalogItem.chain_id)
            .where(CatalogItem.category == category)
            .order_by(CatalogItem.price_agorot)
        ).all()
        if not rows:
            continue
        spread = [0, len(rows) // 2, len(rows) - 1][:STARTER_PER_CATEGORY]
        for index in sorted(set(spread)):
            item, chain_name = rows[index]
            picked.append((item, chain_name))
    return picked


def _from_catalog(
    registry_id: UUID,
    position: int,
    catalog: tuple[CatalogItem, str],
    *,
    quantity_wanted: int,
    note: str | None,
) -> RegistryItem:
    item, chain_name_he = catalog
    return RegistryItem(
        registry_id=registry_id,
        position=position,
        kind="product",
        title=item.title,
        source_title=item.source_title,
        category=item.category,
        image_url=item.image_url,
        chain_slug=None,
        chain_name_he=chain_name_he,
        external_id=item.external_id,
        canonical_url=item.canonical_url,
        price_agorot=item.price_agorot,
        quantity_wanted=quantity_wanted,
        note=note,
    )


def patch_registry(session: Session, *, couple: Couple, body: RegistryPatch) -> OwnerRegistry:
    registry = _load(session, couple)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(registry, field, value)
    session.commit()
    return to_owner_registry(registry)


def publish_registry(session: Session, *, couple: Couple) -> OwnerRegistry:
    """Make the link work.

    Idempotent, and it does not re-stamp `published_at`: publishing twice is a
    double-tap, not a republish, and the first date is the true one.
    """
    registry = _load(session, couple)
    if not any(item.is_active for item in registry.items):
        raise OwnerError("registry_empty", 409)
    if registry.published_at is None:
        registry.published_at = datetime.now(UTC)
    session.commit()
    return to_owner_registry(registry)


def add_catalog_item(session: Session, *, couple: Couple, body: AddCatalogItemRequest) -> OwnerItem:
    registry = _load(session, couple)
    _guard_capacity(registry)

    row = session.execute(
        select(CatalogItem, Chain.name_he)
        .join(Chain, Chain.id == CatalogItem.chain_id)
        .where(CatalogItem.id == body.catalog_item_id)
    ).first()
    if row is None:
        raise OwnerError("catalog_item_not_found", 404)

    item = _from_catalog(
        registry.id,
        _next_position(session, registry.id),
        (row[0], row[1]),
        quantity_wanted=body.quantity_wanted,
        note=body.note,
    )
    session.add(item)
    session.commit()
    return to_owner_item(item)


def add_manual_item(session: Session, *, couple: Couple, body: AddManualItemRequest) -> OwnerItem:
    registry = _load(session, couple)
    _guard_capacity(registry)

    item = RegistryItem(
        registry_id=registry.id,
        position=_next_position(session, registry.id),
        kind="product",
        title=body.title,
        category=body.category,
        note=body.note,
        price_agorot=body.price_agorot,
        canonical_url=body.canonical_url,
        quantity_wanted=body.quantity_wanted,
    )
    session.add(item)
    session.commit()
    return to_owner_item(item)


def add_envelope(session: Session, *, couple: Couple) -> OwnerItem:
    """Add the envelope to a registry that was created without one.

    Exists so declining it in the wizard is not a one-way door. The "at most one
    per registry" rule is the partial unique index, not a check here.
    """
    registry = _load(session, couple)
    _guard_capacity(registry)

    item = _envelope(registry.id, _next_position(session, registry.id))
    session.add(item)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise _constraint_error(exc) from exc
    return to_owner_item(item)


def patch_item(session: Session, *, couple: Couple, item_id: UUID, body: ItemPatch) -> OwnerItem:
    item = _load_item(session, couple, item_id)
    changes = body.model_dump(exclude_unset=True)

    quantity = changes.get("quantity_wanted")
    if quantity is not None and quantity < item.quantity_claimed:
        # Someone is already holding those units. Lowering the number under them
        # would either strand a guest or silently drop a hold.
        raise OwnerError("quantity_below_claimed", 409)

    if "group_gift_enabled" in changes:
        _apply_group_gift(item, enabled=changes.pop("group_gift_enabled"), changes=changes)

    for field, value in changes.items():
        setattr(item, field, value)

    # A price change while the gift is being funded moves the finish line under
    # the guests already walking toward it.
    if "price_agorot" in changes and item.group_gift_enabled:
        item.target_agorot = item.price_agorot

    session.commit()
    return to_owner_item(item)


def _apply_group_gift(item: RegistryItem, *, enabled: bool, changes: dict) -> None:
    """Turn group gifting on or off, with the target following the price.

    The target is not a separate number the couple maintains: it is the price of
    the thing (D28). One number, so it cannot drift from the other.
    """
    if enabled:
        if item.kind != "product":
            raise OwnerError("group_gift_needs_product", 409)
        price = changes.get("price_agorot", item.price_agorot)
        if not price:
            raise OwnerError("group_gift_needs_price", 409)
        if changes.get("quantity_wanted", item.quantity_wanted) > 1:
            # Which of the three would the crowd be funding? Group gifting is one
            # object, several givers.
            raise OwnerError("group_gift_needs_single_unit", 409)
        item.group_gift_enabled = True
        item.target_agorot = price
        return

    if item.contributed_agorot > 0:
        raise OwnerError("group_gift_has_money", 409)
    item.group_gift_enabled = False
    item.target_agorot = None


def remove_item(session: Session, *, couple: Couple, item_id: UUID) -> None:
    """Delete if untouched, hide if a guest has already acted on it.

    Deleting a row with reservations or contributions attached would take a
    guest's gift with it, so history wins over tidiness: the item leaves the
    guest's view and stays in the ledger.
    """
    item = _load_item(session, couple, item_id)
    if item.quantity_claimed > 0 or item.contributed_agorot > 0:
        item.is_active = False
        session.commit()
        return
    session.delete(item)
    session.commit()


def _load_item(session: Session, couple: Couple, item_id: UUID) -> RegistryItem:
    """Ownership is part of the query. Not mine and does not exist are one answer."""
    stmt = (
        select(RegistryItem)
        .join(Registry, Registry.id == RegistryItem.registry_id)
        .where(RegistryItem.id == item_id, Registry.couple_id == couple.id)
    )
    item = session.execute(stmt).scalar_one_or_none()
    if item is None:
        raise OwnerError("item_not_found", 404)
    return item


def _guard_capacity(registry: Registry) -> None:
    if len(registry.items) >= MAX_ITEMS:
        raise OwnerError("too_many_items", 409)


def _next_position(session: Session, registry_id: UUID) -> int:
    highest = session.execute(
        select(func.max(RegistryItem.position)).where(RegistryItem.registry_id == registry_id)
    ).scalar()
    return 0 if highest is None else highest + 1


def _constraint_error(exc: IntegrityError) -> OwnerError:
    """Translate the one database constraint the editor can plausibly hit."""
    if "uq_registry_items_one_fund" in str(exc.orig):
        return OwnerError("envelope_exists", 409)
    return OwnerError("invalid_item", 409)
