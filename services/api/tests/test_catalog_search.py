"""Catalog search, as the add-item screen uses it."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.factories import make_catalog_item, make_couple, sign_in

SEARCH = "/api/v1/catalog/search"


@pytest.fixture
def owner(session: Session) -> dict[str, str]:
    return {"X-Session-Token": sign_in(session, make_couple(session))}


def test_search_needs_a_session(client: TestClient) -> None:
    assert client.get(SEARCH).status_code == 401


def test_a_word_from_the_retailers_own_title_finds_the_product(
    client: TestClient, owner: dict[str, str], session: Session
) -> None:
    """The words a couple types often live in the long title, not the short one."""
    make_catalog_item(
        session,
        title="עגלת תינוק",
        source_title="עגלת תינוק דו-כיוונית אורגני אפור",
        price_agorot=129_000,
    )

    body = client.get(SEARCH, headers=owner, params={"q": "אורגני"}).json()

    assert any(result["title"] == "עגלת תינוק" for result in body["results"])


def test_results_are_ordered_by_price(
    client: TestClient, owner: dict[str, str], session: Session
) -> None:
    """A list that reshuffles between keystrokes reads as broken."""
    make_catalog_item(session, title="זהה יקר", price_agorot=90_000, category="toys")
    make_catalog_item(session, title="זהה זול", price_agorot=3_000, category="toys")

    first = client.get(SEARCH, headers=owner, params={"q": "זהה"}).json()["results"]
    again = client.get(SEARCH, headers=owner, params={"q": "זהה"}).json()["results"]

    assert [r["id"] for r in first] == [r["id"] for r in again]
    assert [r["priceAgorot"] for r in first] == sorted(r["priceAgorot"] for r in first)


def test_the_category_filter_narrows(
    client: TestClient, owner: dict[str, str], session: Session
) -> None:
    make_catalog_item(session, title="פילטר בדיקה", category="bath", price_agorot=5_000)
    make_catalog_item(session, title="פילטר בדיקה", category="toys", price_agorot=5_000)

    body = client.get(SEARCH, headers=owner, params={"q": "פילטר בדיקה", "category": "bath"}).json()

    assert body["total"] == 1
    assert body["results"][0]["category"] == "bath"


def test_the_total_is_the_match_count_not_the_page_size(
    client: TestClient, owner: dict[str, str], session: Session
) -> None:
    """So the screen can say "there are more" without lying about how many."""
    for index in range(4):
        make_catalog_item(session, title="ספירה בדיקה", price_agorot=1_000 + index)

    body = client.get(SEARCH, headers=owner, params={"q": "ספירה בדיקה", "limit": 2}).json()

    assert len(body["results"]) == 2
    assert body["total"] == 4


def test_an_empty_query_browses_rather_than_erroring(
    client: TestClient, owner: dict[str, str]
) -> None:
    body = client.get(SEARCH, headers=owner, params={"limit": 5}).json()

    assert len(body["results"]) <= 5
    assert body["total"] >= len(body["results"])


def test_a_query_that_matches_nothing_is_an_empty_list(
    client: TestClient, owner: dict[str, str]
) -> None:
    body = client.get(SEARCH, headers=owner, params={"q": "זזזזזזזז"}).json()

    assert body == {"results": [], "total": 0}
