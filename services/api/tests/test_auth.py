"""The login stub.

It is a stub (D23), so these tests do not pretend to cover an identity system.
They cover the four things that would be embarrassing rather than expected: a
link that works twice, a link that never expires, a token stored in the clear,
and an endpoint that tells a stranger whether an address has an account.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.identity.models import Couple, LoginToken
from app.identity.service import _hash, request_magic_link
from tests.factories import make_couple, make_registry

AUTH = "/api/v1/auth"


@pytest.fixture(autouse=True)
def _no_smtp(monkeypatch: pytest.MonkeyPatch) -> None:
    """Nothing in this file needs Mailpit; the token comes back in Python."""
    monkeypatch.setattr("app.identity.service.send_magic_link", lambda **_: True)


def test_a_reserved_domain_is_refused(client: TestClient) -> None:
    """`EmailStr` blocks RFC 6761 names, so the fixtures use `example.com`.

    Worth a test rather than a comment: it is the reason every address in this
    file looks like a real one, and the reason a copy-pasted `.test` address in a
    future test would fail confusingly.
    """
    response = client.post(f"{AUTH}/magic-link", json={"email": "someone@example.test"})

    assert response.status_code == 422


def test_asking_for_a_link_says_nothing_about_the_address(client: TestClient) -> None:
    known = client.post(f"{AUTH}/magic-link", json={"email": "known@example.com"})
    unknown = client.post(f"{AUTH}/magic-link", json={"email": "nobody@example.com"})

    assert known.status_code == 202
    assert unknown.status_code == 202
    assert known.json() == unknown.json()


def test_a_dead_mail_server_is_also_a_202(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Otherwise the status code becomes the oracle the address check is not."""
    monkeypatch.setattr("app.identity.service.send_magic_link", lambda **_: False)

    response = client.post(f"{AUTH}/magic-link", json={"email": "someone@example.com"})

    assert response.status_code == 202


def test_asking_for_a_link_creates_no_account(client: TestClient, session: Session) -> None:
    client.post(f"{AUTH}/magic-link", json={"email": "stranger@example.com"})

    couples = (
        session.execute(select(Couple).where(Couple.email == "stranger@example.com"))
        .scalars()
        .all()
    )
    assert couples == []


def test_the_mailed_token_is_not_stored(client: TestClient, session: Session) -> None:
    token = request_magic_link(session, email="hash@example.com")

    row = session.execute(
        select(LoginToken).where(LoginToken.email == "hash@example.com")
    ).scalar_one()
    assert row.token_hash != token
    assert row.token_hash == _hash(token)


def test_following_the_link_signs_you_in_and_creates_the_couple(
    client: TestClient, session: Session
) -> None:
    token = request_magic_link(session, email="new@example.com")

    response = client.post(f"{AUTH}/session", json={"token": token})

    assert response.status_code == 201
    body = response.json()
    assert body["sessionToken"]
    assert body["hasRegistry"] is False
    assert session.execute(select(Couple).where(Couple.email == "new@example.com")).scalar_one()


def test_a_returning_couple_is_told_they_have_a_list(client: TestClient, session: Session) -> None:
    couple = make_couple(session, email="returning@example.com")
    make_registry(session, couple=couple)
    token = request_magic_link(session, email="returning@example.com")

    body = client.post(f"{AUTH}/session", json={"token": token}).json()

    assert body["hasRegistry"] is True
    assert body["coupleId"] == str(couple.id)


def test_a_link_works_once(client: TestClient, session: Session) -> None:
    """A mail client that prefetches the link must not spend it."""
    token = request_magic_link(session, email="once@example.com")

    first = client.post(f"{AUTH}/session", json={"token": token})
    second = client.post(f"{AUTH}/session", json={"token": token})

    assert first.status_code == 201
    assert second.status_code == 401
    assert second.json()["detail"]["code"] == "link_used"


def test_an_expired_link_is_refused(client: TestClient, session: Session) -> None:
    token = request_magic_link(session, email="stale@example.com")
    row = session.execute(
        select(LoginToken).where(LoginToken.token_hash == _hash(token))
    ).scalar_one()
    row.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    session.flush()

    response = client.post(f"{AUTH}/session", json={"token": token})

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "link_expired"


def test_a_made_up_link_is_refused(client: TestClient) -> None:
    response = client.post(f"{AUTH}/session", json={"token": "x" * 40})

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "link_invalid"


def test_signing_out_kills_the_session(client: TestClient, session: Session) -> None:
    token = request_magic_link(session, email="out@example.com")
    signed_in = client.post(f"{AUTH}/session", json={"token": token}).json()["sessionToken"]
    headers = {"X-Session-Token": signed_in}

    assert client.get("/api/v1/me/registry", headers=headers).status_code == 404

    assert client.delete(f"{AUTH}/session", headers=headers).status_code == 204
    after = client.get("/api/v1/me/registry", headers=headers)

    assert after.status_code == 401
    assert after.json()["detail"]["code"] == "session_expired"


def test_no_session_is_401_not_404(client: TestClient) -> None:
    """The owner routes must not become a way to probe for registries."""
    response = client.get("/api/v1/me/registry")

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "not_signed_in"
