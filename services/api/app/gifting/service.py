"""Every guest write: taking a unit, sending money, saying thank you.

The reserve path at the top of this file is the product. Two guests tapping
"אני קונה את זה" on the last unit within the same second is normal traffic for a
link dropped into a WhatsApp group, and exactly one of them must win.

The money path below it looks similar and is not: contributions have no scarce
resource to race for, so the atomic statement there is about not losing an
addition rather than about picking a winner.

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

from app.gifting.models import Blessing, Contribution, Reservation
from app.gifting.schemas import (
    ContributionView,
    HoldView,
    MyHoldsView,
    PaymentHandleView,
    PaymentRailView,
    ReservationView,
    ShippingAddressView,
)
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


def _load_contribution(
    session: Session, registry: Registry, contribution_id: UUID, guest_id: UUID
) -> Contribution:
    """Same rule as a reservation: the cookie owns the row or the row is absent."""
    stmt = select(Contribution).where(
        Contribution.id == contribution_id,
        Contribution.guest_id == guest_id,
        Contribution.registry_id == registry.id,
    )
    contribution = session.execute(stmt).scalar_one_or_none()
    if contribution is None:
        raise GiftingError("contribution_not_found", 404)
    return contribution


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

    `purchased=False` is an explicit "לא רכשתי" and hands the unit back (D35).
    The guest who is still at the shop does not answer this question at all -
    they dismiss it, and their hold stands untouched.

    Idempotent either way, because both branches set a state rather than moving
    a counter by a delta. That is why this write needs no idempotency key.
    """
    registry = _load_registry(session, slug)
    reservation = _load_reservation(session, registry, reservation_id, guest_id)

    if reservation.state == "released":
        # Claiming a purchase after giving the unit up is a contradiction. Saying
        # "no" twice is not, so a retried decline answers rather than errors.
        if purchased:
            raise GiftingError("reservation_released", 409)
        return _view(session, reservation)

    if giver_name and giver_name.strip():
        reservation.giver_name = giver_name.strip()[:80]
    reservation.reported_at = datetime.now(UTC)

    if purchased:
        reservation.state = "purchased"
        session.flush()
    else:
        _hand_back(session, reservation)

    _resettle_claim_state(session, _load_item(session, reservation.item_id))
    session.commit()

    return _view(session, reservation)


def _hand_back(session: Session, reservation: Reservation) -> None:
    """Give the unit up. Conditional on the counter, so it can never go negative."""
    reservation.state = "released"
    reservation.released_at = datetime.now(UTC)

    session.execute(
        update(RegistryItem)
        .where(RegistryItem.id == reservation.item_id, RegistryItem.quantity_claimed > 0)
        .values(quantity_claimed=RegistryItem.quantity_claimed - 1)
        .execution_options(synchronize_session=False)
    )
    session.flush()


def release_reservation(
    session: Session,
    *,
    slug: str,
    reservation_id: UUID,
    guest_id: UUID,
) -> None:
    """The guest abandons the handoff sheet, before ever reaching the question."""
    registry = _load_registry(session, slug)
    reservation = _load_reservation(session, registry, reservation_id, guest_id)

    if reservation.state == "released":
        return
    if reservation.state == "purchased":
        raise GiftingError("reservation_already_purchased", 409)

    _hand_back(session, reservation)
    _resettle_claim_state(session, _load_item(session, reservation.item_id))
    session.commit()


#: Money can only go where the couple pointed it: the one cash envelope, or a
#: product the couple opened for group gifting (D28).
def _load_money_item(session: Session, registry: Registry, item_id: UUID) -> RegistryItem:
    item = _load_item(session, item_id)
    if item.registry_id != registry.id or not item.is_active:
        raise GiftingError("item_not_found", 404)
    if item.kind != "fund" and not item.group_gift_enabled:
        raise GiftingError("item_takes_no_money", 409)
    return item


def _contribution_view(session: Session, contribution: Contribution) -> ContributionView:
    return ContributionView(
        contribution_id=contribution.id,
        item=to_public_item(_load_item(session, contribution.item_id)),
    )


def contribute(
    session: Session,
    *,
    slug: str,
    item_id: UUID,
    guest_id: UUID,
    idempotency_key: str,
    amount_agorot: int,
) -> tuple[ContributionView, bool]:
    """Record money a guest says they sent. Returns the view and whether it was new.

    Unlike taking a unit, this has no race to lose. The increment is still one
    atomic statement so concurrent gifts cannot lose each other's addition, but
    there is deliberately no upper bound to check: the guest sent the money
    before they got here, so the only choice is between recording a real gift
    and dropping it. Overshooting a group gift's target is the couple's happy
    problem, not an error the guest should be shown.
    """
    registry = _load_open_registry(session, slug)

    replay = session.execute(
        select(Contribution).where(Contribution.idempotency_key == idempotency_key)
    ).scalar_one_or_none()
    if replay is not None:
        if replay.guest_id != guest_id or replay.item_id != item_id:
            raise GiftingError("idempotency_key_reused", 409)
        return _contribution_view(session, replay), False

    item = _load_money_item(session, registry, item_id)

    contribution = Contribution(
        registry_id=registry.id,
        item_id=item.id,
        guest_id=guest_id,
        amount_agorot=amount_agorot,
        idempotency_key=idempotency_key,
    )
    session.add(contribution)

    session.execute(
        update(RegistryItem)
        .where(RegistryItem.id == item.id)
        .values(
            contributed_agorot=RegistryItem.contributed_agorot + amount_agorot,
            contributor_count=RegistryItem.contributor_count + 1,
        )
        .execution_options(synchronize_session=False)
    )

    try:
        session.commit()
    except IntegrityError:
        # Two identical POSTs in flight. The other one won the unique key, and
        # rolling back hands it the increment too.
        session.rollback()
        winner = session.execute(
            select(Contribution).where(Contribution.idempotency_key == idempotency_key)
        ).scalar_one_or_none()
        if winner is None:
            raise
        return _contribution_view(session, winner), False

    return _contribution_view(session, contribution), True


def add_blessing(
    session: Session,
    *,
    slug: str,
    guest_id: UUID,
    idempotency_key: str,
    giver_name: str | None,
    message: str | None,
    reservation_id: UUID | None,
    contribution_id: UUID | None,
) -> None:
    """A private message to the couple (D17), and the moment a name is recorded.

    "למי להגיד תודה?" is asked once, here (D36), so this is also where the name
    reaches the gift it belongs to. Nothing comes back: there is no guest-facing
    read path for a blessing, and answering with the row would create one.

    Stays open on a closed registry, like reporting does - a guest finishing a
    flow they started should not be told their thank-you note is too late.
    """
    registry = _load_registry(session, slug)

    replay = session.execute(
        select(Blessing).where(Blessing.idempotency_key == idempotency_key)
    ).scalar_one_or_none()
    if replay is not None:
        return

    name = (giver_name or "").strip()[:80] or None
    text_ = (message or "").strip() or None

    item_id: UUID | None = None

    if reservation_id is not None:
        reservation = _load_reservation(session, registry, reservation_id, guest_id)
        item_id = reservation.item_id
        if name:
            reservation.giver_name = name

    if contribution_id is not None:
        contribution = _load_contribution(session, registry, contribution_id, guest_id)
        item_id = contribution.item_id
        if name:
            contribution.giver_name = name

    session.add(
        Blessing(
            registry_id=registry.id,
            item_id=item_id,
            guest_id=guest_id,
            giver_name=name,
            message=text_,
            idempotency_key=idempotency_key,
        )
    )

    try:
        session.commit()
    except IntegrityError:
        # A replayed submit that arrived while the first was still committing.
        session.rollback()


def list_my_holds(session: Session, *, slug: str, guest_id: UUID) -> MyHoldsView:
    """The holds that belong to this cookie, and only the ones still open.

    Public `claimState` is the same for every guest (D8), so a holder who
    dismissed G5 would otherwise see their own item as `כבר נתפס`. This list
    is how the page tells "yours, still at the shop" from "someone else took
    it". Purchased and released rows are gone: those are finished answers.
    """
    registry = _load_registry(session, slug)
    stmt = select(Reservation).where(
        Reservation.registry_id == registry.id,
        Reservation.guest_id == guest_id,
        Reservation.state == "held",
    )
    rows = session.execute(stmt).scalars().all()
    return MyHoldsView(
        holds=[HoldView(reservation_id=row.id, item_id=row.item_id) for row in rows]
    )


def reveal_payment_handle(session: Session, *, slug: str) -> PaymentHandleView:
    """D13, on explicit interaction only.

    The handles are on the registry row but never in `PublicRegistry`, so seeing
    them takes a deliberate second request. That is the whole mechanism: a page
    scrape gets the list, not the couple's phone numbers.
    """
    registry = _load_open_registry(session, slug)
    display_name = registry.payment_display_name or registry.couple_names
    rails = []
    if (registry.bit_handle or "").strip():
        rails.append(
            PaymentRailView(method="bit", handle=registry.bit_handle, display_name=display_name)
        )
    if (registry.paybox_handle or "").strip():
        rails.append(
            PaymentRailView(
                method="paybox", handle=registry.paybox_handle, display_name=display_name
            )
        )
    if not rails:
        raise GiftingError("payment_handle_unset", 404)

    return PaymentHandleView(rails=rails)


def reveal_shipping_address(session: Session, *, slug: str) -> ShippingAddressView:
    """D49, on explicit interaction only.

    Same mechanism as the Bit handle: the street is on the registry row but
    never in `PublicRegistry`, so seeing it takes a deliberate second request.
    A closed list still answers - a guest who already holds a unit may still
    be at the shop - while an unpublished one is indistinguishable from a
    wrong slug (D30).
    """
    registry = _load_registry(session, slug)
    street = (registry.shipping_street or "").strip()
    if not street:
        raise GiftingError("shipping_address_unset", 404)

    entrance = (registry.shipping_entrance or "").strip() or None
    floor = (registry.shipping_floor or "").strip() or None
    apartment = (registry.shipping_apartment or "").strip() or None
    city = (registry.city or "").strip() or None
    postal = (registry.shipping_postal_code or "").strip() or None
    notes = (registry.shipping_notes or "").strip() or None

    lines = [registry.couple_names, street]
    if entrance:
        lines.append(f"כניסה {entrance}")
    if floor:
        lines.append(f"קומה {floor}")
    if apartment:
        lines.append(f"דירה {apartment}")
    if city:
        lines.append(city)
    if postal:
        lines.append(f"מיקוד {postal}")
    if notes:
        lines.append(notes)

    return ShippingAddressView(
        recipient_name=registry.couple_names,
        street=street,
        entrance=entrance,
        floor=floor,
        apartment=apartment,
        city=city,
        postal_code=postal,
        notes=notes,
        copy_text="\n".join(lines),
    )
