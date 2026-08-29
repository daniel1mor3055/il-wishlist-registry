"""The reserve path. This is the product.

Everything else in the POC is a form over a ledger; this is the ledger. Two
guests tapping "אני קונה את זה" on the last unit within the same second is
normal traffic for a link dropped into a WhatsApp group, and exactly one of them
must win.

The mechanism is one statement:

    UPDATE registry_items
       SET quantity_claimed = quantity_claimed + 1
     WHERE id = :id AND quantity_claimed < quantity_wanted
    RETURNING id

Postgres takes a row lock for the duration of the transaction, so the second
transaction blocks on the first, then re-evaluates the `WHERE` against the
committed row and matches nothing. Zero rows returned is the race being lost,
which is a `409` and never an overbooked item. A read-then-write would pass
every single-user test and oversell the moment two guests overlap;
`ck_item_quantity_claimed` is the second line of defence if this one regresses.

The preflight checks above the update exist only to turn "zero rows" into a
useful error code. They are not the gate.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import case, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.gifting.models import Reservation
from app.gifting.schemas import ReservationView
from app.registry.models import Registry, RegistryItem
from app.registry.service import to_public_item


class GiftingError(Exception):
    """A guest write that cannot proceed, as a code the web turns into Hebrew."""

    def __init__(self, code: str, status_code: int) -> None:
        super().__init__(code)
        self.code = code
        self.status_code = status_code


def _load_registry(session: Session, slug: str) -> Registry:
    """A registry a guest may act on at all.

    Unpublished answers exactly like a wrong slug (D30).
    """
    stmt = select(Registry).where(Registry.slug == slug, Registry.published_at.is_not(None))
    registry = session.execute(stmt).scalar_one_or_none()
    if registry is None:
        raise GiftingError("registry_not_found", 404)
    return registry


def _load_open_registry(session: Session, slug: str) -> Registry:
    """A registry that still accepts *new* holds.

    Reporting and releasing stay open on a closed registry: a guest who already
    holds a unit must always be able to tell the truth about it or hand it back,
    or the ledger ends up permanently wrong about the couple's own list.
    """
    registry = _load_registry(session, slug)
    if registry.closed_at is not None:
        raise GiftingError("registry_closed", 409)
    return registry


def _load_item(session: Session, item_id: UUID) -> RegistryItem:
    item = session.get(RegistryItem, item_id, populate_existing=True)
    if item is None:
        raise GiftingError("item_not_found", 404)
    return item


def _load_reservation(
    session: Session, registry: Registry, reservation_id: UUID, guest_id: UUID
) -> Reservation:
    """Holding the per-registry cookie is the whole authorisation model.

    A wrong guest id is indistinguishable from a wrong reservation id, so this
    cannot be used to discover that someone else's hold exists.
    """
    stmt = select(Reservation).where(
        Reservation.id == reservation_id,
        Reservation.guest_id == guest_id,
        Reservation.registry_id == registry.id,
    )
    reservation = session.execute(stmt).scalar_one_or_none()
    if reservation is None:
        raise GiftingError("reservation_not_found", 404)
    return reservation


def _resettle_claim_state(session: Session, item: RegistryItem) -> None:
    """Derive `claim_state` from the counter and the holds behind it.

    Not full means available, whatever happened to the units already taken. Full
    means reserved while anyone still owes an answer, and purchased once they
    have all answered yes.
    """
    if item.quantity_claimed < item.quantity_wanted:
        item.claim_state = "available"
        return

    still_held = session.execute(
        select(func.count()).where(Reservation.item_id == item.id, Reservation.state == "held")
    ).scalar_one()
    item.claim_state = "reserved" if still_held else "purchased"


def _view(session: Session, reservation: Reservation) -> ReservationView:
    return ReservationView(
        reservation_id=reservation.id,
        state=reservation.state,
        item=to_public_item(_load_item(session, reservation.item_id)),
    )


def reserve_item(
    session: Session,
    *,
    slug: str,
    item_id: UUID,
    guest_id: UUID,
    idempotency_key: str,
) -> tuple[ReservationView, bool]:
    """Take one unit of an item. Returns the view and whether it was created."""
    registry = _load_open_registry(session, slug)

    replay = session.execute(
        select(Reservation).where(Reservation.idempotency_key == idempotency_key)
    ).scalar_one_or_none()
    if replay is not None:
        if replay.guest_id != guest_id or replay.item_id != item_id:
            raise GiftingError("idempotency_key_reused", 409)
        return _view(session, replay), False

    item = _load_item(session, item_id)
    if item.registry_id != registry.id or not item.is_active:
        raise GiftingError("item_not_found", 404)
    if item.kind != "product":
        # Money is given, not held. The envelope and vouchers have no unit to
        # take, and group gifting contributes rather than reserves (D28).
        raise GiftingError("item_not_reservable", 409)

    claimed = session.execute(
        update(RegistryItem)
        .where(
            RegistryItem.id == item_id,
            RegistryItem.registry_id == registry.id,
            RegistryItem.is_active.is_(True),
            RegistryItem.quantity_claimed < RegistryItem.quantity_wanted,
        )
        .values(
            quantity_claimed=RegistryItem.quantity_claimed + 1,
            claim_state=case(
                (
                    RegistryItem.quantity_claimed + 1 >= RegistryItem.quantity_wanted,
                    "reserved",
                ),
                else_="available",
            ),
        )
        .returning(RegistryItem.id)
        .execution_options(synchronize_session=False)
    ).scalar_one_or_none()

    if claimed is None:
        raise GiftingError("item_already_reserved", 409)

    reservation = Reservation(
        registry_id=registry.id,
        item_id=item_id,
        guest_id=guest_id,
        state="held",
        idempotency_key=idempotency_key,
    )
    session.add(reservation)

    try:
        session.commit()
    except IntegrityError:
        # Two identical POSTs in flight at once. The other one won the unique
        # key, and rolling back hands it the increment as well.
        session.rollback()
        winner = session.execute(
            select(Reservation).where(Reservation.idempotency_key == idempotency_key)
        ).scalar_one_or_none()
        if winner is None:
            raise
        return _view(session, winner), False

    return _view(session, reservation), True


def report_reservation(
    session: Session,
    *,
    slug: str,
    reservation_id: UUID,
    guest_id: UUID,
    purchased: bool,
    giver_name: str | None,
) -> ReservationView:
    """D12: the purchase is self-reported, and it is the only evidence we get.

    Idempotent by construction - it sets a state rather than moving a counter -
    which is why this write needs no idempotency key.
    """
    registry = _load_registry(session, slug)
    reservation = _load_reservation(session, registry, reservation_id, guest_id)

    if reservation.state == "released":
        raise GiftingError("reservation_released", 409)

    if giver_name and giver_name.strip():
        reservation.giver_name = giver_name.strip()[:80]
    reservation.reported_at = datetime.now(UTC)
    # "עוד לא" leaves the hold exactly as it was (D16). It is not a decline, and
    # releasing the unit here is what would cause the double buy.
    reservation.state = "purchased" if purchased else "held"
    session.flush()

    _resettle_claim_state(session, _load_item(session, reservation.item_id))
    session.commit()

    return _view(session, reservation)


def release_reservation(
    session: Session,
    *,
    slug: str,
    reservation_id: UUID,
    guest_id: UUID,
) -> None:
    """The guest hands the unit back, and the item goes live for everyone else."""
    registry = _load_registry(session, slug)
    reservation = _load_reservation(session, registry, reservation_id, guest_id)

    if reservation.state == "released":
        return
    if reservation.state == "purchased":
        raise GiftingError("reservation_already_purchased", 409)

    reservation.state = "released"
    reservation.released_at = datetime.now(UTC)

    session.execute(
        update(RegistryItem)
        .where(RegistryItem.id == reservation.item_id, RegistryItem.quantity_claimed > 0)
        .values(quantity_claimed=RegistryItem.quantity_claimed - 1)
        .execution_options(synchronize_session=False)
    )
    session.flush()

    _resettle_claim_state(session, _load_item(session, reservation.item_id))
    session.commit()
