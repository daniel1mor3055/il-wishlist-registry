"""Asking for a link, following it, and holding a session.

Deliberately dull. The interesting property is what the rest of the API is
allowed to know: `load_session(token) -> Couple`, and nothing else. Every owner
route depends on that one function, so replacing this stub with a real identity
provider is a change here and nowhere else (D23).
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DbSession

from app.config import get_settings
from app.identity.mail import send_magic_link
from app.identity.models import (
    LOGIN_TOKEN_TTL_MINUTES,
    SESSION_TTL_DAYS,
    Couple,
    LoginToken,
    Session,
)

#: 32 bytes of urandom, base64url. Guessing one is not a threat model.
TOKEN_BYTES = 32


class AuthError(Exception):
    """A login that cannot proceed, as a code the web turns into Hebrew."""

    def __init__(self, code: str, status_code: int) -> None:
        super().__init__(code)
        self.code = code
        self.status_code = status_code


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _normalise(email: str) -> str:
    return email.strip().lower()


def request_magic_link(session: DbSession, *, email: str) -> str:
    """Mint and mail a one-time link. Returns the token, for tests only.

    The caller answers `202` regardless, so this must not raise on an unknown
    address or on a dead mail server (see `mail.py`).
    """
    address = _normalise(email)
    token = secrets.token_urlsafe(TOKEN_BYTES)

    session.add(
        LoginToken(
            email=address,
            token_hash=_hash(token),
            expires_at=datetime.now(UTC) + timedelta(minutes=LOGIN_TOKEN_TTL_MINUTES),
        )
    )
    # Committed before the mail goes out. A link that arrives before its row is
    # visible is a link that does not work.
    session.commit()

    # Points at a route handler, not a page: following the link sets a cookie,
    # and only a handler may do that.
    base = get_settings().web_base_url.rstrip("/")
    send_magic_link(to=address, link=f"{base}/editor/session?token={quote(token)}")
    return token


def consume_magic_link(session: DbSession, *, token: str) -> tuple[Couple, str]:
    """Trade a mailed token for a session token. Returns the couple and the token.

    The token row is claimed with a conditional update rather than a read then a
    write, so two taps on the same link - the mail client prefetching it and the
    human then clicking it, which is the common case, not an exotic one - cannot
    both mint a session.
    """
    row = session.execute(
        select(LoginToken).where(LoginToken.token_hash == _hash(token)).with_for_update()
    ).scalar_one_or_none()

    # Compared in constant time even though the lookup above was by hash: the
    # habit is what matters, and the cost is nothing.
    if row is None or not hmac.compare_digest(row.token_hash, _hash(token)):
        raise AuthError("link_invalid", 401)
    if row.used_at is not None:
        raise AuthError("link_used", 401)
    if row.expires_at <= datetime.now(UTC):
        raise AuthError("link_expired", 401)

    row.used_at = datetime.now(UTC)
    couple = _couple_for(session, email=row.email)
    token_out = _open_session(session, couple=couple)
    session.commit()
    return couple, token_out


def _couple_for(session: DbSession, *, email: str) -> Couple:
    """The couple behind an address, created on first successful login.

    The display name is a placeholder until the create wizard asks for the real
    one; `registries.couple_names` is what a guest ever sees.
    """
    existing = session.execute(select(Couple).where(Couple.email == email)).scalar_one_or_none()
    if existing is not None:
        return existing

    couple = Couple(display_name=email.split("@")[0][:120], email=email)
    try:
        # Savepoint, not the whole transaction: a rollback here must not discard
        # the `used_at` stamp on the token that got us this far.
        with session.begin_nested():
            session.add(couple)
    except IntegrityError:
        # Two links for the same new address, followed at once.
        return session.execute(select(Couple).where(Couple.email == email)).scalar_one()
    return couple


def _open_session(session: DbSession, *, couple: Couple) -> str:
    token = secrets.token_urlsafe(TOKEN_BYTES)
    session.add(
        Session(
            couple_id=couple.id,
            token_hash=_hash(token),
            expires_at=datetime.now(UTC) + timedelta(days=SESSION_TTL_DAYS),
        )
    )
    session.flush()
    return token


def load_session(session: DbSession, *, token: str | None) -> Couple:
    """The couple behind a session token, or `401`.

    Every owner route goes through here, and it writes nothing: an authenticated
    page load stays a read. An expired or revoked session is indistinguishable
    from a forged one, on purpose.
    """
    if not token:
        raise AuthError("not_signed_in", 401)

    row = session.execute(
        select(Session).where(Session.token_hash == _hash(token))
    ).scalar_one_or_none()
    if row is None or not hmac.compare_digest(row.token_hash, _hash(token)):
        raise AuthError("not_signed_in", 401)
    if row.revoked_at is not None or row.expires_at <= datetime.now(UTC):
        raise AuthError("session_expired", 401)

    couple = session.get(Couple, row.couple_id)
    if couple is None:
        raise AuthError("not_signed_in", 401)
    return couple


def revoke_session(session: DbSession, *, token: str | None) -> None:
    """Sign out. Silent on an unknown token: the browser is discarding it anyway."""
    if not token:
        return
    row = session.execute(
        select(Session).where(Session.token_hash == _hash(token))
    ).scalar_one_or_none()
    if row is not None and row.revoked_at is None:
        row.revoked_at = datetime.now(UTC)
        session.commit()
