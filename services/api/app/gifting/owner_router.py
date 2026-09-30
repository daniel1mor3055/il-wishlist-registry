"""The couple's gift tracker (D52) and their corrections (D16)."""

from uuid import UUID

from fastapi import APIRouter, status

from app.deps import CurrentCouple, DbSessionDep
from app.gifting.owner_schemas import GiftTracker
from app.gifting.owner_service import gift_tracker, mark_gift_purchased, release_gift

router = APIRouter(prefix="/api/v1/me/registry/gifts", tags=["editor"])

_CORRECTION = {
    404: {"description": "No such gift on this couple's registry"},
    409: {"description": "The gift is no longer in a state this correction can move"},
}


@router.get(
    "",
    response_model=GiftTracker,
    responses={404: {"description": "Signed in, but no registry created yet"}},
)
def read_gifts(couple: CurrentCouple, session: DbSessionDep) -> GiftTracker:
    return gift_tracker(session, couple=couple)


@router.post(
    "/reservations/{reservation_id}/release",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=_CORRECTION,
)
def release(reservation_id: UUID, couple: CurrentCouple, session: DbSessionDep) -> None:
    """D16: hand the unit back, whoever holds it."""
    release_gift(session, couple=couple, reservation_id=reservation_id)


@router.post(
    "/reservations/{reservation_id}/purchased",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=_CORRECTION,
)
def mark_purchased(reservation_id: UUID, couple: CurrentCouple, session: DbSessionDep) -> None:
    """D16: record the gift as bought without a guest report."""
    mark_gift_purchased(session, couple=couple, reservation_id=reservation_id)
