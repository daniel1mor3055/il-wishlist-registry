"""The couple's gift tracker (D52)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.gifting.models import Blessing, Contribution, Reservation
from app.registry.models import Registry, RegistryItem
from tests.factories import add_envelope, add_product, make_couple, make_registry, sign_in

GIFTS = "/api/v1/me/registry/gifts"
_START = datetime(2026, 6, 1, tzinfo=UTC)

TRACKER_KEYS = {"held", "purchased", "contributions", "blessings"}
ITEM_KEYS = {"id", "title", "kind", "imageUrl", "category", "isActive"}
RESERVATION_KEYS = {
    "id",
    "item",
    "state",
    "giverName",
    "createdAt",
    "reportedAt",
    "resolvedBy",
    "blessing",
}
CONTRIBUTION_KEYS = {
    "id",
    "item",
    "giverName",
    "amountAgorot",
    "createdAt",
    "blessing",
}
BLESSING_KEYS = {"id", "giverName", "message", "createdAt", "item"}


def _at(hours: int) -> datetime:
    return _START + timedelta(hours=hours)


def _open(session: Session) -> tuple[dict[str, str], Registry]:
    couple = make_couple(session)
    registry = make_registry(session, couple=couple)
    return {"X-Session-Token": sign_in(session, couple)}, registry


def _reservation(
    session: Session,
    registry: Registry,
    item: RegistryItem,
    *,
    guest_id: UUID,
    state: str,
    created_at: datetime,
    giver_name: str | None = None,
    reported_at: datetime | None = None,
) -> Reservation:
    row = Reservation(
        registry_id=registry.id,
        item_id=item.id,
        guest_id=guest_id,
        state=state,
        giver_name=giver_name,
        idempotency_key=uuid4().hex,
        created_at=created_at,
        reported_at=reported_at,
        released_at=created_at if state == "released" else None,
    )
    session.add(row)
    session.flush()
    return row


def _contribution(
    session: Session,
    registry: Registry,
    item: RegistryItem,
    *,
    guest_id: UUID,
    amount_agorot: int,
    created_at: datetime,
    giver_name: str | None = None,
) -> Contribution:
    row = Contribution(
        registry_id=registry.id,
        item_id=item.id,
        guest_id=guest_id,
        amount_agorot=amount_agorot,
        giver_name=giver_name,
        idempotency_key=uuid4().hex,
        created_at=created_at,
    )
    session.add(row)
    session.flush()
    return row


def _blessing(
    session: Session,
    registry: Registry,
    *,
    guest_id: UUID,
    created_at: datetime,
    item_id: UUID | None = None,
    giver_name: str | None = None,
    message: str | None = None,
) -> Blessing:
    row = Blessing(
        registry_id=registry.id,
        item_id=item_id,
        guest_id=guest_id,
        giver_name=giver_name,
        message=message,
        idempotency_key=uuid4().hex,
        created_at=created_at,
    )
    session.add(row)
    session.flush()
    return row


def _key_names(payload: object) -> list[str]:
    names: list[str] = []
    if isinstance(payload, dict):
        for key, value in payload.items():
            names.append(key)
            names.extend(_key_names(value))
    elif isinstance(payload, list):
        for value in payload:
            names.extend(_key_names(value))
    return names


def test_sections_put_stuck_holds_first_and_skip_released(
    client: TestClient, session: Session
) -> None:
    """D52 / D15: held oldest first, purchases and money newest; each amount is that guest's."""
    headers, registry = _open(session)
    stroller = add_product(session, registry, title="Stroller", category="mobility")
    envelope = add_envelope(
        session, registry, title="Envelope", contributed_agorot=0, contributor_count=0
    )
    _reservation(
        session,
        registry,
        stroller,
        guest_id=uuid4(),
        state="held",
        giver_name="Early Hold",
        created_at=_at(1),
    )
    _reservation(
        session,
        registry,
        stroller,
        guest_id=uuid4(),
        state="held",
        giver_name="Late Hold",
        created_at=_at(5),
    )
    _reservation(
        session,
        registry,
        stroller,
        guest_id=uuid4(),
        state="purchased",
        giver_name="Early Buy",
        created_at=_at(0),
        reported_at=_at(2),
    )
    _reservation(
        session,
        registry,
        stroller,
        guest_id=uuid4(),
        state="purchased",
        giver_name="Quiet Buy",
        created_at=_at(4),
    )
    _reservation(
        session,
        registry,
        stroller,
        guest_id=uuid4(),
        state="purchased",
        giver_name="Late Buy",
        created_at=_at(1),
        reported_at=_at(8),
    )
    released = _reservation(
        session,
        registry,
        stroller,
        guest_id=uuid4(),
        state="released",
        giver_name="Let Go",
        created_at=_at(9),
    )
    _contribution(
        session,
        registry,
        envelope,
        guest_id=uuid4(),
        amount_agorot=1_500,
        giver_name="Small Gift",
        created_at=_at(1),
    )
    _contribution(
        session,
        registry,
        envelope,
        guest_id=uuid4(),
        amount_agorot=90_000,
        giver_name="Big Gift",
        created_at=_at(6),
    )

    response = client.get(GIFTS, headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert set(body) == TRACKER_KEYS
    assert [row["giverName"] for row in body["held"]] == ["Early Hold", "Late Hold"]
    assert [row["state"] for row in body["held"]] == ["held", "held"]
    assert body["held"][0]["reportedAt"] is None
    assert [row["resolvedBy"] for row in body["held"]] == [None, None]
    assert body["held"][0]["blessing"] is None
    assert set(body["held"][0]) == RESERVATION_KEYS
    held_item = body["held"][0]["item"]
    assert set(held_item) == ITEM_KEYS
    assert held_item["kind"] == "product"
    assert held_item["category"] == "mobility"
    assert held_item["isActive"] is True
    assert held_item["id"] == str(stroller.id)
    assert [row["giverName"] for row in body["purchased"]] == [
        "Late Buy",
        "Quiet Buy",
        "Early Buy",
    ]
    assert body["purchased"][0]["reportedAt"] is not None
    assert body["purchased"][1]["reportedAt"] is None
    assert body["purchased"][0]["state"] == "purchased"
    assert [row["resolvedBy"] for row in body["purchased"]] == [None, None, None]
    assert [row["giverName"] for row in body["contributions"]] == ["Big Gift", "Small Gift"]
    assert [row["amountAgorot"] for row in body["contributions"]] == [90_000, 1_500]
    assert set(body["contributions"][0]) == CONTRIBUTION_KEYS
    fund = body["contributions"][0]["item"]
    assert set(fund) == ITEM_KEYS
    assert fund["kind"] == "fund"
    assert fund["category"] is None
    assert fund["imageUrl"] is None
    assert body["blessings"] == []
    assert str(released.id) not in response.text
    assert "Let Go" not in response.text
    assert "giver_name" not in response.text
    assert "created_at" not in response.text
    assert "amount_agorot" not in response.text
    assert "is_active" not in response.text


def test_a_message_rides_its_gift_or_stands_alone(
    client: TestClient, session: Session
) -> None:
    """D52 / D17: a message rides its gift; an unmatched one stands alone; a name does not."""
    headers, registry = _open(session)
    stroller = add_product(session, registry, title="Stroller")
    ada = uuid4()
    cara = uuid4()
    _reservation(
        session,
        registry,
        stroller,
        guest_id=ada,
        state="held",
        giver_name="Ada",
        created_at=_at(1),
    )
    _blessing(
        session,
        registry,
        guest_id=ada,
        item_id=stroller.id,
        message="thanks for this",
        created_at=_at(2),
    )
    _blessing(
        session,
        registry,
        guest_id=uuid4(),
        message="standing alone",
        giver_name="Bea",
        created_at=_at(3),
    )
    _reservation(
        session,
        registry,
        stroller,
        guest_id=cara,
        state="held",
        giver_name="Cara",
        created_at=_at(4),
    )
    _blessing(
        session,
        registry,
        guest_id=cara,
        item_id=stroller.id,
        giver_name="Matched Name Only",
        created_at=_at(4),
    )
    _blessing(
        session,
        registry,
        guest_id=uuid4(),
        item_id=stroller.id,
        giver_name="Lonely Name Only",
        created_at=_at(5),
    )
    drew = uuid4()
    _reservation(
        session,
        registry,
        stroller,
        guest_id=drew,
        state="released",
        giver_name="Drew",
        created_at=_at(1),
    )
    _blessing(
        session,
        registry,
        guest_id=drew,
        item_id=stroller.id,
        giver_name="Gina",
        message="after a release",
        created_at=_at(6),
    )

    response = client.get(GIFTS, headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert [row["giverName"] for row in body["held"]] == ["Ada", "Cara"]
    assert body["held"][0]["blessing"] == "thanks for this"
    assert body["held"][1]["blessing"] is None
    assert body["purchased"] == []
    assert body["contributions"] == []
    assert [row["message"] for row in body["blessings"]] == [
        "after a release",
        "standing alone",
    ]
    released_note = body["blessings"][0]
    assert set(released_note) == BLESSING_KEYS
    assert released_note["giverName"] == "Gina"
    assert released_note["item"]["id"] == str(stroller.id)
    assert body["blessings"][1]["item"] is None
    assert response.text.count("thanks for this") == 1
    assert "Matched Name Only" not in response.text
    assert "Lonely Name Only" not in response.text
    assert "Drew" not in response.text


def test_the_newest_message_lands_on_the_newest_gift(
    client: TestClient, session: Session
) -> None:
    """D52: the newest message stays on the gift, and it follows the newest gift."""
    headers, registry = _open(session)
    stroller = add_product(session, registry, title="Stroller")
    eve = uuid4()
    finn = uuid4()
    _reservation(
        session,
        registry,
        stroller,
        guest_id=eve,
        state="held",
        giver_name="Eve",
        created_at=_at(1),
    )
    _blessing(
        session,
        registry,
        guest_id=eve,
        item_id=stroller.id,
        message="older note",
        created_at=_at(2),
    )
    _blessing(
        session,
        registry,
        guest_id=eve,
        item_id=stroller.id,
        message="newer note",
        created_at=_at(5),
    )
    _reservation(
        session,
        registry,
        stroller,
        guest_id=finn,
        state="held",
        giver_name="Finn",
        created_at=_at(2),
    )
    _contribution(
        session,
        registry,
        stroller,
        guest_id=finn,
        amount_agorot=2_000,
        giver_name="Finn Pay",
        created_at=_at(6),
    )
    _blessing(
        session,
        registry,
        guest_id=finn,
        item_id=stroller.id,
        message="on the newer gift",
        created_at=_at(3),
    )

    response = client.get(GIFTS, headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert [row["giverName"] for row in body["held"]] == ["Eve", "Finn"]
    assert body["held"][0]["blessing"] == "newer note"
    assert body["held"][1]["blessing"] is None
    assert len(body["contributions"]) == 1
    assert body["contributions"][0]["giverName"] == "Finn Pay"
    assert body["contributions"][0]["amountAgorot"] == 2_000
    assert body["contributions"][0]["blessing"] == "on the newer gift"
    assert [row["message"] for row in body["blessings"]] == ["older note"]
    assert body["blessings"][0]["item"]["id"] == str(stroller.id)


def test_a_gift_on_a_hidden_item_stays_listed(
    client: TestClient, session: Session
) -> None:
    """D52: hiding an item takes it off the guest list, not out of the tracker."""
    headers, registry = _open(session)
    hidden = add_product(session, registry, title="Hidden blanket", is_active=False)
    row = _reservation(
        session,
        registry,
        hidden,
        guest_id=uuid4(),
        state="held",
        giver_name="Ada",
        created_at=_at(1),
    )

    response = client.get(GIFTS, headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body["held"]) == 1
    assert body["held"][0]["id"] == str(row.id)
    assert body["held"][0]["item"]["id"] == str(hidden.id)
    assert body["held"][0]["item"]["isActive"] is False


def test_unsigned_is_401(client: TestClient) -> None:
    """A missing session is the same 401 as every other /me route."""
    response = client.get(GIFTS)

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "not_signed_in"


def test_a_couple_without_a_registry_is_404(client: TestClient, session: Session) -> None:
    """D52: signed in with no registry is a 404, the same code as the editor read."""
    headers = {"X-Session-Token": sign_in(session, make_couple(session))}

    response = client.get(GIFTS, headers=headers)

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "no_registry"


def test_a_couple_sees_only_its_own_gifts(client: TestClient, session: Session) -> None:
    """D44: holds, money, and blessings are scoped to the signed-in couple's registry."""
    headers_a, registry_a = _open(session)
    headers_b, registry_b = _open(session)
    item_a = add_product(session, registry_a, title="Stroller A")
    item_b = add_product(session, registry_b, title="Stroller B")
    gift_a = _reservation(
        session,
        registry_a,
        item_a,
        guest_id=uuid4(),
        state="held",
        giver_name="From A",
        created_at=_at(1),
    )
    pay_a = _contribution(
        session,
        registry_a,
        item_a,
        guest_id=uuid4(),
        amount_agorot=1_500,
        giver_name="Paid A",
        created_at=_at(2),
    )
    note_a = _blessing(
        session,
        registry_a,
        guest_id=uuid4(),
        message="Note from A",
        created_at=_at(3),
    )
    gift_b = _reservation(
        session,
        registry_b,
        item_b,
        guest_id=uuid4(),
        state="held",
        giver_name="From B",
        created_at=_at(1),
    )
    pay_b = _contribution(
        session,
        registry_b,
        item_b,
        guest_id=uuid4(),
        amount_agorot=2_000,
        giver_name="Paid B",
        created_at=_at(2),
    )
    note_b = _blessing(
        session,
        registry_b,
        guest_id=uuid4(),
        message="Note from B",
        created_at=_at(3),
    )

    seen_a = client.get(GIFTS, headers=headers_a)
    seen_b = client.get(GIFTS, headers=headers_b)

    assert seen_a.status_code == 200
    assert seen_b.status_code == 200
    body_a = seen_a.json()
    body_b = seen_b.json()
    assert [row["id"] for row in body_a["held"]] == [str(gift_a.id)]
    assert [row["id"] for row in body_a["contributions"]] == [str(pay_a.id)]
    assert [row["id"] for row in body_a["blessings"]] == [str(note_a.id)]
    assert body_a["purchased"] == []
    assert [row["id"] for row in body_b["held"]] == [str(gift_b.id)]
    assert [row["id"] for row in body_b["contributions"]] == [str(pay_b.id)]
    assert [row["id"] for row in body_b["blessings"]] == [str(note_b.id)]
    for marker in (str(gift_b.id), str(pay_b.id), str(note_b.id), "Note from B", "From B"):
        assert marker not in seen_a.text
    for marker in (str(gift_a.id), str(pay_a.id), str(note_a.id), "Note from A", "From A"):
        assert marker not in seen_b.text


def test_the_guest_cookie_never_leaves(client: TestClient, session: Session) -> None:
    """D52: the guest cookie id is neither a key nor a value on the tracker."""
    headers, registry = _open(session)
    stroller = add_product(session, registry, title="Stroller")
    envelope = add_envelope(
        session, registry, title="Envelope", contributed_agorot=0, contributor_count=0
    )
    holder = uuid4()
    payer = uuid4()
    writer = uuid4()
    _reservation(
        session,
        registry,
        stroller,
        guest_id=holder,
        state="held",
        giver_name="Ada",
        created_at=_at(1),
    )
    _blessing(
        session,
        registry,
        guest_id=holder,
        item_id=stroller.id,
        message="thanks",
        created_at=_at(2),
    )
    _contribution(
        session,
        registry,
        envelope,
        guest_id=payer,
        amount_agorot=2_000,
        giver_name="Bea",
        created_at=_at(3),
    )
    _blessing(
        session,
        registry,
        guest_id=writer,
        message="hello",
        giver_name="Cara",
        created_at=_at(4),
    )

    response = client.get(GIFTS, headers=headers)

    assert response.status_code == 200
    for guest in (holder, payer, writer):
        assert str(guest) not in response.text
    names = [name.lower() for name in _key_names(response.json())]
    forbidden = ("guest", "shipping", "payment", "bit", "paybox", "handle")
    offenders = [name for name in names if any(word in name for word in forbidden)]
    assert offenders == []
