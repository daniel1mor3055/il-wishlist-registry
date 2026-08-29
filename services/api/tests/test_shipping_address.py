"""The D49 shipping-address reveal.

Same contract as the Bit handle: a dedicated GET, never a field on the public
registry payload, unpublished indistinguishable from missing.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.factories import make_registry

REVEAL = "/api/v1/public/registries/{slug}/shipping-address"


def reveal(client: TestClient, slug: str):
    return client.get(REVEAL.format(slug=slug))


def test_the_address_is_revealed_only_by_its_own_request(
    client: TestClient, session: Session
) -> None:
    registry = make_registry(session)

    revealed = reveal(client, registry.slug)
    page = client.get(f"/api/v1/public/registries/{registry.slug}")

    assert revealed.json() == {
        "recipientName": "נועה ואיתי",
        "street": "דיזנגוף 99",
        "apartment": "דירה 12",
        "city": "תל אביב",
        "postalCode": "6433228",
        "copyText": "נועה ואיתי\nדיזנגוף 99\nדירה 12\nתל אביב\n6433228",
    }
    assert page.json()["hasShippingAddress"] is True
    assert "דיזנגוף 99" not in page.text


def test_city_alone_is_not_a_shipping_address(client: TestClient, session: Session) -> None:
    """The public caption is not enough to fill a checkout form."""
    registry = make_registry(session)
    registry.shipping_street = None
    registry.shipping_apartment = None
    registry.shipping_postal_code = None
    session.flush()

    response = reveal(client, registry.slug)
    page = client.get(f"/api/v1/public/registries/{registry.slug}")

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "shipping_address_unset"
    assert page.json()["hasShippingAddress"] is False
    assert page.json()["city"] == "תל אביב"


def test_a_closed_registry_still_reveals_the_address(client: TestClient, session: Session) -> None:
    """A guest who already holds a unit may still be typing it into the shop."""
    registry = make_registry(session, closed=True)

    assert reveal(client, registry.slug).status_code == 200


def test_an_unpublished_registry_reveals_no_address(client: TestClient, session: Session) -> None:
    registry = make_registry(session, published=False)

    response = reveal(client, registry.slug)

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "registry_not_found"


def test_the_reveal_is_read_only() -> None:
    from app.main import app

    paths = app.openapi()["paths"]
    path = "/api/v1/public/registries/{slug}/shipping-address"
    assert set(paths[path]) == {"get"}
