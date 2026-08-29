"""Shared FastAPI dependencies.

`CurrentCouple` is the only way any route learns who is signed in. It is one
line so that it is one line to replace: swapping this login stub for a real
identity provider (D23) means changing what happens inside `load_session`, and
nothing about the routes that depend on it.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.db import get_session
from app.identity.models import Couple
from app.identity.service import load_session

DbSessionDep = Annotated[Session, Depends(get_session)]

SessionTokenDep = Annotated[
    str | None,
    Header(
        alias="X-Session-Token",
        description="Session token, held by the web app as an HttpOnly cookie",
    ),
]


def current_couple(session: DbSessionDep, token: SessionTokenDep = None) -> Couple:
    return load_session(session, token=token)


CurrentCouple = Annotated[Couple, Depends(current_couple)]
