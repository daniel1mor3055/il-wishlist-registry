"""Couple corrections on a gift the guest is holding (D16, D53)."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.gifting.models import Reservation
from app.registry.models import Registry, RegistryItem
from tests.factories import add_product, make_couple, make_registry, sign_in

GIFTS = "/api/v1/me/registry/gifts"


def _open(session: Session) -> tuple[dict[str, str], Registry]:
    couple = make_couple(session)
    registry = make_registry(session, couple=couple)
    return {"X-Session-Token": sign_in(session, couple)}, registry


def _hold(client: TestClient, registry: Registry, item: RegistryItem) -> tuple[str, str]:
    guest_id = str(uuid4())
    response = client.post(
        f"/api/v1/public/registries/{registry.slug}/items/{item.id}/reservations",
        headers={"X-Guest-Id": guest_id, "Idempotency-Key": uuid4().hex},
    )
    assert response.status_code == 201
    return guest_id, response.json()["reservationId"]


def _report(
    client: TestClient,
    registry: Registry,
    reservation_id: str,
    guest_id: str,
    *,
    purchased: bool,
):
    return client.post(
        f"/api/v1/public/registries/{registry.slug}/reservations/{reservation_id}/report",
        headers={"X-Guest-Id": guest_id},
        json={"purchased": purchased},
    )


def _guest_release(client: TestClient, registry: Registry, reservation_id: str, guest_id: str):
    return client.delete(
        f"/api/v1/public/registries/{registry.slug}/reservations/{reservation_id}",
        headers={"X-Guest-Id": guest_id},
    )


def _holds(client: TestClient, registry: Registry, guest_id: str):
    return client.get(
        f"/api/v1/public/registries/{registry.slug}/holds",
        headers={"X-Guest-Id": guest_id},
    )


def _correct(
    client: TestClient,
    action: str,
    reservation_id: str,
    headers: dict[str, str] | None = None,
):
    return client.post(
        f"{GIFTS}/reservations/{reservation_id}/{action}",
        headers=headers,
    )


def _row(session: Session, reservation_id: str) -> Reservation:
    row = session.get(Reservation, UUID(reservation_id), populate_existing=True)
    assert row is not None
    return row


def _item(session: Session, item: RegistryItem) -> RegistryItem:
    fresh = session.get(RegistryItem, item.id, populate_existing=True)
    assert fresh is not None
    return fresh


def test_the_couple_can_release_a_held_gift(client: TestClient, session: Session) -> None:
    """D16 / D53: the couple frees a hold the guest still has."""
    headers, registry = _open(session)
    item = add_product(session, registry, title="Stroller")
    guest_id, reservation_id = _hold(client, registry, item)

    response = _correct(client, "release", reservation_id, headers)

    assert response.status_code == 204
    stored = _row(session, reservation_id)
    assert stored.state == "released"
    assert stored.resolved_by == "couple"
    fresh = _item(session, item)
    assert fresh.quantity_claimed == 0
    assert fresh.claim_state == "available"
    report = _report(client, registry, reservation_id, guest_id, purchased=True)
    assert report.status_code == 409
    assert report.json() == {"detail": {"code": "reservation_released"}}
    assert _item(session, item).quantity_claimed == 0
    holds = _holds(client, registry, guest_id)
    assert holds.status_code == 200
    assert holds.json() == {"holds": []}


def test_the_couple_can_release_a_purchased_gift(client: TestClient, session: Session) -> None:
    """D16 / D53: releasing a purchased gift returns its unit."""
    headers, registry = _open(session)
    item = add_product(session, registry, title="Blanket")
    guest_id, reservation_id = _hold(client, registry, item)
    assert _report(client, registry, reservation_id, guest_id, purchased=True).status_code == 200
    assert _item(session, item).quantity_claimed == 1

    response = _correct(client, "release", reservation_id, headers)

    assert response.status_code == 204
    stored = _row(session, reservation_id)
    assert stored.state == "released"
    assert stored.resolved_by == "couple"
    fresh = _item(session, item)
    assert fresh.quantity_claimed == 0
    assert fresh.claim_state == "available"


def test_the_couple_can_mark_a_held_gift_purchased(client: TestClient, session: Session) -> None:
    """D16 / D53: the last open hold on a full item becomes purchased."""
    headers, registry = _open(session)
    item = add_product(session, registry, title="Crib", quantity_wanted=1)
    _, reservation_id = _hold(client, registry, item)
    assert _item(session, item).claim_state == "reserved"

    response = _correct(client, "purchased", reservation_id, headers)

    assert response.status_code == 204
    stored = _row(session, reservation_id)
    assert stored.state == "purchased"
    assert stored.resolved_by == "couple"
    assert stored.reported_at is None
    fresh = _item(session, item)
    assert fresh.quantity_claimed == 1
    assert fresh.claim_state == "purchased"
    tracker = client.get(GIFTS, headers=headers)
    assert tracker.status_code == 200
    body = tracker.json()
    assert body["held"] == []
    purchased = body["purchased"]
    assert len(purchased) == 1
    assert purchased[0]["id"] == reservation_id
    assert purchased[0]["state"] == "purchased"
    assert purchased[0]["resolvedBy"] == "couple"
    assert purchased[0]["reportedAt"] is None


def test_marking_purchased_again_changes_nothing(client: TestClient, session: Session) -> None:
    """D16 / D53: a gift the guest already bought stays as they left it."""
    headers, registry = _open(session)
    item = add_product(session, registry, title="Monitor")
    guest_id, reservation_id = _hold(client, registry, item)
    assert _report(client, registry, reservation_id, guest_id, purchased=True).status_code == 200
    before = _row(session, reservation_id)
    assert before.resolved_by == "guest"
    snapshot = (before.state, before.resolved_by, before.reported_at, before.giver_name)
    claimed = _item(session, item).quantity_claimed

    response = _correct(client, "purchased", reservation_id, headers)

    assert response.status_code == 204
    after = _row(session, reservation_id)
    assert (after.state, after.resolved_by, after.reported_at, after.giver_name) == snapshot
    assert _item(session, item).quantity_claimed == claimed


def test_marking_a_released_gift_purchased_is_a_conflict(
    client: TestClient, session: Session
) -> None:
    """D16 / D53: a released unit may already belong to someone else."""
    headers, registry = _open(session)
    item = add_product(session, registry, title="Bath")
    guest_id, reservation_id = _hold(client, registry, item)
    assert _guest_release(client, registry, reservation_id, guest_id).status_code == 204
    claimed = _item(session, item).quantity_claimed

    response = _correct(client, "purchased", reservation_id, headers)

    assert response.status_code == 409
    assert response.json() == {"detail": {"code": "gift_state_changed"}}
    assert _row(session, reservation_id).state == "released"
    assert _item(session, item).quantity_claimed == claimed


def test_releasing_an_already_released_gift_changes_nothing(
    client: TestClient, session: Session
) -> None:
    """D16 / D53: releasing twice does not free a second unit."""
    headers, registry = _open(session)
    item = add_product(session, registry, title="Towels", quantity_wanted=2)
    _, still_held = _hold(client, registry, item)
    guest_id, reservation_id = _hold(client, registry, item)
    assert _guest_release(client, registry, reservation_id, guest_id).status_code == 204
    assert _row(session, reservation_id).resolved_by == "guest"
    claimed = _item(session, item).quantity_claimed

    response = _correct(client, "release", reservation_id, headers)

    assert response.status_code == 204
    stored = _row(session, reservation_id)
    assert stored.state == "released"
    assert stored.resolved_by == "guest"
    assert _row(session, still_held).state == "held"
    assert _item(session, item).quantity_claimed == claimed


def test_another_couples_gift_and_a_missing_id_are_not_found(
    client: TestClient, session: Session
) -> None:
    """D16 / D53: someone else's id and a made-up id are the same 404 (D44)."""
    headers, registry = _open(session)
    item = add_product(session, registry, title="Stroller")
    _, reservation_id = _hold(client, registry, item)
    other = make_couple(session)
    make_registry(session, couple=other)
    other_headers = {"X-Session-Token": sign_in(session, other)}
    missing = str(uuid4())

    for action in ("release", "purchased"):
        foreign = _correct(client, action, reservation_id, other_headers)
        unknown = _correct(client, action, missing, headers)
        assert foreign.status_code == unknown.status_code == 404
        assert foreign.json() == unknown.json() == {"detail": {"code": "gift_not_found"}}


def test_unsigned_corrections_are_rejected(client: TestClient) -> None:
    """D16 / D53: corrections require the couple session."""
    reservation_id = str(uuid4())
    release = _correct(client, "release", reservation_id)
    purchased = _correct(client, "purchased", reservation_id)
    assert release.status_code == purchased.status_code == 401
    assert release.json()["detail"]["code"] == "not_signed_in"
    assert purchased.json()["detail"]["code"] == "not_signed_in"


def test_corrections_work_on_a_closed_registry(client: TestClient, session: Session) -> None:
    """D16 / D53: a closed list still accepts a release and a mark-bought (D34)."""
    headers, registry = _open(session)
    first = add_product(session, registry, title="Blanket", position=0)
    second = add_product(session, registry, title="Bottles", position=1)
    _, hold_a = _hold(client, registry, first)
    _, hold_b = _hold(client, registry, second)
    registry.closed_at = datetime.now(UTC)
    session.flush()

    released = _correct(client, "release", hold_a, headers)
    purchased = _correct(client, "purchased", hold_b, headers)

    assert released.status_code == purchased.status_code == 204
    assert _row(session, hold_a).state == "released"
    assert _row(session, hold_a).resolved_by == "couple"
    assert _row(session, hold_b).state == "purchased"
    assert _row(session, hold_b).resolved_by == "couple"
    assert _row(session, hold_b).reported_at is None


def test_a_hidden_item_can_still_be_corrected(client: TestClient, session: Session) -> None:
    """D16 / D53: hiding an item does not freeze the hold."""
    headers, registry = _open(session)
    item = add_product(session, registry, title="Mobile")
    _, reservation_id = _hold(client, registry, item)
    item.is_active = False
    session.flush()

    response = _correct(client, "release", reservation_id, headers)

    assert response.status_code == 204
    assert _row(session, reservation_id).state == "released"
    assert _row(session, reservation_id).resolved_by == "couple"
    fresh = _item(session, item)
    assert fresh.quantity_claimed == 0
    assert fresh.is_active is False


def test_a_guest_release_records_resolved_by_guest(client: TestClient, session: Session) -> None:
    """D16 / D53: the guest's own release is the transition that counts."""
    registry = make_registry(session)
    item = add_product(session, registry, title="Lamp")
    guest_id, reservation_id = _hold(client, registry, item)

    response = _guest_release(client, registry, reservation_id, guest_id)

    assert response.status_code == 204
    stored = _row(session, reservation_id)
    assert stored.state == "released"
    assert stored.resolved_by == "guest"


def test_a_guest_report_yes_records_resolved_by_guest(client: TestClient, session: Session) -> None:
    """D16 / D53: a guest's yes is the transition that counts."""
    registry = make_registry(session)
    item = add_product(session, registry, title="Monitor")
    guest_id, reservation_id = _hold(client, registry, item)

    response = _report(client, registry, reservation_id, guest_id, purchased=True)

    assert response.status_code == 200
    stored = _row(session, reservation_id)
    assert stored.state == "purchased"
    assert stored.resolved_by == "guest"


def test_a_guest_report_no_records_resolved_by_guest(client: TestClient, session: Session) -> None:
    """D16 / D53: a guest's no is the transition that counts."""
    registry = make_registry(session)
    item = add_product(session, registry, title="Basket")
    guest_id, reservation_id = _hold(client, registry, item)

    response = _report(client, registry, reservation_id, guest_id, purchased=False)

    assert response.status_code == 200
    stored = _row(session, reservation_id)
    assert stored.state == "released"
    assert stored.resolved_by == "guest"
