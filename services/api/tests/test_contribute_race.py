"""Concurrent money, on separate connections.

The reserve race is about picking one winner. This is about picking none: every
guest who sends money must be added, and the failure mode is the opposite one -
a lost update, where two `contributed_agorot = 55000 + x` writes land on the
same starting value and one gift silently disappears from the couple's total.

`contributed_agorot = contributed_agorot + :amount` is evaluated by Postgres
against the locked row, so the additions serialise.

Measured, not assumed: computing the new total in Python instead left ₪410 of
₪940 in the couple's tracker while every test in `test_money.py` still passed.
"""

from __future__ import annotations

import uuid
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

from sqlalchemy import func, select

from app.db import SessionFactory
from app.gifting.models import Contribution
from app.gifting.service import contribute
from app.registry.models import Registry, RegistryItem
from tests.factories import add_envelope


def send(slug: str, item_id: uuid.UUID, agorot: int, barrier: Barrier, key: str | None) -> bool:
    """One guest tapping "שלחתי", on its own connection."""
    session = SessionFactory()
    try:
        barrier.wait(timeout=10)
        _, created = contribute(
            session,
            slug=slug,
            item_id=item_id,
            guest_id=uuid.uuid4(),
            idempotency_key=key or uuid.uuid4().hex,
            amount_agorot=agorot,
        )
        return created
    finally:
        session.close()


def crowd(slug: str, item_id: uuid.UUID, amounts: list[int], key: str | None = None) -> list[bool]:
    barrier = Barrier(len(amounts))
    with ThreadPoolExecutor(max_workers=len(amounts)) as pool:
        futures = [pool.submit(send, slug, item_id, agorot, barrier, key) for agorot in amounts]
        return [future.result() for future in futures]


def committed_envelope(registry: Registry) -> RegistryItem:
    session = SessionFactory()
    item = add_envelope(session, registry, contributed_agorot=0, contributor_count=0)
    session.commit()
    session.close()
    return item


def totals(item_id: uuid.UUID) -> tuple[int, int, int, int]:
    """The cached counters, and the rows they are supposed to summarise."""
    session = SessionFactory()
    item = session.get(RegistryItem, item_id, populate_existing=True)
    summed = session.execute(
        select(func.coalesce(func.sum(Contribution.amount_agorot), 0)).where(
            Contribution.item_id == item_id
        )
    ).scalar_one()
    rows = session.execute(select(func.count()).where(Contribution.item_id == item_id)).scalar_one()
    result = (item.contributed_agorot, item.contributor_count, summed, rows)
    session.close()
    return result


def test_no_gift_is_lost_when_six_guests_give_at_once(committed_registry: Registry):
    item = committed_envelope(committed_registry)
    amounts = [5_000, 10_000, 20_000, 36_000, 5_000, 18_000]

    created = crowd(committed_registry.slug, item.id, amounts)

    assert created == [True] * 6
    assert totals(item.id) == (94_000, 6, 94_000, 6)


def test_identical_posts_in_flight_are_counted_once(committed_registry: Registry):
    """One tap that arrives twice. The unique key decides, and the loser's
    increment rolls back with its row rather than staying in the total."""
    item = committed_envelope(committed_registry)

    created = crowd(committed_registry.slug, item.id, [10_000, 10_000], key=uuid.uuid4().hex)

    assert sorted(created) == [False, True]
    assert totals(item.id) == (10_000, 1, 10_000, 1)
