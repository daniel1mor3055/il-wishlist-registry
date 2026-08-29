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

At C2 `registry` serves the public read and `catalog` holds the harvested seed.
`gifting` arrives with the guest write loop in C3, `identity` with magic links
in C4; `identity` already owns the couples table so ownership does not have to
be migrated onto registries later.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
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

app.include_router(health_router)
app.include_router(registry_router)
