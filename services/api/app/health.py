from fastapi import APIRouter
from pydantic import BaseModel

from app.config import get_settings

router = APIRouter(tags=["health"])


class Health(BaseModel):
    status: str
    version: str
    env: str


@router.get("/health", response_model=Health)
def health() -> Health:
    settings = get_settings()
    return Health(status="ok", version=settings.version, env=settings.app_env)
