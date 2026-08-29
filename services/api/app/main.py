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

At C3 `registry` serves the public read, `catalog` holds the harvested seed and
`gifting` owns the reserve path. `identity` arrives with magic links in C5; it
already owns the couples table so ownership does not have to be migrated onto
registries later.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.gifting.router import router as gifting_router
from app.gifting.service import GiftingError
from app.health import router as health_router
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
def handle_gifting_error(request: Request, exc: GiftingError) -> JSONResponse:
    """One shape for every failed guest write: `{"detail": {"code": ...}}`.

    Same envelope as `HTTPException` on the read path, so the web has one error
    parser and one Hebrew lookup table rather than two.
    """
    return JSONResponse(status_code=exc.status_code, content={"detail": {"code": exc.code}})


app.include_router(health_router)
app.include_router(registry_router)
app.include_router(gifting_router)
