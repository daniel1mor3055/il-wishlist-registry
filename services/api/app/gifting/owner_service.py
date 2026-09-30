"""The couple's gift tracker read (D52)."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.gifting.models import OCCUPYING_STATES, Blessing, Contribution, Reservation
from app.gifting.owner_schemas import (
    GiftTracker,
    TrackerBlessing,
    TrackerContribution,
    TrackerItem,
    TrackerReservation,
)
from app.gifting.service import GiftingError
from app.identity.models import Couple
from app.registry.models import Registry, RegistryItem

_Gift = Reservation | Contribution


def gift_tracker(session: Session, *, couple: Couple) -> GiftTracker:
    registry = _registry_for(session, couple)
    items = _items_by_id(session, registry.id)
    reservations = _load_reservations(session, registry.id)
    contributions = _load_contributions(session, registry.id)
    blessings = _load_blessings(session, registry.id)
    return _assemble(items, reservations, contributions, blessings)


def _registry_for(session: Session, couple: Couple) -> Registry:
    registry = session.execute(
        select(Registry).where(Registry.couple_id == couple.id)
    ).scalar_one_or_none()
    if registry is None:
        raise GiftingError("no_registry", 404)
    return registry


def _items_by_id(session: Session, registry_id: UUID) -> dict[UUID, RegistryItem]:
    # Hidden items stay in the map: a gift on one is still the couple's to see (D52).
    rows = session.execute(
        select(RegistryItem).where(RegistryItem.registry_id == registry_id)
    ).scalars()
    return {row.id: row for row in rows}


def _load_reservations(session: Session, registry_id: UUID) -> list[Reservation]:
    stmt = select(Reservation).where(
        Reservation.registry_id == registry_id,
        Reservation.state.in_(OCCUPYING_STATES),
    )
    return list(session.execute(stmt).scalars())


def _load_contributions(session: Session, registry_id: UUID) -> list[Contribution]:
    stmt = select(Contribution).where(Contribution.registry_id == registry_id)
    return list(session.execute(stmt).scalars())


def _load_blessings(session: Session, registry_id: UUID) -> list[Blessing]:
    stmt = select(Blessing).where(Blessing.registry_id == registry_id)
    return list(session.execute(stmt).scalars())


def _created(row: _Gift | Blessing) -> tuple[datetime, UUID]:
    return (row.created_at, row.id)


def _reported_or_created(row: Reservation) -> tuple[datetime, UUID]:
    return (row.reported_at or row.created_at, row.id)


def _attached_blessings(gifts: list[_Gift], blessings: list[Blessing]) -> dict[UUID, Blessing]:
    """Newest listed gift for that guest and item; the newest message wins (D52)."""
    by_guest_item: dict[tuple[UUID, UUID], list[_Gift]] = defaultdict(list)
    for gift in gifts:
        by_guest_item[(gift.guest_id, gift.item_id)].append(gift)

    winners: dict[UUID, Blessing] = {}
    for blessing in blessings:
        if blessing.message is None or blessing.item_id is None:
            continue
        matches = by_guest_item.get((blessing.guest_id, blessing.item_id), [])
        if not matches:
            continue
        target = max(matches, key=_created)
        current = winners.get(target.id)
        if current is None or _created(blessing) > _created(current):
            winners[target.id] = blessing
    return winners


def _message(attached: dict[UUID, Blessing], gift_id: UUID) -> str | None:
    blessing = attached.get(gift_id)
    if blessing is None:
        return None
    return blessing.message


def _tracker_item(item: RegistryItem) -> TrackerItem:
    return TrackerItem(
        id=item.id,
        title=item.title,
        kind=item.kind,
        image_url=item.image_url,
        category=item.category,
        is_active=item.is_active,
    )


def _item_if_any(items: dict[UUID, RegistryItem], item_id: UUID | None) -> TrackerItem | None:
    if item_id is None:
        return None
    row = items.get(item_id)
    if row is None:
        return None
    return _tracker_item(row)


def _assemble(
    items: dict[UUID, RegistryItem],
    reservations: list[Reservation],
    contributions: list[Contribution],
    blessings: list[Blessing],
) -> GiftTracker:
    attached = _attached_blessings([*reservations, *contributions], blessings)
    attached_ids = {blessing.id for blessing in attached.values()}

    held = [
        TrackerReservation(
            id=row.id,
            item=_tracker_item(items[row.item_id]),
            state="held",
            giver_name=row.giver_name,
            created_at=row.created_at,
            reported_at=row.reported_at,
            blessing=_message(attached, row.id),
        )
        for row in sorted((row for row in reservations if row.state == "held"), key=_created)
    ]
    purchased = [
        TrackerReservation(
            id=row.id,
            item=_tracker_item(items[row.item_id]),
            state="purchased",
            giver_name=row.giver_name,
            created_at=row.created_at,
            reported_at=row.reported_at,
            blessing=_message(attached, row.id),
        )
        for row in sorted(
            (row for row in reservations if row.state == "purchased"),
            key=_reported_or_created,
            reverse=True,
        )
    ]
    money = [
        TrackerContribution(
            id=row.id,
            item=_tracker_item(items[row.item_id]),
            giver_name=row.giver_name,
            amount_agorot=row.amount_agorot,
            created_at=row.created_at,
            blessing=_message(attached, row.id),
        )
        for row in sorted(contributions, key=_created, reverse=True)
    ]
    loose: list[TrackerBlessing] = []
    for blessing in sorted(blessings, key=_created, reverse=True):
        text = blessing.message
        if text is None or blessing.id in attached_ids:
            continue
        loose.append(
            TrackerBlessing(
                id=blessing.id,
                giver_name=blessing.giver_name,
                message=text,
                created_at=blessing.created_at,
                item=_item_if_any(items, blessing.item_id),
            )
        )
    return GiftTracker(held=held, purchased=purchased, contributions=money, blessings=loose)
