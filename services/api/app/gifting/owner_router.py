"""The couple's gift tracker (D52)."""

from fastapi import APIRouter

from app.deps import CurrentCouple, DbSessionDep
from app.gifting.owner_schemas import GiftTracker
from app.gifting.owner_service import gift_tracker

router = APIRouter(prefix="/api/v1/me/registry/gifts", tags=["editor"])


@router.get(
    "",
    response_model=GiftTracker,
    responses={404: {"description": "Signed in, but no registry created yet"}},
)
def read_gifts(couple: CurrentCouple, session: DbSessionDep) -> GiftTracker:
    return gift_tracker(session, couple=couple)
