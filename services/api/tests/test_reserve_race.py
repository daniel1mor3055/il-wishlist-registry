"""The race, for real: separate connections, overlapping transactions.

A link dropped into a WhatsApp group is read by fifty people at once, and the
cheap stroller is the one they all open. A read-then-write reserve passes every
sequential test in `test_reserve.py` and oversells here, so these tests use
threads and real commits rather than the shared-connection fixture.

One measured note on which of these is load-bearing. Regressing the service to a
read-then-write and re-running, the two-guest test still passed - the threads
happened not to overlap - while the six-guest test failed with five winners on
two units. Two threads document the contract; a crowd is what actually detects
an oversell, so do not "simplify" the crowd away.
"""

from __future__ import annotations

import uuid
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

from sqlalchemy import func, select

from app.db import SessionFactory
from app.gifting.models import Reservation
from app.gifting.service import GiftingError, reserve_item
from app.registry.models import Registry, RegistryItem
from tests.factories import add_product


def attempt(slug: str, item_id: uuid.UUID, barrier: Barrier, key: str | None = None) -> str:
    """One guest tapping "אני קונה את זה", on its own connection."""
    session = SessionFactory()
    try:
        barrier.wait(timeout=10)
        _, created = reserve_item(
            session,
            slug=slug,
            item_id=item_id,
            guest_id=uuid.uuid4(),
            idempotency_key=key or uuid.uuid4().hex,
        )
        return "won" if created else "replayed"
    except GiftingError as exc:
        return exc.code
    finally:
        session.close()


def race(slug: str, item_id: uuid.UUID, guests: int, key: str | None = None) -> list[str]:
    barrier = Barrier(guests)
    with ThreadPoolExecutor(max_workers=guests) as pool:
        futures = [pool.submit(attempt, slug, item_id, barrier, key) for _ in range(guests)]
        return sorted(future.result() for future in futures)


def committed_item(registry: Registry, **overrides: object) -> RegistryItem:
    session = SessionFactory()
    item = add_product(session, registry, **overrides)
    session.commit()
    session.close()
    return item


def ledger(item_id: uuid.UUID) -> tuple[int, str, int]:
    session = SessionFactory()
    item = session.get(RegistryItem, item_id, populate_existing=True)
    holds = session.execute(
        select(func.count()).where(Reservation.item_id == item_id, Reservation.state == "held")
    ).scalar_one()
    result = (item.quantity_claimed, item.claim_state, holds)
    session.close()
    return result


def test_only_one_guest_wins_the_last_unit(committed_registry: Registry):
    item = committed_item(committed_registry)

    results = race(committed_registry.slug, item.id, guests=2)

    assert results == ["item_already_reserved", "won"]
    assert ledger(item.id) == (1, "reserved", 1)


def test_a_crowd_cannot_oversell_a_multi_unit_item(committed_registry: Registry):
    item = committed_item(committed_registry, quantity_wanted=2, title="מגבות")

    results = race(committed_registry.slug, item.id, guests=6)

    assert results.count("won") == 2
    assert results.count("item_already_reserved") == 4
    assert ledger(item.id) == (2, "reserved", 2)


def test_identical_posts_in_flight_produce_one_hold(committed_registry: Registry):
    """The same tap, twice, arriving together - a flaky connection retrying, or
    two taps on a slow button. The unique idempotency key decides, and the loser
    rolls its increment back rather than keeping a phantom unit."""
    item = committed_item(committed_registry, quantity_wanted=2, title="חיתולים")

    results = race(committed_registry.slug, item.id, guests=2, key=uuid.uuid4().hex)

    assert results == ["replayed", "won"]
    assert ledger(item.id) == (1, "available", 1)
