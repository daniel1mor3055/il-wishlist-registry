"""API entry point.

Module layout, per the architect brief. Boundaries are drawn where a service
would later be carved out:

    registry  registries, items, ordering, slug, lifecycle
    catalog   chain catalogs and the resolver port, extracted first
    gifting   reservations, self-reported purchases, contribution ledger
    identity  couples and magic links

Cross-module traffic goes through a module's service layer only. No module
imports another's models, and no foreign key crosses into catalog - catalog
output is snapshotted onto the item instead.

At C5 `registry` serves both the public read and the couple's own writes,
`catalog` holds the harvested seed and its search, `gifting` owns the reserve and
money paths, and `identity` owns the login stub every `/me` route depends on.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.catalog.router import router as catalog_router
from app.config import get_settings
from app.gifting.router import router as gifting_router
from app.gifting.service import GiftingError
from app.health import router as health_router
from app.identity.router import router as identity_router
from app.identity.service import AuthError
from app.registry.owner_router import router as owner_router
from app.registry.owner_service import OwnerError
from app.registry.router import router as registry_router

settings = get_settings()

app = FastAPI(
    title="IL Registry API",
    version=settings.version,
    description=(
        "Coordination layer for Israeli baby gift registries. "
        "Holds no money and has no checkout (D11)."
    ),
    docs_url="/docs",
    openapi_url="/openapi.json",
)

if settings.cors_origin_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.exception_handler(GiftingError)
@app.exception_handler(OwnerError)
@app.exception_handler(AuthError)
def handle_coded_error(
    request: Request, exc: GiftingError | OwnerError | AuthError
) -> JSONResponse:
    """One shape for every refused write: `{"detail": {"code": ...}}`.

    Same envelope as `HTTPException` on the read path, so the web has one error
    parser and one Hebrew lookup table rather than four.
    """
    return JSONResponse(status_code=exc.status_code, content={"detail": {"code": exc.code}})


app.include_router(health_router)
app.include_router(registry_router)
app.include_router(gifting_router)
app.include_router(identity_router)
app.include_router(owner_router)
app.include_router(catalog_router)
