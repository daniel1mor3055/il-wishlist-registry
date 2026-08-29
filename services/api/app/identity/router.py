"""Login routes.

    POST   /auth/magic-link   ask for a link. Always 202.
    POST   /auth/session      trade the mailed token for a session token
    DELETE /auth/session      sign out

The session token arrives on every owner route as `X-Session-Token`. It is not a
cookie here: the browser never reaches this service, so the web app holds the
cookie and forwards the header, the same split the guest id uses (D31).
"""

from fastapi import APIRouter, Depends, Header, status
from sqlalchemy import exists, select
from sqlalchemy.orm import Session as DbSession

from app.db import get_session
from app.identity.schemas import MagicLinkRequest, SessionRequest, SessionView
from app.identity.service import consume_magic_link, request_magic_link, revoke_session
from app.registry.models import Registry

router = APIRouter(prefix="/api/v1/auth", tags=["identity"])

# No `from __future__ import annotations` in this module: with postponed
# annotations FastAPI resolves `-> None` to `NoneType`, which it then treats as a
# response model and refuses on a 204.

SESSION_TOKEN = Header(
    default=None,
    alias="X-Session-Token",
    description="Session token, held by the web app as an HttpOnly cookie",
)


@router.post("/magic-link", status_code=status.HTTP_202_ACCEPTED)
def magic_link(
    body: MagicLinkRequest,
    session: DbSession = Depends(get_session),
) -> dict[str, bool]:
    """202 for every syntactically valid address.

    Whether the address has an account, and whether the mail server accepted the
    message, are both invisible from out here. Answering anything else turns this
    endpoint into a way to ask "is this person a customer".
    """
    request_magic_link(session, email=body.email)
    return {"sent": True}


@router.post("/session", response_model=SessionView, status_code=status.HTTP_201_CREATED)
def create_session(
    body: SessionRequest,
    session: DbSession = Depends(get_session),
) -> SessionView:
    couple, token = consume_magic_link(session, token=body.token)
    has_registry = session.execute(
        select(exists().where(Registry.couple_id == couple.id))
    ).scalar_one()
    return SessionView(
        session_token=token,
        couple_id=str(couple.id),
        has_registry=has_registry,
    )


@router.delete("/session", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_token: str | None = SESSION_TOKEN,
    session: DbSession = Depends(get_session),
) -> None:
    revoke_session(session, token=session_token)
