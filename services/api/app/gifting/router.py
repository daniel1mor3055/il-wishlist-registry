"""Guest write routes.

Every route is scoped to a registry slug, including the two that act on a
reservation the client already holds an id for. The architect brief had those at
`/public/reservations/{id}`; carrying the slug costs a path segment and buys two
things - the per-registry guest cookie stays derivable from the URL the browser
is on, and the registry's own state gates the write.

Two headers carry what the guest is, and neither is a login:

    X-Guest-Id       the per-registry cookie the web app mints on first write
    Idempotency-Key  one per user action, so a double tap or a back-button
                     re-POST cannot become a second hold

Errors are codes. `GiftingError` is translated centrally in `main`, so no
Hebrew, and no leaking of which of "wrong id" or "not yours" happened.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Header, Response, status
from sqlalchemy.orm import Session

from app.db import get_session
from app.gifting.schemas import ReportRequest, ReservationView
from app.gifting.service import release_reservation, report_reservation, reserve_item

router = APIRouter(prefix="/api/v1/public", tags=["gifting"])

GUEST_ID = Header(alias="X-Guest-Id", description="Per-registry guest cookie value")
IDEMPOTENCY_KEY = Header(alias="Idempotency-Key", max_length=64, min_length=8)


@router.post(
    "/registries/{slug}/items/{item_id}/reservations",
    response_model=ReservationView,
    status_code=status.HTTP_201_CREATED,
    responses={
        200: {"description": "Replay of an earlier identical request"},
        409: {"description": "Race lost, registry closed, or item not reservable"},
    },
)
def create_reservation(
    slug: str,
    item_id: UUID,
    response: Response,
    guest_id: UUID = GUEST_ID,
    idempotency_key: str = IDEMPOTENCY_KEY,
    session: Session = Depends(get_session),
) -> ReservationView:
    view, created = reserve_item(
        session,
        slug=slug,
        item_id=item_id,
        guest_id=guest_id,
        idempotency_key=idempotency_key,
    )
    if not created:
        response.status_code = status.HTTP_200_OK
    return view


@router.post(
    "/registries/{slug}/reservations/{reservation_id}/report",
    response_model=ReservationView,
    responses={404: {"description": "No such reservation for this guest"}},
)
def report(
    slug: str,
    reservation_id: UUID,
    body: ReportRequest,
    guest_id: UUID = GUEST_ID,
    session: Session = Depends(get_session),
) -> ReservationView:
    return report_reservation(
        session,
        slug=slug,
        reservation_id=reservation_id,
        guest_id=guest_id,
        purchased=body.purchased,
        giver_name=body.giver_name,
    )


@router.delete(
    "/registries/{slug}/reservations/{reservation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"description": "No such reservation for this guest"}},
)
def release(
    slug: str,
    reservation_id: UUID,
    guest_id: UUID = GUEST_ID,
    session: Session = Depends(get_session),
) -> None:
    release_reservation(session, slug=slug, reservation_id=reservation_id, guest_id=guest_id)
