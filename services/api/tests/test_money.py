"""The money surface, over HTTP.

Nothing here moves money - we never touch it (D11) - so the risks are different
from the reserve path's. They are: a total that drifts from the rows behind it, a
per-guest amount or name reaching another guest (D15, D8), and a blessing being
readable by anyone but the couple (D17).

The concurrent version of the total is in `test_contribute_race.py`.
"""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.gifting.models import Blessing, Contribution, Reservation
from app.registry.models import Registry, RegistryItem
from tests.factories import add_envelope, add_product, make_registry
from tests.test_public_read import ITEM_KEYS
from tests.test_reserve import guest, refetch, reserve


def contribute(
    client: TestClient,
    registry: Registry,
    item: RegistryItem,
    who: str,
    agorot: int,
    key: str | None = None,
):
    return client.post(
        f"/api/v1/public/registries/{registry.slug}/items/{item.id}/contributions",
        headers={"X-Guest-Id": who, "Idempotency-Key": key or uuid.uuid4().hex},
        json={"amountAgorot": agorot},
    )


def bless(
    client: TestClient,
    registry: Registry,
    who: str,
    *,
    giver_name: str | None = None,
    message: str | None = None,
    reservation_id: str | None = None,
    contribution_id: str | None = None,
    key: str | None = None,
):
    return client.post(
        f"/api/v1/public/registries/{registry.slug}/blessings",
        headers={"X-Guest-Id": who, "Idempotency-Key": key or uuid.uuid4().hex},
        json={
            "giverName": giver_name,
            "message": message,
            "reservationId": reservation_id,
            "contributionId": contribution_id,
        },
    )


def blessings(session: Session, registry: Registry) -> list[Blessing]:
    """Scoped to this registry: the database also holds the demo seed and
    whatever the screenshot driver last did to it."""
    session.expire_all()
    stmt = select(Blessing).where(Blessing.registry_id == registry.id)
    return list(session.execute(stmt).scalars())


def sole_contribution(session: Session, item: RegistryItem) -> Contribution:
    session.expire_all()
    stmt = select(Contribution).where(Contribution.item_id == item.id)
    return session.execute(stmt).scalars().one()


def sole_reservation(session: Session, item: RegistryItem) -> Reservation:
    session.expire_all()
    stmt = select(Reservation).where(Reservation.item_id == item.id)
    return session.execute(stmt).scalars().one()


def group_product(session: Session, registry: Registry) -> RegistryItem:
    return add_product(
        session,
        registry,
        group_gift_enabled=True,
        target_agorot=129_000,
        contributed_agorot=55_000,
        contributor_count=6,
    )


# ---------- contributions ----------


def test_money_moves_the_public_total_and_the_contributor_count(
    client: TestClient, session: Session
):
    registry = make_registry(session)
    item = add_envelope(session, registry, contributed_agorot=0, contributor_count=0)

    response = contribute(client, registry, item, guest(), 10_000)

    assert response.status_code == 201
    assert set(response.json()["item"]) == ITEM_KEYS
    assert response.json()["item"]["contributedAgorot"] == 10_000
    assert response.json()["item"]["contributorCount"] == 1
    assert refetch(session, item).contributed_agorot == 10_000


def test_no_response_and_no_page_carries_a_guests_own_amount_or_name(
    client: TestClient, session: Session
):
    """D15 and D8. The total is public; who gave how much is the couple's alone.

    The write answers with the item and an id, so there is no field for another
    guest's share to hide in - and the page itself, which anyone with the link
    can read, must not have grown one either.
    """
    registry = make_registry(session)
    item = group_product(session, registry)
    who = guest()

    body = contribute(client, registry, item, who, 20_000).json()
    bless(client, registry, who, giver_name="שירה", contribution_id=body["contributionId"])

    assert set(body) == {"contributionId", "item"}
    assert set(body["item"]) == ITEM_KEYS

    page = client.get(f"/api/v1/public/registries/{registry.slug}").text
    assert "שירה" not in page
    assert "20000" not in page


def test_a_replayed_contribution_does_not_double_the_total(client: TestClient, session: Session):
    """The tab that gets re-POSTed by a back button, or a double tap on "שלחתי"."""
    registry = make_registry(session)
    item = add_envelope(session, registry, contributed_agorot=0, contributor_count=0)
    who, key = guest(), uuid.uuid4().hex

    first = contribute(client, registry, item, who, 5_000, key)
    second = contribute(client, registry, item, who, 5_000, key)

    assert (first.status_code, second.status_code) == (201, 200)
    assert first.json()["contributionId"] == second.json()["contributionId"]
    assert refetch(session, item).contributed_agorot == 5_000
    assert refetch(session, item).contributor_count == 1


def test_a_key_cannot_be_replayed_onto_a_different_item(client: TestClient, session: Session):
    registry = make_registry(session)
    envelope = add_envelope(session, registry)
    group = group_product(session, registry)
    who, key = guest(), uuid.uuid4().hex

    contribute(client, registry, envelope, who, 5_000, key)
    response = contribute(client, registry, group, who, 5_000, key)

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "idempotency_key_reused"


def test_a_plain_product_takes_no_money(client: TestClient, session: Session):
    """Only the envelope and a product the couple opened for group gifting (D28).
    Everything else is bought at the chain, and money sent for it would be a
    total nobody asked for."""
    registry = make_registry(session)
    item = add_product(session, registry)

    response = contribute(client, registry, item, guest(), 5_000)

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "item_takes_no_money"


def test_money_toward_a_completed_group_gift_is_still_recorded(
    client: TestClient, session: Session
):
    """The guest sent it through Bit before tapping "שלחתי", so refusing the
    write would lose a real gift. Overshooting is the couple's happy problem."""
    registry = make_registry(session)
    item = add_product(
        session,
        registry,
        group_gift_enabled=True,
        target_agorot=100_000,
        contributed_agorot=100_000,
        contributor_count=4,
    )

    response = contribute(client, registry, item, guest(), 10_000)

    assert response.status_code == 201
    assert refetch(session, item).contributed_agorot == 110_000


def test_a_closed_registry_takes_no_more_money(client: TestClient, session: Session):
    registry = make_registry(session, closed=True)
    item = add_envelope(session, registry)

    response = contribute(client, registry, item, guest(), 5_000)

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "registry_closed"


def test_absurd_amounts_are_refused(client: TestClient, session: Session):
    """A stray keystroke and a mis-paste, which are the two ways a wrong number
    gets here. Neither is a judgement about how much a person may give."""
    registry = make_registry(session)
    item = add_envelope(session, registry, contributed_agorot=0, contributor_count=0)

    too_small = contribute(client, registry, item, guest(), 10)
    too_large = contribute(client, registry, item, guest(), 10_000_000_00)

    assert (too_small.status_code, too_large.status_code) == (422, 422)
    assert refetch(session, item).contributed_agorot == 0


def test_the_total_always_equals_the_rows_behind_it(client: TestClient, session: Session):
    """The counter is a cached sum, and a cache that can drift from its source is
    worth reconciling explicitly rather than trusting."""
    registry = make_registry(session)
    item = add_envelope(session, registry, contributed_agorot=0, contributor_count=0)

    for amount in (5_000, 10_000, 20_000, 36_000):
        contribute(client, registry, item, guest(), amount)

    total = session.execute(
        select(func.coalesce(func.sum(Contribution.amount_agorot), 0)).where(
            Contribution.item_id == item.id
        )
    ).scalar_one()
    rows = session.execute(select(func.count()).where(Contribution.item_id == item.id)).scalar_one()

    assert refetch(session, item).contributed_agorot == total == 71_000
    assert refetch(session, item).contributor_count == rows == 4


# ---------- blessings ----------


def test_a_blessing_is_stored_and_answered_with_nothing(client: TestClient, session: Session):
    """D17. There is no read path for this table, so the response cannot carry
    one either - a 201 with a body is the first step toward a public wall."""
    registry = make_registry(session)

    response = bless(client, registry, guest(), giver_name="דנה", message="מחכים לפגוש אותה")

    assert response.status_code == 201
    assert response.json() is None
    (stored,) = blessings(session, registry)
    assert (stored.giver_name, stored.message) == ("דנה", "מחכים לפגוש אותה")
    assert stored.item_id is None


def test_the_name_lands_on_the_gift_it_came_with(client: TestClient, session: Session):
    """D36: the name is asked once, at the end. This is the write that carries it
    back to the hold the guest placed several screens earlier."""
    registry = make_registry(session)
    item = add_product(session, registry)
    who = guest()
    held = reserve(client, registry, item, who).json()

    bless(client, registry, who, giver_name="שירה", reservation_id=held["reservationId"])

    (stored,) = blessings(session, registry)
    assert stored.item_id == item.id
    assert sole_reservation(session, item).giver_name == "שירה"


def test_the_name_lands_on_a_contribution_too(client: TestClient, session: Session):
    registry = make_registry(session)
    item = add_envelope(session, registry)
    who = guest()
    sent = contribute(client, registry, item, who, 10_000).json()

    bless(client, registry, who, giver_name="אורי", contribution_id=sent["contributionId"])

    assert sole_contribution(session, item).giver_name == "אורי"


def test_a_blessing_cannot_be_attached_to_someone_elses_gift(client: TestClient, session: Session):
    registry = make_registry(session)
    item = add_product(session, registry)
    held = reserve(client, registry, item, guest()).json()

    response = bless(
        client, registry, guest(), giver_name="לא שלי", reservation_id=held["reservationId"]
    )

    assert response.status_code == 404
    assert blessings(session, registry) == []


def test_skipping_the_blessing_leaves_no_row(client: TestClient, session: Session):
    """Neither a name nor a message is a skip, and a skip is not a blessing."""
    registry = make_registry(session)

    response = bless(client, registry, guest(), giver_name="   ", message="")

    assert response.status_code == 422
    assert blessings(session, registry) == []


def test_a_replayed_blessing_is_stored_once(client: TestClient, session: Session):
    registry = make_registry(session)
    who, key = guest(), uuid.uuid4().hex

    first = bless(client, registry, who, message="מזל טוב", key=key)
    second = bless(client, registry, who, message="מזל טוב", key=key)

    assert (first.status_code, second.status_code) == (201, 201)
    assert len(blessings(session, registry)) == 1


def test_a_blessing_still_lands_on_a_closed_registry(client: TestClient, session: Session):
    """A guest finishing a flow they started should not be told their thank-you
    note arrived too late, and a blessing takes nothing from the list."""
    registry = make_registry(session, closed=True)

    response = bless(client, registry, guest(), message="בהצלחה!")

    assert response.status_code == 201


# ---------- the D13 reveal ----------


def test_the_handle_is_revealed_only_by_its_own_request(client: TestClient, session: Session):
    registry = make_registry(session)

    revealed = client.get(f"/api/v1/public/registries/{registry.slug}/payment-handle")
    page = client.get(f"/api/v1/public/registries/{registry.slug}")

    assert revealed.json() == {
        "rails": [
            {
                "method": "bit",
                "handle": "050-123-4567",
                "displayName": "נועה",
            }
        ]
    }
    assert "050-123-4567" not in page.text


def test_both_live_rails_are_revealed_together(client: TestClient, session: Session):
    registry = make_registry(session)
    registry.paybox_handle = "052-000-1111"
    session.flush()

    revealed = client.get(f"/api/v1/public/registries/{registry.slug}/payment-handle")

    assert revealed.json() == {
        "rails": [
            {"method": "bit", "handle": "050-123-4567", "displayName": "נועה"},
            {"method": "paybox", "handle": "052-000-1111", "displayName": "נועה"},
        ]
    }


def test_a_paybox_only_list_does_not_invent_bit(client: TestClient, session: Session):
    registry = make_registry(session)
    registry.bit_handle = None
    registry.paybox_handle = "052-000-1111"
    session.flush()

    revealed = client.get(f"/api/v1/public/registries/{registry.slug}/payment-handle")

    assert revealed.json() == {
        "rails": [
            {"method": "paybox", "handle": "052-000-1111", "displayName": "נועה"},
        ]
    }


def test_a_couple_with_no_handle_reveals_nothing(client: TestClient, session: Session):
    registry = make_registry(session)
    registry.bit_handle = None
    registry.paybox_handle = None
    session.flush()

    response = client.get(f"/api/v1/public/registries/{registry.slug}/payment-handle")

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "payment_handle_unset"


def test_an_unpublished_registry_reveals_nothing(client: TestClient, session: Session):
    """D30, again: the reveal must not become the endpoint that confirms a
    registry exists before its couple has announced it."""
    registry = make_registry(session, published=False)

    response = client.get(f"/api/v1/public/registries/{registry.slug}/payment-handle")

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "registry_not_found"
