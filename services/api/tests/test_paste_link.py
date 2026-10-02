"""Paste a Shopify product link: resolve the card, then snapshot it on save."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from collections.abc import Generator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.catalog import resolve as product_resolve
from app.catalog.models import CatalogItem
from app.catalog.product_text import classify, clean_title, display_title
from app.main import app
from app.registry.models import Registry, RegistryItem
from app.registry.owner_schemas import (
    MAX_ITEMS,
    MAX_PRICE_AGOROT as OWNER_MAX_PRICE,
    MIN_PRICE_AGOROT as OWNER_MIN_PRICE,
)
from tests.factories import add_product, make_couple, make_registry, sign_in

RESOLVE = "/api/v1/catalog/resolve"
LINK = "/api/v1/me/registry/items/link"
FETCH = "https://www.shilav.co.il/products/city-mini.js"
STORED = "https://www.shilav.co.il/products/city-mini?variant=55"
PASTE = "https://www.shilav.co.il/products/city-mini?utm_source=ig&variant=55#reviews"
IMAGE = "https://cdn.shopify.com/s/files/stroller.jpg"


@pytest.fixture
def owner(session: Session) -> dict[str, str]:
    return {"X-Session-Token": sign_in(session, make_couple(session))}


@pytest.fixture
def owner_with_list(session: Session) -> tuple[dict[str, str], Registry]:
    couple = make_couple(session)
    registry = make_registry(session, couple=couple)
    return {"X-Session-Token": sign_in(session, couple)}, registry


class _Shop:
    def __init__(self) -> None:
        self.calls: list[str] = []
        self.body: bytes | None = None
        self.error: BaseException | None = None

    def __call__(self, url: str) -> bytes:
        self.calls.append(url)
        if self.error is not None:
            raise self.error
        if self.body is None:
            raise product_resolve.FetchFailed()
        return self.body


@pytest.fixture(autouse=True)
def shop(client: TestClient) -> Generator[_Shop, None, None]:
    script = _Shop()
    app.dependency_overrides[product_resolve.get_product_fetcher] = lambda: script
    yield script


def product_js(
    *,
    product_id: int = 424242,
    title: str = "עגלת תינוק",
    product_type: str = "",
    tags: list[str] | None = None,
    image: str | None = "//cdn.shopify.com/s/files/stroller.jpg?v=9",
    variants: list[dict[str, Any]] | None = None,
    price: Any = 449_000,
    extra: dict[str, Any] | None = None,
) -> bytes:
    if variants is None:
        variants = [
            {
                "id": 55,
                "title": "Default Title",
                "option1": "Default Title",
                "price": price,
                "available": False,
                "compare_at_price": "999.00",
                "featured_image": None,
            }
        ]
    document: dict[str, Any] = {
        "id": product_id,
        "title": title,
        "type": product_type,
        "tags": [] if tags is None else tags,
        "featured_image": image,
        "price": "4490.00",
        "compare_at_price": "999.00",
        "variants": variants,
    }
    if extra:
        document.update(extra)
    return json.dumps(document).encode()


def colourways(
    *,
    left: Any = 10_000,
    right: Any = 20_000,
    varies: bool = True,
) -> bytes:
    return product_js(
        image="//cdn.shopify.com/s/files/parent.jpg?v=4",
        variants=[
            {
                "id": 1,
                "title": "Default Title",
                "option1": "0-3 חודשים",
                "price": left,
                "featured_image": {"src": "https://cdn.shopify.com/s/files/grey.jpg?v=1"},
            },
            {
                "id": 2,
                "title": "כחול",
                "option1": "כחול",
                "price": right,
                "featured_image": {"src": "http://cdn.shopify.com/s/files/blue.jpg?v=2"},
            },
        ],
        extra={"price_varies": varies},
    )


def _resolve(client: TestClient, headers: dict[str, str], url: str, **extra: object):
    return client.post(RESOLVE, headers=headers, json={"url": url, **extra})


def _save(
    client: TestClient,
    headers: dict[str, str],
    url: str,
    variant_id: object = None,
    **extra: object,
):
    payload: dict[str, object] = {"url": url}
    if variant_id is not None:
        payload["variantId"] = variant_id
    payload.update(extra)
    return client.post(LINK, headers=headers, json=payload)


def _items(client: TestClient, headers: dict[str, str]) -> list[dict[str, Any]]:
    response = client.get("/api/v1/me/registry", headers=headers)
    assert response.status_code == 200
    return response.json()["items"]


def _catalog_count(session: Session) -> int:
    return session.execute(select(func.count()).select_from(CatalogItem)).scalar_one()


def test_resolve_and_save_need_a_session(client: TestClient, shop: _Shop) -> None:
    assert client.post(RESOLVE, json={"url": PASTE}).status_code == 401
    assert client.post(LINK, json={"url": PASTE}).status_code == 401
    assert shop.calls == []


def test_paste_price_bounds_match_the_registry() -> None:
    assert product_resolve.MIN_PRICE_AGOROT == OWNER_MIN_PRICE
    assert product_resolve.MAX_PRICE_AGOROT == OWNER_MAX_PRICE


def test_title_and_category_rules_match_the_harvest() -> None:
    assert clean_title("עגלת תינוק - מבצע") == "עגלת תינוק"
    assert clean_title("עגלת תינוק \u2013 חדש") == "עגלת תינוק"
    raw = "הזמנה מוקדמת - עגלת תינוק משולבת / אפור"
    assert display_title(clean_title(raw)) == "עגלת תינוק משולבת"
    assert classify("", "עגלת צעצועים מעץ", []) == "toys"
    assert classify("", "עגלת תינוק דו כיוונית", []) == "mobility"
    assert classify("", "פריט בדיקה כללי מאוד", []) is None


@pytest.mark.parametrize(
    ("pasted", "fetch_url", "stored", "slug", "name_he"),
    [
        (
            "https://shilav.co.il/products/city-mini?utm_source=ig&variant=55&fbclid=abc#reviews",
            "https://www.shilav.co.il/products/city-mini.js",
            "https://www.shilav.co.il/products/city-mini?variant=55",
            "shilav",
            "שילב",
        ),
        (
            "https://www.shilav.co.il/en/collections/strollers/products/city-mini/?variant=55",
            "https://www.shilav.co.il/products/city-mini.js",
            "https://www.shilav.co.il/products/city-mini?variant=55",
            "shilav",
            "שילב",
        ),
        (
            "https://www.motsesim.co.il/products/pacifier?utm_campaign=x&variant=55",
            "https://motsesim.co.il/products/pacifier.js",
            "https://motsesim.co.il/products/pacifier?variant=55",
            "motsetsim",
            "מוצצים",
        ),
        (
            "https://motsesim.co.il/he/products/pacifier/?variant=55",
            "https://motsesim.co.il/products/pacifier.js",
            "https://motsesim.co.il/products/pacifier?variant=55",
            "motsetsim",
            "מוצצים",
        ),
        (
            "https://agalease-baby.co.il/products/city-mini?variant=55&utm_medium=cpc",
            "https://www.agalease-baby.co.il/products/city-mini.js",
            "https://www.agalease-baby.co.il/products/city-mini?variant=55",
            "agalis",
            "עגליס",
        ),
        (
            "https://www.agalease-baby.co.il/en/collections/walkers/products/city-mini/?variant=55",
            "https://www.agalease-baby.co.il/products/city-mini.js",
            "https://www.agalease-baby.co.il/products/city-mini?variant=55",
            "agalis",
            "עגליס",
        ),
        (
            "https://baby-star.co.il/products/city%2Dmini?variant=55&gclid=zzz#q",
            "https://www.baby-star.co.il/products/city-mini.js",
            "https://www.baby-star.co.il/products/city-mini?variant=55",
            "baby-star",
            "בייבי סטאר",
        ),
        (
            "https://WWW.BABY-STAR.CO.IL/products/city-mini?variant=55",
            "https://www.baby-star.co.il/products/city-mini.js",
            "https://www.baby-star.co.il/products/city-mini?variant=55",
            "baby-star",
            "בייבי סטאר",
        ),
    ],
)
def test_a_product_url_fetches_js_and_stores_the_variant(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
    session: Session,
    pasted: str,
    fetch_url: str,
    stored: str,
    slug: str,
    name_he: str,
) -> None:
    """utm and the pasted host never become the request or the stored buy URL."""
    headers, _registry = owner_with_list
    before = _catalog_count(session)
    shop.body = product_js()

    resolved = _resolve(client, headers, pasted)
    assert resolved.status_code == 200
    body = resolved.json()
    assert body["outcome"] == "product"
    assert body["chainSlug"] == slug
    assert body["chainNameHe"] == name_he
    assert body["priceAgorot"] == 449_000
    assert body["canonicalUrl"] == stored
    assert body["variantId"] == "55"
    assert body["externalId"] == "424242"
    assert body["imageUrl"] == IMAGE
    assert body["title"] == "עגלת תינוק"
    assert body["sourceTitle"] is None
    assert body["category"] == "mobility"
    assert shop.calls == [fetch_url]
    assert pasted not in shop.calls

    saved = _save(client, headers, pasted)
    assert saved.status_code == 201
    item = saved.json()
    assert item["chainSlug"] == slug
    assert item["chainNameHe"] == name_he
    assert item["canonicalUrl"] == stored
    assert item["priceAgorot"] == 449_000
    assert item["kind"] == "product"
    assert item["quantityWanted"] == 1
    assert item["groupGiftEnabled"] is False
    assert item["note"] is None
    assert shop.calls == [fetch_url, fetch_url]
    assert _catalog_count(session) == before


def test_save_snapshots_the_read_and_does_not_insert_a_catalog_row(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
    session: Session,
) -> None:
    headers, _registry = owner_with_list
    shop.body = product_js()

    saved = _save(client, headers, PASTE)

    assert saved.status_code == 201
    assert saved.json()["chainSlug"] == "shilav"
    session.expire_all()
    catalog_rows = session.scalars(
        select(CatalogItem).where(CatalogItem.external_id == "424242")
    ).all()
    assert catalog_rows == []
    rows = select(RegistryItem).where(RegistryItem.external_id == "424242")
    row = session.scalars(rows).one()
    assert row.chain_slug == "shilav"
    assert row.price_agorot == 449_000
    assert row.image_url == IMAGE
    assert row.canonical_url == STORED


def test_save_stores_the_second_fetch(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
) -> None:
    headers, _registry = owner_with_list
    shop.body = product_js(price=11_100)
    assert _resolve(client, headers, PASTE).json()["priceAgorot"] == 11_100

    shop.body = product_js(price=22_200)
    saved = _save(client, headers, PASTE)

    assert saved.status_code == 201
    assert saved.json()["priceAgorot"] == 22_200
    assert shop.calls == [FETCH, FETCH]


@pytest.mark.parametrize("price", [100, 10_000_000, "449000"])
def test_an_integer_variant_price_is_agorot(
    client: TestClient,
    shop: _Shop,
    owner: dict[str, str],
    price: object,
) -> None:
    """The product-level price in this document is the decimal string 4490.00."""
    shop.body = product_js(price=price)

    body = _resolve(client, owner, PASTE).json()

    assert body["outcome"] == "product"
    assert body["priceAgorot"] == int(price)


@pytest.mark.parametrize("price", ["4490.00", 4490.0, "4490.0"])
def test_a_decimal_price_is_a_bad_document(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
    price: object,
) -> None:
    headers, _registry = owner_with_list
    shop.body = product_js(price=price)

    resolved = _resolve(client, headers, PASTE)
    assert resolved.json() == {"outcome": "unresolved", "reason": "bad_document", "url": PASTE}

    saved = _save(client, headers, PASTE)
    assert saved.status_code == 422
    assert saved.json()["detail"]["code"] == "bad_document"
    assert _items(client, headers) == []


@pytest.mark.parametrize("price", [99, 10_000_001, None])
def test_a_missing_or_out_of_range_price_does_not_save(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
    price: object,
) -> None:
    headers, _registry = owner_with_list
    shop.body = product_js(price=price)

    assert _resolve(client, headers, PASTE).json()["reason"] == "missing_price"
    saved = _save(client, headers, PASTE)
    assert saved.status_code == 422
    assert saved.json()["detail"]["code"] == "missing_price"
    assert _items(client, headers) == []


def test_price_varies_without_a_variant_does_not_save(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
) -> None:
    headers, _registry = owner_with_list
    shop.body = colourways()
    pasted = "https://www.shilav.co.il/products/city-mini?utm_source=ig"

    resolved = _resolve(client, headers, pasted)
    assert resolved.status_code == 200
    body = resolved.json()
    assert body["outcome"] == "needsVariant"
    assert "priceAgorot" not in body
    assert "variantId" not in body
    assert body["imageUrl"] == "https://cdn.shopify.com/s/files/parent.jpg"
    assert body["canonicalUrl"] == "https://www.shilav.co.il/products/city-mini"
    assert body["variants"] == [
        {
            "id": "1",
            "label": "0-3 חודשים",
            "priceAgorot": 10_000,
            "imageUrl": "https://cdn.shopify.com/s/files/grey.jpg",
        },
        {
            "id": "2",
            "label": "כחול",
            "priceAgorot": 20_000,
            "imageUrl": "https://cdn.shopify.com/s/files/blue.jpg",
        },
    ]
    assert set(body) == {
        "outcome",
        "chainSlug",
        "chainNameHe",
        "externalId",
        "title",
        "sourceTitle",
        "category",
        "imageUrl",
        "canonicalUrl",
        "variants",
    }

    refused = _save(client, headers, pasted)
    assert refused.status_code == 422
    assert refused.json()["detail"]["code"] == "variant_required"
    assert _items(client, headers) == []

    unknown = _save(client, headers, pasted, variant_id="999")
    assert unknown.status_code == 422
    assert unknown.json()["detail"]["code"] == "variant_unknown"
    assert _items(client, headers) == []

    chosen = _save(client, headers, pasted + "&variant=1", variant_id=2)
    assert chosen.status_code == 201
    assert chosen.json()["priceAgorot"] == 20_000
    assert chosen.json()["canonicalUrl"] == "https://www.shilav.co.il/products/city-mini?variant=2"
    assert chosen.json()["imageUrl"] == "https://cdn.shopify.com/s/files/blue.jpg"


def test_a_variant_query_that_matches_nothing_is_not_the_first_variant(
    client: TestClient,
    shop: _Shop,
    owner: dict[str, str],
) -> None:
    shop.body = colourways()
    pasted = "https://www.shilav.co.il/products/city-mini?variant=999"

    body = _resolve(client, owner, pasted).json()

    assert body["outcome"] == "needsVariant"
    assert body["variants"][0]["priceAgorot"] == 10_000
    assert "priceAgorot" not in body


def test_a_matching_variant_query_selects_that_price(
    client: TestClient,
    shop: _Shop,
    owner: dict[str, str],
) -> None:
    shop.body = colourways()
    pasted = "https://www.shilav.co.il/products/city-mini?variant=2&utm_source=ig"

    body = _resolve(client, owner, pasted).json()

    assert body["outcome"] == "product"
    assert body["priceAgorot"] == 20_000
    assert body["variantId"] == "2"
    assert body["canonicalUrl"].endswith("?variant=2")
    assert shop.calls == [FETCH]


def test_a_shared_price_drops_the_variant_and_uses_the_product_image(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
) -> None:
    headers, _registry = owner_with_list
    shop.body = colourways(left=10_000, right=10_000, varies=True)
    pasted = "https://www.shilav.co.il/products/city-mini?variant=2"

    body = _resolve(client, headers, pasted).json()
    assert body["outcome"] == "product"
    assert body["priceAgorot"] == 10_000
    assert body["variantId"] is None
    assert body["canonicalUrl"] == "https://www.shilav.co.il/products/city-mini"
    assert body["imageUrl"] == "https://cdn.shopify.com/s/files/parent.jpg"

    saved = _save(client, headers, pasted, variant_id="999")
    assert saved.status_code == 201
    assert saved.json()["canonicalUrl"] == "https://www.shilav.co.il/products/city-mini"
    assert saved.json()["imageUrl"] == "https://cdn.shopify.com/s/files/parent.jpg"


def test_one_variant_keeps_its_id_when_the_paste_names_another(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
) -> None:
    headers, _registry = owner_with_list
    shop.body = product_js()

    omitted = _save(client, headers, "https://www.shilav.co.il/products/city-mini")
    assert omitted.status_code == 201
    assert omitted.json()["canonicalUrl"] == STORED

    shop.calls.clear()
    wrong = _resolve(client, headers, "https://www.shilav.co.il/products/city-mini?variant=999")
    assert wrong.json()["outcome"] == "product"
    assert wrong.json()["variantId"] == "55"
    assert wrong.json()["canonicalUrl"] == STORED


def test_an_out_of_range_colourway_is_missing_price_when_chosen(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
) -> None:
    headers, _registry = owner_with_list
    shop.body = colourways(left=50, right=20_000)
    pasted = "https://www.shilav.co.il/products/city-mini"

    body = _resolve(client, headers, pasted).json()
    assert [option["priceAgorot"] for option in body["variants"]] == [50, 20_000]

    low = _save(client, headers, pasted, variant_id="1")
    assert low.status_code == 422
    assert low.json()["detail"]["code"] == "missing_price"
    assert _items(client, headers) == []

    high = _save(client, headers, pasted, variant_id="2")
    assert high.status_code == 201
    assert high.json()["priceAgorot"] == 20_000


@pytest.mark.parametrize(
    ("pasted", "reason"),
    [
        ("http://www.shilav.co.il/products/city-mini", "not_https"),
        ("www.shilav.co.il/products/city-mini", "not_https"),
        ("https://user:pass@www.shilav.co.il/products/city-mini", "unknown_host"),
        ("https://127.0.0.1/products/city-mini", "unknown_host"),
        ("https://[::1]/products/city-mini", "unknown_host"),
        ("https://bit.ly/products/city-mini", "unknown_host"),
        ("https://www.shilav.co.il/cart", "not_product"),
        ("https://www.shilav.co.il/collections/strollers", "not_product"),
        ("https://www.shilav.co.il/", "not_product"),
        ("https://www.shilav.co.il", "not_product"),
        ("https://www.shilav.co.il/pages/baby-registry", "not_product"),
        ("https://www.shilav.co.il/products/foo.bar", "not_product"),
        ("https://www.shilav.co.il/products/city%2Emini", "not_product"),
        ("https://www.shilav.co.il/products/" + "a" * 202, "not_product"),
        ("https://evil.example/products/city-mini", "unknown_host"),
    ],
)
def test_a_rejected_url_does_not_call_the_fetcher(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
    pasted: str,
    reason: str,
) -> None:
    headers, _registry = owner_with_list
    shop.body = product_js()

    resolved = _resolve(client, headers, pasted)
    assert resolved.json() == {"outcome": "unresolved", "reason": reason, "url": pasted}

    saved = _save(client, headers, pasted)
    assert saved.status_code == 422
    assert saved.json()["detail"]["code"] == reason
    assert shop.calls == []
    assert _items(client, headers) == []


def test_unresolved_echoes_the_trimmed_paste(
    client: TestClient,
    shop: _Shop,
    owner: dict[str, str],
) -> None:
    pasted = "  http://www.shilav.co.il/products/city-mini  "

    body = _resolve(client, owner, pasted).json()

    assert body["reason"] == "not_https"
    assert body["url"] == "http://www.shilav.co.il/products/city-mini"
    assert shop.calls == []


def test_a_failed_fetch_names_the_paste_not_the_js_url(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
) -> None:
    headers, _registry = owner_with_list
    shop.error = TimeoutError("slow")

    resolved = _resolve(client, headers, PASTE)
    assert resolved.json() == {"outcome": "unresolved", "reason": "fetch_failed", "url": PASTE}
    saved = _save(client, headers, PASTE)
    assert saved.status_code == 422
    assert saved.json()["detail"]["code"] == "fetch_failed"
    assert shop.calls == [FETCH, FETCH]
    assert _items(client, headers) == []


@pytest.mark.parametrize("body", [b"not-json", b"[]", b"{}"])
def test_a_bad_document_does_not_save(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
    body: bytes,
) -> None:
    headers, _registry = owner_with_list
    shop.body = body

    assert _resolve(client, headers, PASTE).json()["reason"] == "bad_document"
    saved = _save(client, headers, PASTE)
    assert saved.status_code == 422
    assert saved.json()["detail"]["code"] == "bad_document"
    assert _items(client, headers) == []


def test_the_client_cannot_supply_title_price_or_image(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
) -> None:
    headers, _registry = owner_with_list
    shop.body = product_js()
    extra = {"title": "לא", "priceAgorot": 100, "imageUrl": "https://evil.example/a.jpg"}

    assert _resolve(client, headers, PASTE, **extra).status_code == 422
    assert _save(client, headers, PASTE, **extra).status_code == 422
    assert shop.calls == []
    assert _items(client, headers) == []


def test_a_non_digit_variant_id_is_rejected_before_the_fetch(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
) -> None:
    headers, _registry = owner_with_list
    shop.body = colourways()

    response = client.post(
        LINK,
        headers=headers,
        json={"url": "https://www.shilav.co.il/products/city-mini", "variantId": "blue"},
    )

    assert response.status_code == 422
    assert shop.calls == []


def test_images_stay_on_the_shopify_cdn(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
) -> None:
    headers, _registry = owner_with_list
    shop.body = product_js(
        image="//cdn.shopify.com/s/files/parent.jpg?v=1",
        variants=[
            {
                "id": 55,
                "title": "אפור",
                "price": 449_000,
                "featured_image": {"src": "http://cdn.shopify.com/s/files/grey.jpg?v=3"},
            }
        ],
    )
    assert _resolve(client, headers, PASTE).json()["imageUrl"] == (
        "https://cdn.shopify.com/s/files/grey.jpg"
    )

    shop.body = product_js(
        image="//cdn.shopify.com/s/files/parent.jpg?v=1",
        variants=[
            {
                "id": 55,
                "title": "אפור",
                "price": 449_000,
                "featured_image": {"src": "https://evil.example/a.jpg"},
            }
        ],
    )
    assert _resolve(client, headers, PASTE).json()["imageUrl"] == (
        "https://cdn.shopify.com/s/files/parent.jpg"
    )

    shop.body = product_js(
        image="https://evil.example/a.jpg",
        variants=[
            {
                "id": 55,
                "title": "אפור",
                "price": 449_000,
                "featured_image": None,
            }
        ],
    )
    resolved = _resolve(client, headers, PASTE).json()
    assert resolved["outcome"] == "product"
    assert resolved["imageUrl"] is None
    saved = _save(client, headers, PASTE)
    assert saved.status_code == 201
    assert saved.json()["imageUrl"] is None

    long = "https://cdn.shopify.com/" + ("a" * 480)
    assert len(long) > 500
    shop.body = product_js(image=long)
    assert _resolve(client, headers, PASTE).json()["imageUrl"] is None
    assert _resolve(client, headers, PASTE).json()["outcome"] == "product"


def test_titles_and_a_null_category_still_resolve(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
) -> None:
    headers, _registry = owner_with_list
    raw = "הזמנה מוקדמת - עגלת תינוק משולבת / אפור"
    shop.body = product_js(title=raw)
    body = _resolve(client, headers, PASTE).json()
    assert body["title"] == "עגלת תינוק משולבת"
    assert body["sourceTitle"] == raw
    assert body["category"] == "mobility"

    shop.body = product_js(title="עגלת תינוק - מבצע")
    shortened = _resolve(client, headers, PASTE).json()
    assert shortened["title"] == "עגלת תינוק"
    assert shortened["sourceTitle"] is None

    shop.body = product_js(title="עגלת צעצועים מעץ")
    assert _resolve(client, headers, PASTE).json()["category"] == "toys"

    shop.body = product_js(title="פריט בדיקה כללי מאוד", product_type="", tags=[])
    plain = _resolve(client, headers, PASTE).json()
    assert plain["outcome"] == "product"
    assert plain["category"] is None
    saved = _save(client, headers, "https://www.shilav.co.il/products/plain-item")
    assert saved.status_code == 201
    assert saved.json()["category"] is None

    long = "עגלת תינוק " + " ".join(["ארוכה"] * 40)
    shop.body = product_js(title=long)
    cleaned = clean_title(long)
    stretched = _resolve(client, headers, PASTE).json()
    assert stretched["title"] == display_title(cleaned)[:200]
    assert len(stretched["title"]) <= 62
    assert stretched["sourceTitle"] == cleaned[:300]
    assert len(stretched["sourceTitle"]) <= 300


def test_an_active_item_with_the_same_buy_url_is_not_inserted_again(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
) -> None:
    headers, _registry = owner_with_list
    shop.body = product_js()
    assert _save(client, headers, PASTE).status_code == 201

    again = _save(
        client,
        headers,
        "https://shilav.co.il/en/products/city-mini?variant=55&fbclid=zzz",
    )
    assert again.status_code == 409
    assert again.json()["detail"]["code"] == "already_on_list"
    assert len(_items(client, headers)) == 1


def test_an_inactive_item_with_the_same_buy_url_does_not_block_a_new_row(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
    session: Session,
) -> None:
    headers, registry = owner_with_list
    add_product(session, registry, canonical_url=STORED, is_active=False, position=0)
    shop.body = product_js()

    saved = _save(client, headers, PASTE)

    assert saved.status_code == 201
    matches = [item for item in _items(client, headers) if item["canonicalUrl"] == STORED]
    assert len(matches) == 2
    assert any(item["isActive"] is False for item in matches)
    assert any(item["isActive"] is True for item in matches)


def test_two_colourways_are_two_rows_and_the_same_one_conflicts(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
) -> None:
    headers, _registry = owner_with_list
    shop.body = colourways()
    pasted = "https://www.shilav.co.il/products/city-mini"

    assert _save(client, headers, pasted, variant_id="1").status_code == 201
    assert _save(client, headers, pasted, variant_id="2").status_code == 201
    conflict = _save(client, headers, pasted, variant_id="1")
    assert conflict.status_code == 409
    assert conflict.json()["detail"]["code"] == "already_on_list"
    assert len(_items(client, headers)) == 2


def test_a_full_list_does_not_fetch(
    client: TestClient,
    shop: _Shop,
    owner_with_list: tuple[dict[str, str], Registry],
    session: Session,
) -> None:
    headers, registry = owner_with_list
    for index in range(MAX_ITEMS):
        add_product(
            session,
            registry,
            position=index,
            canonical_url=f"https://example.test/p/{index}",
        )
    shop.body = product_js()

    response = _save(client, headers, PASTE)

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "too_many_items"
    assert shop.calls == []


def test_save_without_a_registry_does_not_fetch(
    client: TestClient,
    shop: _Shop,
    owner: dict[str, str],
) -> None:
    shop.body = product_js()

    resolved = _resolve(client, owner, PASTE)
    assert resolved.status_code == 200
    assert resolved.json()["outcome"] == "product"

    saved = _save(client, owner, PASTE)
    assert saved.status_code == 404
    assert saved.json()["detail"]["code"] == "no_registry"
    assert shop.calls == [FETCH]


def test_resolve_product_json_uses_camel_case(
    client: TestClient,
    shop: _Shop,
    owner: dict[str, str],
) -> None:
    shop.body = product_js()

    body = _resolve(client, owner, PASTE).json()

    assert set(body) == {
        "outcome",
        "chainSlug",
        "chainNameHe",
        "externalId",
        "title",
        "sourceTitle",
        "category",
        "imageUrl",
        "priceAgorot",
        "canonicalUrl",
        "variantId",
    }
    assert "price_agorot" not in body


def test_the_fetcher_refuses_a_url_it_did_not_build(monkeypatch: pytest.MonkeyPatch) -> None:
    opened = False

    def boom(*_args: object, **_kwargs: object) -> None:
        nonlocal opened
        opened = True
        raise AssertionError("socket")

    monkeypatch.setattr(urllib.request, "build_opener", boom)
    for url in (
        "https://www.shilav.co.il/products/city-mini?utm=1",
        "https://evil.example/products/city-mini.js",
        "http://www.shilav.co.il/products/city-mini.js",
        "https://user:pass@www.shilav.co.il/products/city-mini.js",
        PASTE,
    ):
        opened = False
        with pytest.raises(product_resolve.FetchFailed):
            product_resolve.urllib_fetch(url)
        assert opened is False


def test_the_fetcher_is_one_capped_get(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: dict[str, Any] = {}

    class _Response:
        status = 200

        def read(self, size: int) -> bytes:
            seen["read"] = size
            return b'{"ok":true}'

        def __enter__(self) -> _Response:
            return self

        def __exit__(self, *_args: object) -> bool:
            return False

    class _Opener:
        def open(self, request: urllib.request.Request, timeout: float | None = None) -> _Response:
            seen["timeout"] = timeout
            seen["request"] = request
            seen["calls"] = seen.get("calls", 0) + 1
            return _Response()

    def build(*handlers: object) -> _Opener:
        seen["handlers"] = handlers
        return _Opener()

    monkeypatch.setattr(urllib.request, "build_opener", build)
    url = "https://www.shilav.co.il/products/city-mini.js"

    assert product_resolve.urllib_fetch(url) == b'{"ok":true}'
    request = seen["request"]
    assert seen["timeout"] == 8
    assert seen["read"] == 1_000_001
    assert seen["calls"] == 1
    assert request.full_url == url
    assert request.get_header("User-agent") == "il-wishlist-registry paste"
    assert request.get_header("Accept") == "application/json, text/javascript"
    assert product_resolve._NoRedirect in seen["handlers"]


def test_a_redirect_or_oversized_body_is_a_failed_fetch(monkeypatch: pytest.MonkeyPatch) -> None:
    class _Response:
        def __init__(self, status: int, body: bytes) -> None:
            self.status = status
            self._body = body

        def read(self, size: int) -> bytes:
            return self._body

        def __enter__(self) -> _Response:
            return self

        def __exit__(self, *_args: object) -> bool:
            return False

    def install(status: int, body: bytes, error: BaseException | None = None) -> None:
        class _Opener:
            def open(self, _request: object, timeout: float | None = None) -> _Response:
                if error is not None:
                    raise error
                return _Response(status, body)

        monkeypatch.setattr(urllib.request, "build_opener", lambda *_handlers: _Opener())

    url = "https://motsesim.co.il/products/pacifier.js"
    install(200, b"x" * 1_000_001)
    with pytest.raises(product_resolve.FetchFailed):
        product_resolve.urllib_fetch(url)

    install(302, b"go-away")
    with pytest.raises(product_resolve.FetchFailed):
        product_resolve.urllib_fetch(url)

    install(200, b"{}", error=urllib.error.URLError("timed out"))
    with pytest.raises(product_resolve.FetchFailed):
        product_resolve.urllib_fetch(url)


def test_redirect_statuses_are_not_followed() -> None:
    handler = product_resolve._NoRedirect()
    request = urllib.request.Request("https://www.shilav.co.il/products/city-mini.js")
    for code in (301, 302, 303, 307, 308):
        method = getattr(handler, f"http_error_{code}")
        with pytest.raises(product_resolve.FetchFailed):
            method(request, None, code, "redirect", {})
