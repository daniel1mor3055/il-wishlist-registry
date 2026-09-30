"""Quantity is 2: at 1 the `quantity_claimed > 0` guard would mask a double decrement."""

from __future__ import annotations

import uuid
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

from sqlalchemy import select

from app.db import SessionFactory
from app.gifting.models import OCCUPYING_STATES, Reservation
from app.gifting.owner_service import release_gift
from app.gifting.service import GiftingError, release_reservation, report_reservation, reserve_item
from app.identity.models import Couple
from app.registry.models import Registry, RegistryItem
from tests.factories import add_product

ROUNDS = 20


def _committed_item(registry: Registry) -> RegistryItem:
    session = SessionFactory()
    try:
        item = add_product(session, registry, quantity_wanted=2, title="Towels")
        session.commit()
        return item
    finally:
        session.close()


def _place_two_holds(
    slug: str, item_id: uuid.UUID
) -> tuple[uuid.UUID, uuid.UUID, uuid.UUID, uuid.UUID]:
    session = SessionFactory()
    try:
        guest_a = uuid.uuid4()
        guest_b = uuid.uuid4()
        hold_a, created_a = reserve_item(
            session,
            slug=slug,
            item_id=item_id,
            guest_id=guest_a,
            idempotency_key=uuid.uuid4().hex,
        )
        hold_b, created_b = reserve_item(
            session,
            slug=slug,
            item_id=item_id,
            guest_id=guest_b,
            idempotency_key=uuid.uuid4().hex,
        )
        assert created_a and created_b
        return hold_a.reservation_id, guest_a, hold_b.reservation_id, guest_b
    finally:
        session.close()


def _couple_release(couple_id: uuid.UUID, reservation_id: uuid.UUID, barrier: Barrier) -> str:
    session = SessionFactory()
    try:
        couple = session.get(Couple, couple_id)
        assert couple is not None
        barrier.wait(timeout=10)
        release_gift(session, couple=couple, reservation_id=reservation_id)
        return "ok"
    except GiftingError as exc:
        return exc.code
    finally:
        session.close()


def _guest_release(
    slug: str, reservation_id: uuid.UUID, guest_id: uuid.UUID, barrier: Barrier
) -> str:
    session = SessionFactory()
    try:
        barrier.wait(timeout=10)
        release_reservation(session, slug=slug, reservation_id=reservation_id, guest_id=guest_id)
        return "ok"
    except GiftingError as exc:
        return exc.code
    finally:
        session.close()


def _guest_report_purchased(
    slug: str, reservation_id: uuid.UUID, guest_id: uuid.UUID, barrier: Barrier
) -> str:
    session = SessionFactory()
    try:
        barrier.wait(timeout=10)
        report_reservation(
            session,
            slug=slug,
            reservation_id=reservation_id,
            guest_id=guest_id,
            purchased=True,
            giver_name=None,
        )
        return "ok"
    except GiftingError as exc:
        return exc.code
    finally:
        session.close()


def _release_against(
    couple_id: uuid.UUID,
    slug: str,
    reservation_id: uuid.UUID,
    guest_id: uuid.UUID,
    *,
    guest_purchases: bool,
) -> tuple[str, str]:
    barrier = Barrier(2)
    guest = _guest_report_purchased if guest_purchases else _guest_release
    with ThreadPoolExecutor(max_workers=2) as pool:
        couple_future = pool.submit(_couple_release, couple_id, reservation_id, barrier)
        guest_future = pool.submit(guest, slug, reservation_id, guest_id, barrier)
        return couple_future.result(), guest_future.result()


def _assert_one_unit_remains(
    item_id: uuid.UUID,
    released_id: uuid.UUID,
    held_id: uuid.UUID,
    *,
    resolved_by: set[str],
) -> None:
    session = SessionFactory()
    try:
        item = session.get(RegistryItem, item_id)
        assert item is not None
        rows = list(
            session.execute(select(Reservation).where(Reservation.item_id == item_id)).scalars()
        )
        by_id = {row.id: row for row in rows}
        occupying = sum(1 for row in rows if row.state in OCCUPYING_STATES)
        released = by_id[released_id]
        held = by_id[held_id]
        assert released.state == "released"
        assert released.resolved_by in resolved_by
        assert held.state == "held"
        assert 0 <= item.quantity_claimed == occupying == 1
    finally:
        session.close()


def _report(slug: str, reservation_id: uuid.UUID, guest_id: uuid.UUID, *, purchased: bool) -> None:
    session = SessionFactory()
    try:
        report_reservation(
            session,
            slug=slug,
            reservation_id=reservation_id,
            guest_id=guest_id,
            purchased=purchased,
            giver_name=None,
        )
    finally:
        session.close()


def _who_released(session, reservation_id: uuid.UUID, actor: str) -> str:
    row = session.get(Reservation, reservation_id, populate_existing=True)
    if row is not None and row.state == "released" and row.resolved_by == actor:
        return "changed"
    return "noop"


def _couple_release_purchased(
    couple_id: uuid.UUID, reservation_id: uuid.UUID, barrier: Barrier
) -> str:
    session = SessionFactory()
    try:
        couple = session.get(Couple, couple_id)
        assert couple is not None
        barrier.wait(timeout=10)
        release_gift(session, couple=couple, reservation_id=reservation_id)
        # Already released is a no-op, not a 409. resolved_by names who wrote it.
        return _who_released(session, reservation_id, "couple")
    except GiftingError as exc:
        return exc.code
    finally:
        session.close()


def _guest_report_no(
    slug: str, reservation_id: uuid.UUID, guest_id: uuid.UUID, barrier: Barrier
) -> str:
    session = SessionFactory()
    try:
        barrier.wait(timeout=10)
        report_reservation(
            session,
            slug=slug,
            reservation_id=reservation_id,
            guest_id=guest_id,
            purchased=False,
            giver_name=None,
        )
        # A second "no" returns the view. 409 is only for yes after a release.
        return _who_released(session, reservation_id, "guest")
    except GiftingError as exc:
        return exc.code
    finally:
        session.close()


def _claimed(item_id: uuid.UUID) -> int:
    session = SessionFactory()
    try:
        item = session.get(RegistryItem, item_id)
        assert item is not None
        return item.quantity_claimed
    finally:
        session.close()


def _release_hold(slug: str, reservation_id: uuid.UUID, guest_id: uuid.UUID) -> None:
    session = SessionFactory()
    try:
        release_reservation(session, slug=slug, reservation_id=reservation_id, guest_id=guest_id)
    finally:
        session.close()


def test_couple_release_and_guest_release_decrement_once(committed_registry: Registry) -> None:
    """D16 / D53: both actors releasing one hold drop quantity_claimed by one."""
    item = _committed_item(committed_registry)
    for _ in range(ROUNDS):
        hold_a, guest_a, hold_b, guest_b = _place_two_holds(committed_registry.slug, item.id)
        couple_code, guest_code = _release_against(
            committed_registry.couple_id,
            committed_registry.slug,
            hold_a,
            guest_a,
            guest_purchases=False,
        )
        assert couple_code == guest_code == "ok"
        _assert_one_unit_remains(
            item.id, hold_a, hold_b, resolved_by={"guest", "couple"}
        )
        # B still holds a unit; hand it back so the next round can take two.
        _release_hold(committed_registry.slug, hold_b, guest_b)


def test_couple_release_and_guest_purchase_reconcile(committed_registry: Registry) -> None:
    """D16 / D53: whichever transition lands, quantity_claimed matches the ledger."""
    item = _committed_item(committed_registry)
    for _ in range(ROUNDS):
        hold_a, guest_a, hold_b, guest_b = _place_two_holds(committed_registry.slug, item.id)
        couple_code, guest_code = _release_against(
            committed_registry.couple_id,
            committed_registry.slug,
            hold_a,
            guest_a,
            guest_purchases=True,
        )
        assert couple_code == "ok"
        assert guest_code in {"ok", "reservation_released"}
        _assert_one_unit_remains(item.id, hold_a, hold_b, resolved_by={"couple"})
        _release_hold(committed_registry.slug, hold_b, guest_b)


def test_couple_release_and_guest_decline_of_a_purchase_decrement_once(
    committed_registry: Registry,
) -> None:
    """D16 / D53: releasing a purchased unit drops quantity_claimed by one."""
    item = _committed_item(committed_registry)
    for _ in range(ROUNDS):
        hold_a, guest_a, hold_b, guest_b = _place_two_holds(committed_registry.slug, item.id)
        _report(committed_registry.slug, hold_a, guest_a, purchased=True)
        before = _claimed(item.id)
        barrier = Barrier(2)
        with ThreadPoolExecutor(max_workers=2) as pool:
            couple_future = pool.submit(
                _couple_release_purchased, committed_registry.couple_id, hold_a, barrier
            )
            guest_future = pool.submit(
                _guest_report_no, committed_registry.slug, hold_a, guest_a, barrier
            )
            couple_code, guest_code = couple_future.result(), guest_future.result()
        assert {couple_code, guest_code} == {"changed", "noop"}
        assert _claimed(item.id) == before - 1
        winner = "couple" if couple_code == "changed" else "guest"
        _assert_one_unit_remains(item.id, hold_a, hold_b, resolved_by={winner})
        _release_hold(committed_registry.slug, hold_b, guest_b)
