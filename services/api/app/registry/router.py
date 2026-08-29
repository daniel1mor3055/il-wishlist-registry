"""Public registry routes.

The API returns error *codes*; the web owns every Hebrew string, so nothing
here is ever shown to a person as written.

This read is anonymous by design. If it ever needed a cookie or a token, the
WhatsApp link preview would die, and that is the highest-traffic surface in the
product.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_session
from app.registry.schemas import PublicRegistry
from app.registry.service import get_public_registry

router = APIRouter(prefix="/api/v1/public", tags=["public"])


@router.get(
    "/registries/{slug}",
    response_model=PublicRegistry,
    responses={404: {"description": "No published registry at this slug"}},
)
def read_public_registry(slug: str, session: Session = Depends(get_session)) -> PublicRegistry:
    registry = get_public_registry(session, slug)
    if registry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "registry_not_found"},
        )
    return registry
