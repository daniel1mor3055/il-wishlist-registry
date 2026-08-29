"""The guest write loop, over HTTP.

D8 is the reason a couple shares the link at all: another guest has to be able
to see that an item is taken. These tests are about the two ways that promise
breaks - two guests holding the same unit, and one guest's double tap counting
twice - plus D12's self-report, which is the only evidence we will ever have
that a gift was actually bought.

The concurrent version of the same promise is in `test_reserve_race.py`.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.gifting.models import OCCUPYING_STATES, Reservation
from app.registry.models import Registry, RegistryItem
from tests.factories import add_envelope, add_product, make_registry

# The write path answers with the same item shape the page reads, so the public
# contract is defined in exactly one place.
from tests.test_public_read import ITEM_KEYS


def guest() -> str:
    return str(uuid.uuid4())


def reserve(
    client: TestClient,
    registry: Registry,
    item: RegistryItem,
    who: str,
    key: str | None = None,
):
    return client.post(
        f"/api/v1/public/registries/{registry.slug}/items/{item.id}/reservations",
        headers={"X-Guest-Id": who, "Idempotency-Key": key or uuid.uuid4().hex},
    )


def report(
    client: TestClient,
    registry: Registry,
    reservation_id: str,
    who: str,
    *,
    purchased: bool,
    giver_name: str | None = None,
):
    return client.post(
        f"/api/v1/public/registries/{registry.slug}/reservations/{reservation_id}/report",
        headers={"X-Guest-Id": who},
        json={"purchased": purchased, "giverName": giver_name},
    )


def release(client: TestClient, registry: Registry, reservation_id: str, who: str):
    return client.delete(
        f"/api/v1/public/registries/{registry.slug}/reservations/{reservation_id}",
        headers={"X-Guest-Id": who},
    )


def refetch(session: Session, item: RegistryItem) -> RegistryItem:
    return session.get(RegistryItem, item.id, populate_existing=True)


def test_a_hold_takes_the_unit_and_closes_the_item(client: TestClient, session: Session):
    registry = make_registry(session)
    item = add_product(session, registry)

    response = reserve(client, registry, item, guest())

    assert response.status_code == 201
    body = response.json()
    assert body["state"] == "held"
    assert (body["item"]["quantityClaimed"], body["item"]["claimState"]) == (1, "reserved")


def test_the_write_answers_with_the_public_item_shape(client: TestClient, session: Session):
    """Anything this returns is readable by whoever holds the link, so it is the
    same key set as the page payload and not one field more."""
    registry = make_registry(session)
    item = add_product(session, registry)

    response = reserve(client, registry, item, guest())

    assert set(response.json()) == {"reservationId", "state", "item"}
    assert set(response.json()["item"]) == ITEM_KEYS


def test_a_replayed_post_does_not_become_a_second_hold(client: TestClient, session: Session):
    """A double tap, or the back button re-submitting. Same key, same answer,
    and the counter moves once."""
    registry = make_registry(session)
    item = add_product(session, registry, quantity_wanted=2)
    who, key = guest(), uuid.uuid4().hex

    first = reserve(client, registry, item, who, key)
    second = reserve(client, registry, item, who, key)

    assert (first.status_code, second.status_code) == (201, 200)
    assert first.json()["reservationId"] == second.json()["reservationId"]
    assert refetch(session, item).quantity_claimed == 1


def test_a_key_reused_for_a_different_item_is_refused(client: TestClient, session: Session):
    """Replay means "the same action again". Anything else is a client bug worth
    hearing about rather than silently answering with the wrong item."""
    registry = make_registry(session)
    first_item = add_product(session, registry)
    other_item = add_product(session, registry, position=1, title="כיסא בטיחות")
    who, key = guest(), uuid.uuid4().hex

    reserve(client, registry, first_item, who, key)
    response = reserve(client, registry, other_item, who, key)

    assert response.status_code == 409
    assert response.json() == {"detail": {"code": "idempotency_key_reused"}}


def test_the_second_guest_is_told_the_item_is_gone(client: TestClient, session: Session):
    registry = make_registry(session)
    item = add_product(session, registry)

    reserve(client, registry, item, guest())
    response = reserve(client, registry, item, guest())

    assert response.status_code == 409
    assert response.json() == {"detail": {"code": "item_already_reserved"}}
    assert refetch(session, item).quantity_claimed == 1


def test_a_multi_unit_item_stays_available_until_the_last_unit(
    client: TestClient, session: Session
):
    registry = make_registry(session)
    item = add_product(session, registry, quantity_wanted=3, title="מגבות")

    first = reserve(client, registry, item, guest()).json()["item"]
    second = reserve(client, registry, item, guest()).json()["item"]
    third = reserve(client, registry, item, guest()).json()["item"]

    assert [i["claimState"] for i in (first, second)] == ["available", "available"]
    assert (third["claimState"], third["quantityClaimed"]) == ("reserved", 3)
    assert reserve(client, registry, item, guest()).status_code == 409


def test_a_purchase_report_marks_the_item_purchased(client: TestClient, session: Session):
    registry = make_registry(session)
    item = add_product(session, registry)
    who = guest()
    held = reserve(client, registry, item, who).json()

    response = report(client, registry, held["reservationId"], who, purchased=True)

    assert response.status_code == 200
    assert response.json()["state"] == "purchased"
    assert response.json()["item"]["claimState"] == "purchased"


def test_not_yet_keeps_the_hold(client: TestClient, session: Session):
    """ "עוד לא" is not a decline (D16). Handing the unit back here is precisely
    the bug that produces the double buy the product exists to prevent."""
    registry = make_registry(session)
    item = add_product(session, registry)
    who = guest()
    held = reserve(client, registry, item, who).json()

    response = report(client, registry, held["reservationId"], who, purchased=False)

    assert response.json()["state"] == "held"
    assert response.json()["item"]["claimState"] == "reserved"
    assert refetch(session, item).quantity_claimed == 1


def test_reporting_twice_changes_nothing(client: TestClient, session: Session):
    """Reporting sets a state rather than moving a counter, which is why this
    write needs no idempotency key."""
    registry = make_registry(session)
    item = add_product(session, registry)
    who = guest()
    held = reserve(client, registry, item, who).json()

    first = report(client, registry, held["reservationId"], who, purchased=True)
    second = report(client, registry, held["reservationId"], who, purchased=True)

    assert first.json() == second.json()
    assert refetch(session, item).quantity_claimed == 1


def test_another_guests_cookie_cannot_touch_your_hold(client: TestClient, session: Session):
    """Holding the per-registry cookie is the whole authorisation model, and a
    wrong cookie has to look exactly like a wrong id."""
    registry = make_registry(session)
    item = add_product(session, registry)
    held = reserve(client, registry, item, guest()).json()

    mine = report(client, registry, held["reservationId"], guest(), purchased=True)
    invented = report(client, registry, str(uuid.uuid4()), guest(), purchased=True)

    assert mine.status_code == invented.status_code == 404
    assert mine.json() == invented.json() == {"detail": {"code": "reservation_not_found"}}


def test_releasing_puts_the_unit_back(client: TestClient, session: Session):
    """The handoff sheet's "ביטול". The hold is already placed by then, so
    cancelling has to hand the unit back or the best item freezes."""
    registry = make_registry(session)
    item = add_product(session, registry)
    who = guest()
    held = reserve(client, registry, item, who).json()

    response = release(client, registry, held["reservationId"], who)

    assert response.status_code == 204
    fresh = refetch(session, item)
    assert (fresh.quantity_claimed, fresh.claim_state) == (0, "available")
    assert reserve(client, registry, item, guest()).status_code == 201


def test_releasing_twice_takes_only_one_unit_back(client: TestClient, session: Session):
    registry = make_registry(session)
    item = add_product(session, registry, quantity_wanted=2)
    who = guest()
    reserve(client, registry, item, guest())
    mine = reserve(client, registry, item, who).json()

    release(client, registry, mine["reservationId"], who)
    second = release(client, registry, mine["reservationId"], who)

    assert second.status_code == 204
    assert refetch(session, item).quantity_claimed == 1


def test_a_purchased_hold_cannot_be_released(client: TestClient, session: Session):
    registry = make_registry(session)
    item = add_product(session, registry)
    who = guest()
    held = reserve(client, registry, item, who).json()
    report(client, registry, held["reservationId"], who, purchased=True)

    response = release(client, registry, held["reservationId"], who)

    assert response.status_code == 409
    assert response.json() == {"detail": {"code": "reservation_already_purchased"}}


def test_a_released_hold_cannot_be_reported(client: TestClient, session: Session):
    registry = make_registry(session)
    item = add_product(session, registry)
    who = guest()
    held = reserve(client, registry, item, who).json()
    release(client, registry, held["reservationId"], who)

    response = report(client, registry, held["reservationId"], who, purchased=True)

    assert response.status_code == 409
    assert response.json() == {"detail": {"code": "reservation_released"}}


def test_the_envelope_cannot_be_reserved(client: TestClient, session: Session):
    """Money is given, not held (D28). There is no unit to take."""
    registry = make_registry(session)
    envelope = add_envelope(session, registry)

    response = reserve(client, registry, envelope, guest())

    assert response.status_code == 409
    assert response.json() == {"detail": {"code": "item_not_reservable"}}


def test_a_closed_registry_refuses_new_holds(client: TestClient, session: Session):
    registry = make_registry(session, closed=True)
    item = add_product(session, registry)

    response = reserve(client, registry, item, guest())

    assert response.status_code == 409
    assert response.json() == {"detail": {"code": "registry_closed"}}


def test_a_closed_registry_still_accepts_a_report(client: TestClient, session: Session):
    """A guest who already holds a unit must always be able to tell the truth
    about it, or the couple's own list ends up permanently wrong."""
    registry = make_registry(session)
    item = add_product(session, registry)
    who = guest()
    held = reserve(client, registry, item, who).json()

    registry.closed_at = datetime.now(UTC)
    session.flush()
    response = report(client, registry, held["reservationId"], who, purchased=True)

    assert response.status_code == 200
    assert response.json()["state"] == "purchased"


def test_an_unpublished_registry_refuses_writes_like_a_wrong_slug(
    client: TestClient, session: Session
):
    """D30, on the write path too: the answer is not-found, not "not yet"."""
    registry = make_registry(session, published=False)
    item = add_product(session, registry)

    response = reserve(client, registry, item, guest())

    assert response.status_code == 404
    assert response.json() == {"detail": {"code": "registry_not_found"}}


def test_a_write_without_a_guest_id_is_rejected(client: TestClient, session: Session):
    registry = make_registry(session)
    item = add_product(session, registry)

    response = client.post(
        f"/api/v1/public/registries/{registry.slug}/items/{item.id}/reservations",
        headers={"Idempotency-Key": uuid.uuid4().hex},
    )

    assert response.status_code == 422


def test_the_givers_name_reaches_the_couple_and_not_the_page(client: TestClient, session: Session):
    """D7: the couple sees who gave what. D8: no other guest ever does."""
    registry = make_registry(session)
    item = add_product(session, registry)
    who = guest()
    held = reserve(client, registry, item, who).json()

    response = report(
        client, registry, held["reservationId"], who, purchased=True, giver_name="דודה רותי"
    )

    assert "רותי" not in response.text
    stored = session.get(Reservation, uuid.UUID(held["reservationId"]), populate_existing=True)
    assert stored.giver_name == "דודה רותי"


def test_the_counter_reconciles_with_the_ledger(client: TestClient, session: Session):
    """`quantity_claimed` is a stored counter because a conditional UPDATE cannot
    lock a derived value, and a stored counter drifts unless something checks
    it. Held and purchased rows occupy a unit; released rows do not."""
    registry = make_registry(session)
    item = add_product(session, registry, quantity_wanted=3, title="מגבות")

    keeper = guest()
    reserve(client, registry, item, keeper)
    buyer = guest()
    bought = reserve(client, registry, item, buyer).json()
    report(client, registry, bought["reservationId"], buyer, purchased=True)
    quitter = guest()
    dropped = reserve(client, registry, item, quitter).json()
    release(client, registry, dropped["reservationId"], quitter)

    occupying = session.execute(
        select(func.count()).where(
            Reservation.item_id == item.id, Reservation.state.in_(OCCUPYING_STATES)
        )
    ).scalar_one()
    fresh = refetch(session, item)

    assert fresh.quantity_claimed == occupying == 2
    assert fresh.claim_state == "available"
