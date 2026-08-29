"""The couple's own routes.

Three properties carry the weight here.

*Isolation.* Someone else's registry and a made-up id must be the same answer,
because the difference is what a probe is looking for.

*No silent undo of a guest's action.* Most of this file is about the couple being
stopped from erasing a hold or a contribution by editing around it.

*The public payload does not widen.* Adding an owner view is exactly the change
that leaks a payment handle into the guest page, so the golden-key test in
`test_public_read.py` is the other half of this file.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.registry.models import Registry, RegistryItem
from tests.factories import (
    add_envelope,
    add_product,
    make_catalog_item,
    make_couple,
    make_registry,
    sign_in,
)

ME = "/api/v1/me"


@pytest.fixture
def owner(session: Session) -> dict[str, str]:
    """A signed-in couple with no registry yet."""
    couple = make_couple(session)
    return {"X-Session-Token": sign_in(session, couple)}


@pytest.fixture
def owner_with_list(session: Session) -> tuple[dict[str, str], Registry]:
    couple = make_couple(session)
    registry = make_registry(session, couple=couple)
    return {"X-Session-Token": sign_in(session, couple)}, registry


def test_the_wizard_creates_an_unpublished_list(client: TestClient, owner: dict[str, str]) -> None:
    response = client.post(
        f"{ME}/registry",
        headers=owner,
        json={
            "coupleNames": "נועה ואיתי",
            "dueDate": "2026-11-01",
            "city": "חיפה",
            "shippingStreet": "הרצל 1",
            "shippingEntrance": "א",
            "shippingFloor": "2",
            "shippingApartment": "3",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["publishedAt"] is None
    assert body["coupleNames"] == "נועה ואיתי"
    assert body["city"] == "חיפה"
    assert body["shippingStreet"] == "הרצל 1"
    assert body["slug"].startswith("noa-vaiti-")


def test_the_starter_categories_put_real_products_on_the_list(
    client: TestClient, owner: dict[str, str], session: Session
) -> None:
    make_catalog_item(session, category="bath", title="אמבטיה", price_agorot=12_000)
    make_catalog_item(session, category="bath", title="מגבת", price_agorot=4_000)

    body = client.post(
        f"{ME}/registry",
        headers=owner,
        json={
            "coupleNames": "נועה ואיתי",
            "starterCategories": ["bath"],
            "includeEnvelope": False,
        },
    ).json()

    products = [item for item in body["items"] if item["kind"] == "product"]
    assert products, "a chosen category should contribute items"
    assert all(item["category"] == "bath" for item in products)
    assert all(item["priceAgorot"] for item in products)


def test_the_envelope_is_offered_and_can_be_declined(
    client: TestClient, owner: dict[str, str]
) -> None:
    body = client.post(
        f"{ME}/registry",
        headers=owner,
        json={"coupleNames": "נועה ואיתי", "includeEnvelope": False},
    ).json()
    assert [item for item in body["items"] if item["kind"] == "fund"] == []

    added = client.post(f"{ME}/registry/envelope", headers=owner)
    assert added.status_code == 201
    assert added.json()["kind"] == "fund"

    again = client.post(f"{ME}/registry/envelope", headers=owner)
    assert again.status_code == 409
    assert again.json()["detail"]["code"] == "envelope_exists"


def test_a_couple_gets_one_registry(client: TestClient, owner: dict[str, str]) -> None:
    first = client.post(f"{ME}/registry", headers=owner, json={"coupleNames": "נועה ואיתי"})
    second = client.post(f"{ME}/registry", headers=owner, json={"coupleNames": "משהו אחר"})

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.json()["detail"]["code"] == "registry_exists"


def test_the_owner_view_carries_what_the_guest_view_hides(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry]
) -> None:
    headers, registry = owner_with_list

    body = client.get(f"{ME}/registry", headers=headers).json()

    assert body["paymentHandle"] == "050-123-4567"
    assert body["paymentMethod"] == "bit"
    assert body["shippingStreet"] == "דיזנגוף 99"
    assert body["publishedAt"] is not None


def test_the_owner_view_still_hides_who_gave(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry]
) -> None:
    """The tracker owns giver names, and it is not this endpoint.

    A couple loading their editor should not be handed everyone's name as a side
    effect; when the tracker lands it will be a screen they choose to open.
    """
    headers, _ = owner_with_list

    body = client.get(f"{ME}/registry", headers=headers).json()

    forbidden = {"giverName", "givers", "reservations", "blessings", "contributions"}
    assert forbidden.isdisjoint(body)
    assert all(forbidden.isdisjoint(item) for item in body["items"])


def test_publishing_makes_the_guest_page_work(client: TestClient, owner: dict[str, str]) -> None:
    created = client.post(
        f"{ME}/registry", headers=owner, json={"coupleNames": "נועה ואיתי"}
    ).json()
    slug = created["slug"]

    assert client.get(f"/api/v1/public/registries/{slug}").status_code == 404

    published = client.post(f"{ME}/registry/publish", headers=owner)

    assert published.status_code == 200
    assert published.json()["publishedAt"] is not None
    assert client.get(f"/api/v1/public/registries/{slug}").status_code == 200


def test_publishing_twice_keeps_the_first_date(client: TestClient, owner: dict[str, str]) -> None:
    client.post(f"{ME}/registry", headers=owner, json={"coupleNames": "נועה ואיתי"})

    first = client.post(f"{ME}/registry/publish", headers=owner).json()["publishedAt"]
    second = client.post(f"{ME}/registry/publish", headers=owner).json()["publishedAt"]

    assert first == second


def test_an_empty_list_cannot_be_published(client: TestClient, owner: dict[str, str]) -> None:
    """Sending a link to nothing is worse than not sending it yet."""
    client.post(
        f"{ME}/registry",
        headers=owner,
        json={"coupleNames": "נועה ואיתי", "includeEnvelope": False},
    )

    response = client.post(f"{ME}/registry/publish", headers=owner)

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "registry_empty"


def test_adding_from_the_catalog_copies_the_fields(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry], session: Session
) -> None:
    """The client sends an id. Everything else is read here (D22)."""
    headers, registry = owner_with_list
    catalog = make_catalog_item(session, title="עגלת תינוק", price_agorot=129_000)

    response = client.post(
        f"{ME}/registry/items/catalog",
        headers=headers,
        json={
            "catalogItemId": str(catalog.id),
            "quantityWanted": 2,
            "note": "בצבע אפור",
            "title": "עגלה בחינם",
            "priceAgorot": 1,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "עגלת תינוק"
    assert body["priceAgorot"] == 129_000
    assert body["chainNameHe"] == "חנות בדיקה"
    assert body["quantityWanted"] == 2
    assert body["note"] == "בצבע אפור"


def test_a_catalog_item_that_is_not_there(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry]
) -> None:
    headers, _ = owner_with_list

    response = client.post(
        f"{ME}/registry/items/catalog",
        headers=headers,
        json={"catalogItemId": "00000000-0000-0000-0000-000000000000"},
    )

    assert response.status_code == 404


def test_adding_by_hand_needs_only_a_title(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry]
) -> None:
    headers, _ = owner_with_list

    response = client.post(
        f"{ME}/registry/items/manual",
        headers=headers,
        json={"title": "משאבת חלב ידנית"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "משאבת חלב ידנית"
    assert body["priceAgorot"] is None
    assert body["chainNameHe"] is None


def test_items_land_at_the_end(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry], session: Session
) -> None:
    headers, registry = owner_with_list
    add_product(session, registry, position=4)

    first = client.post(f"{ME}/registry/items/manual", headers=headers, json={"title": "אחד"})
    second = client.post(f"{ME}/registry/items/manual", headers=headers, json={"title": "שתיים"})

    assert first.json()["position"] == 5
    assert second.json()["position"] == 6


def test_item_settings_save(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry], session: Session
) -> None:
    headers, registry = owner_with_list
    item = add_product(session, registry)

    response = client.patch(
        f"{ME}/registry/items/{item.id}",
        headers=headers,
        json={"quantityWanted": 3, "note": "אחד לבית ואחד לגן"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["quantityWanted"] == 3
    assert body["note"] == "אחד לבית ואחד לגן"


def test_group_gifting_takes_its_target_from_the_price(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry], session: Session
) -> None:
    """One number, not two (D28), so the target cannot drift from the price."""
    headers, registry = owner_with_list
    item = add_product(session, registry, price_agorot=129_000)

    turned_on = client.patch(
        f"{ME}/registry/items/{item.id}", headers=headers, json={"groupGiftEnabled": True}
    ).json()
    assert turned_on["targetAgorot"] == 129_000

    repriced = client.patch(
        f"{ME}/registry/items/{item.id}", headers=headers, json={"priceAgorot": 99_000}
    ).json()
    assert repriced["targetAgorot"] == 99_000


def test_group_gifting_needs_a_price(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry], session: Session
) -> None:
    headers, registry = owner_with_list
    item = add_product(session, registry, price_agorot=None)

    response = client.patch(
        f"{ME}/registry/items/{item.id}", headers=headers, json={"groupGiftEnabled": True}
    )

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "group_gift_needs_price"


def test_group_gifting_is_one_object(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry], session: Session
) -> None:
    headers, registry = owner_with_list
    item = add_product(session, registry, quantity_wanted=3)

    response = client.patch(
        f"{ME}/registry/items/{item.id}", headers=headers, json={"groupGiftEnabled": True}
    )

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "group_gift_needs_single_unit"


def test_the_envelope_cannot_become_a_group_gift(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry], session: Session
) -> None:
    headers, registry = owner_with_list
    envelope = add_envelope(session, registry)

    response = client.patch(
        f"{ME}/registry/items/{envelope.id}", headers=headers, json={"groupGiftEnabled": True}
    )

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "group_gift_needs_product"


def test_group_gifting_cannot_be_switched_off_over_real_money(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry], session: Session
) -> None:
    """Guests have already given toward this. The couple does not get to undo it."""
    headers, registry = owner_with_list
    item = add_product(
        session,
        registry,
        group_gift_enabled=True,
        target_agorot=129_000,
        contributed_agorot=45_000,
        contributor_count=3,
    )

    response = client.patch(
        f"{ME}/registry/items/{item.id}", headers=headers, json={"groupGiftEnabled": False}
    )

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "group_gift_has_money"


def test_quantity_cannot_drop_below_what_guests_hold(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry], session: Session
) -> None:
    headers, registry = owner_with_list
    item = add_product(session, registry, quantity_wanted=4, quantity_claimed=2)

    response = client.patch(
        f"{ME}/registry/items/{item.id}", headers=headers, json={"quantityWanted": 1}
    )

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "quantity_below_claimed"


def test_an_untouched_item_is_deleted(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry], session: Session
) -> None:
    headers, registry = owner_with_list
    item = add_product(session, registry)

    assert client.delete(f"{ME}/registry/items/{item.id}", headers=headers).status_code == 204

    assert session.get(RegistryItem, item.id) is None


def test_an_item_a_guest_acted_on_is_hidden_not_deleted(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry], session: Session
) -> None:
    """Deleting the row would take the guest's gift with it."""
    headers, registry = owner_with_list
    item = add_product(session, registry, quantity_claimed=1, claim_state="purchased")

    assert client.delete(f"{ME}/registry/items/{item.id}", headers=headers).status_code == 204

    session.expire_all()
    still_there = session.get(RegistryItem, item.id)
    assert still_there is not None
    assert still_there.is_active is False

    listed = client.get(f"{ME}/registry", headers=headers).json()
    assert [i["id"] for i in listed["items"] if i["isActive"]] == []


def test_a_hidden_item_leaves_the_guest_page(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry], session: Session
) -> None:
    headers, registry = owner_with_list
    item = add_product(session, registry, quantity_claimed=1, claim_state="purchased")

    client.delete(f"{ME}/registry/items/{item.id}", headers=headers)

    public = client.get(f"/api/v1/public/registries/{registry.slug}").json()
    assert public["items"] == []


def test_another_couples_item_does_not_exist(
    client: TestClient, owner: dict[str, str], session: Session
) -> None:
    """Not yours and not real are the same answer, so a probe learns nothing."""
    stranger = make_registry(session)
    theirs = add_product(session, stranger)

    patched = client.patch(
        f"{ME}/registry/items/{theirs.id}", headers=owner, json={"title": "שלי עכשיו"}
    )
    deleted = client.delete(f"{ME}/registry/items/{theirs.id}", headers=owner)

    assert patched.status_code == 404
    assert deleted.status_code == 404
    assert patched.json()["detail"]["code"] == "item_not_found"
    session.expire_all()
    assert session.get(RegistryItem, theirs.id) is not None


def test_another_couples_registry_is_untouched_by_a_patch(
    client: TestClient, owner: dict[str, str], session: Session
) -> None:
    stranger = make_registry(session)

    response = client.patch(f"{ME}/registry", headers=owner, json={"coupleNames": "לא שלי"})

    assert response.status_code == 404
    session.expire_all()
    assert session.get(Registry, stranger.id).couple_names == "נועה ואיתי"


def test_payment_details_are_saved_but_not_published(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry]
) -> None:
    headers, registry = owner_with_list

    saved = client.patch(
        f"{ME}/registry",
        headers=headers,
        json={"paymentMethod": "paybox", "paymentHandle": "052-000-1111"},
    ).json()
    assert saved["paymentHandle"] == "052-000-1111"

    public = client.get(f"/api/v1/public/registries/{registry.slug}").json()
    assert "paymentHandle" not in public
    assert "052-000-1111" not in str(public)


def test_shipping_address_is_saved_but_not_published(
    client: TestClient, owner_with_list: tuple[dict[str, str], Registry]
) -> None:
    """D49: the couple sees the street; a guest page scrape does not."""
    headers, registry = owner_with_list

    saved = client.patch(
        f"{ME}/registry",
        headers=headers,
        json={
            "shippingStreet": "הרצל 15",
            "shippingEntrance": "ב",
            "shippingFloor": "4",
            "shippingApartment": "12",
            "shippingNotes": "הכניסה מאחורי המאפייה",
            "shippingPostalCode": "6100000",
            "city": "חיפה",
        },
    ).json()
    assert saved["shippingStreet"] == "הרצל 15"
    assert saved["shippingEntrance"] == "ב"
    assert saved["shippingFloor"] == "4"
    assert saved["shippingApartment"] == "12"
    assert saved["shippingNotes"] == "הכניסה מאחורי המאפייה"
    assert saved["city"] == "חיפה"

    public = client.get(f"/api/v1/public/registries/{registry.slug}").json()
    assert public["hasShippingAddress"] is True
    assert public["city"] == "חיפה"
    assert "הרצל 15" not in str(public)
    assert "shippingStreet" not in public


def test_the_slug_is_not_guessable(client: TestClient, session: Session) -> None:
    """The link is the invitation (D6), so two lists for the same names differ."""
    slugs = set()
    for _ in range(3):
        couple = make_couple(session)
        headers = {"X-Session-Token": sign_in(session, couple)}
        slugs.add(
            client.post(
                f"{ME}/registry", headers=headers, json={"coupleNames": "נועה ואיתי"}
            ).json()["slug"]
        )

    assert len(slugs) == 3
    assert all(len(slug) > len("noa-vaiti-") for slug in slugs)
    assert (
        session.execute(select(Registry).where(Registry.slug.in_(slugs))).scalars().all()
        is not None
    )
