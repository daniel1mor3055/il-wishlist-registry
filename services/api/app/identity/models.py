"""Couples, and the stub that lets one log in.

**This is not an identity design (D23).** It is the smallest thing that lets a
couple come back to their own list tomorrow: a one-time token mailed to an
address, exchanged for an opaque session token. There is no password, no
verification of who owns the mailbox beyond receiving the mail, no rate
limiting, no lockout, no refresh, and no second factor. Replacing all of it with
a real identity provider is expected, and nothing here should make that harder -
which is why the only thing the rest of the API knows about a session is
`load_session(token) -> Couple`.

Two things are still done properly, because getting them wrong would be a habit
rather than a shortcut: tokens are stored as hashes, so a database read cannot
be replayed as a login, and both tokens are compared in constant time.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

#: A magic link is useful for one sitting, not one day. Long enough to switch to
#: a mail app and back, short enough that a forwarded mail is not an account.
LOGIN_TOKEN_TTL_MINUTES = 20

#: A session lasts as long as building a registry plausibly does.
SESSION_TTL_DAYS = 30


class Couple(Base):
    __tablename__ = "couples"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(255), unique=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LoginToken(Base):
    """One mailed link. Consumed once, then dead.

    Holds the email rather than a couple id: an address that has never been seen
    gets a token too, and the couple row is created when the link is actually
    followed. Asking for a link therefore creates nothing, so mailing a stranger
    cannot fill the table with half-registered people.
    """

    __tablename__ = "login_tokens"
    __table_args__ = (Index("ix_login_tokens_email", "email"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255))
    #: sha256 of the token that was mailed. The token itself is never stored.
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Session(Base):
    """What the couple's browser holds after following the link.

    The web app keeps the token in an `HttpOnly` cookie on its own origin and
    forwards it as a header, the same split the guest cookie uses (D31): the
    browser never talks to the API, so the API never sets a cookie.
    """

    __tablename__ = "sessions"
    __table_args__ = (Index("ix_sessions_couple", "couple_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    couple_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("couples.id", ondelete="CASCADE")
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # No `last_seen_at`. Stamping one would turn every authenticated page load
    # into a write, and nothing needs it.
