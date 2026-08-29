"""Request and response models for the login stub."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

WireModel = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class MagicLinkRequest(BaseModel):
    model_config = WireModel

    email: EmailStr


class SessionRequest(BaseModel):
    model_config = WireModel

    token: str = Field(min_length=16, max_length=200)


class SessionView(BaseModel):
    """What the web app needs after a successful login.

    Carries the session token in the body rather than a `Set-Cookie`: the cookie
    belongs to the web origin, and the web app sets it (D31). Nothing about the
    couple beyond the id - the editor reads the registry for anything else.
    """

    model_config = WireModel

    session_token: str
    couple_id: str
    #: False right after a first login, which is what sends the browser to the
    #: create wizard instead of the editor.
    has_registry: bool
