"""The public read contract.

The payload is server-rendered into the guest page's source, so anything in it
is readable by anyone holding the link. That makes its key set a security
boundary rather than a matter of taste, and the first test below is written as a
golden set: adding a column to `registry_items` cannot widen the payload without
failing here, and the failure message names the field.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.factories import add_envelope, add_product, make_registry

REGISTRY_KEYS = {
    "slug",
    "coupleNames",
    "story",
    "coverImageUrl",
    "city",
    "dueDate",
    "babyName",
    "babyGender",
    "lifecycle",
    "itemsTotal",
    "itemsClaimed",
    "hasShippingAddress",
    "hasBit",
    "hasPaybox",
    "items",
}

ITEM_KEYS = {
    "id",
    "kind",
    "title",
    "sourceTitle",
    "note",
    "category",
    "imageUrl",
    "chainSlug",
    "chainNameHe",
    "canonicalUrl",
    "priceAgorot",
    "quantityWanted",
    "quantityClaimed",
    "claimState",
    "groupGiftEnabled",
    "targetAgorot",
    "contributedAgorot",
    "contributorCount",
    "subtitle",
    "caption",
}


def read(client: TestClient, slug: str):
    return client.get(f"/api/v1/public/registries/{slug}")


def test_payload_has_exactly_the_agreed_keys(client: TestClient, session: Session):
    registry = make_registry(session)
    add_product(session, registry)
    add_envelope(session, registry)

    body = read(client, registry.slug).json()

    assert set(body) == REGISTRY_KEYS
    assert body["babyGender"] is None
    for item in body["items"]:
        assert set(item) == ITEM_KEYS


def test_private_fields_never_appear_anywhere_in_the_payload(client: TestClient, session: Session):
    """D8, D13, D15, D17 as one assertion over the serialised bytes.

    A nested model, a new alias or a debug field would all slip past a key-set
    check on the top level, so this looks at the whole document as text.
    """
    registry = make_registry(session)
    add_product(session, registry, quantity_claimed=1, claim_state="reserved")
    add_envelope(session, registry)

    raw = read(client, registry.slug).text

    assert "050-123-4567" not in raw
    assert "דיזנגוף 99" not in raw
    assert "קוד לבניין 4580" not in raw
    for forbidden in (
        "paymentHandle",
        "payment_handle",
        "bitHandle",
        "bit_handle",
        "payboxHandle",
        "paybox_handle",
        "shippingStreet",
        "shipping_street",
        "shippingApartment",
        "shippingEntrance",
        "shippingFloor",
        "shippingNotes",
        "shippingPostalCode",
        "giver",
        "blessing",
        "email",
    ):
        assert forbidden not in raw


def test_unpublished_registry_is_indistinguishable_from_a_wrong_slug(
    client: TestClient, session: Session
):
    """D30. Confirming that a registry exists but is not ready leaks more than
    a flat not-found, and a guest only holds the link because it was sent."""
    registry = make_registry(session, published=False)

    unpublished = read(client, registry.slug)
    missing = read(client, "no-such-registry-anywhere")

    assert unpublished.status_code == missing.status_code == 404
    assert unpublished.json() == missing.json() == {"detail": {"code": "registry_not_found"}}


def test_closed_registry_still_returns_a_payload(client: TestClient, session: Session):
    """The closed page is a read-only thank-you, and its Open Graph card has to
    keep working: a 404 here would degrade the WhatsApp link to a bare URL."""
    registry = make_registry(session, closed=True)
    add_product(session, registry)

    body = read(client, registry.slug).json()

    assert body["lifecycle"] == "closed"
    assert body["coupleNames"] == "נועה ואיתי"
    assert body["hasShippingAddress"] is True


def test_inactive_items_are_hidden(client: TestClient, session: Session):
    registry = make_registry(session)
    add_product(session, registry, title="נשאר")
    add_product(session, registry, position=1, title="הוסר", is_active=False)

    body = read(client, registry.slug).json()

    assert [item["title"] for item in body["items"]] == ["נשאר"]
    assert body["itemsTotal"] == 1


def test_progress_counts_products_only(client: TestClient, session: Session):
    """An envelope has nothing to complete (D28), so counting it would make a
    fully-claimed list unreachable and the celebratory band unreachable with it."""
    registry = make_registry(session)
    add_product(session, registry, claim_state="purchased", quantity_claimed=1)
    add_product(session, registry, position=1, title="כיסא בטיחות")
    add_envelope(session, registry)

    body = read(client, registry.slug).json()

    assert (body["itemsClaimed"], body["itemsTotal"]) == (1, 2)
    assert len(body["items"]) == 3


def test_items_come_back_in_the_couples_order(client: TestClient, session: Session):
    registry = make_registry(session)
    add_product(session, registry, position=2, title="שלישי")
    add_product(session, registry, position=0, title="ראשון")
    add_product(session, registry, position=1, title="שני")

    body = read(client, registry.slug).json()

    assert [item["title"] for item in body["items"]] == ["ראשון", "שני", "שלישי"]
