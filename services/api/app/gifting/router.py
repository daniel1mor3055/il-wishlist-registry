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
from app.gifting.schemas import (
    BlessingRequest,
    ContributeRequest,
    ContributionView,
    PaymentHandleView,
    ReportRequest,
    ReservationView,
)
from app.gifting.service import (
    add_blessing,
    contribute,
    release_reservation,
    report_reservation,
    reserve_item,
    reveal_payment_handle,
)

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


@router.post(
    "/registries/{slug}/items/{item_id}/contributions",
    response_model=ContributionView,
    status_code=status.HTTP_201_CREATED,
    responses={
        200: {"description": "Replay of an earlier identical request"},
        409: {"description": "Registry closed, or the item takes no money"},
    },
)
def create_contribution(
    slug: str,
    item_id: UUID,
    body: ContributeRequest,
    response: Response,
    guest_id: UUID = GUEST_ID,
    idempotency_key: str = IDEMPOTENCY_KEY,
    session: Session = Depends(get_session),
) -> ContributionView:
    view, created = contribute(
        session,
        slug=slug,
        item_id=item_id,
        guest_id=guest_id,
        idempotency_key=idempotency_key,
        amount_agorot=body.amount_agorot,
    )
    if not created:
        response.status_code = status.HTTP_200_OK
    return view


@router.post(
    "/registries/{slug}/blessings",
    status_code=status.HTTP_201_CREATED,
    responses={404: {"description": "No such gift for this guest"}},
)
def create_blessing(
    slug: str,
    body: BlessingRequest,
    guest_id: UUID = GUEST_ID,
    idempotency_key: str = IDEMPOTENCY_KEY,
    session: Session = Depends(get_session),
) -> None:
    """201 with an empty body, always. A blessing is private (D17)."""
    add_blessing(
        session,
        slug=slug,
        guest_id=guest_id,
        idempotency_key=idempotency_key,
        giver_name=body.giver_name,
        message=body.message,
        reservation_id=body.reservation_id,
        contribution_id=body.contribution_id,
    )


@router.get(
    "/registries/{slug}/payment-handle",
    response_model=PaymentHandleView,
    responses={404: {"description": "No registry, or the couple set no handle"}},
)
def payment_handle(
    slug: str,
    session: Session = Depends(get_session),
) -> PaymentHandleView:
    """The D13 reveal. No guest id: this is a read, and it identifies nobody."""
    return reveal_payment_handle(session, slug=slug)
