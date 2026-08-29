"""The couple's own routes.

    GET    /me/registry                 the list as its owner sees it
    POST   /me/registry                 the create wizard
    PATCH  /me/registry                 names, story, city, shipping address, payment details
    POST   /me/registry/publish         make the link work
    POST   /me/registry/items/catalog   add from the seeded catalog
    POST   /me/registry/items/manual    add something the catalog lacks
    POST   /me/registry/envelope        add the envelope, if the wizard skipped it
    PATCH  /me/registry/items/{id}      item settings
    DELETE /me/registry/items/{id}      remove, or hide if a guest has acted

`/me` rather than `/registries/{slug}`: the path carries no identifier, so there
is no id to tamper with and no ownership comparison to forget. The session is
the only thing that says which registry this is.
"""

from uuid import UUID

from fastapi import APIRouter, status

from app.deps import CurrentCouple, DbSessionDep
from app.registry.owner_schemas import (
    AddCatalogItemRequest,
    AddManualItemRequest,
    CreateRegistryRequest,
    ItemPatch,
    OwnerItem,
    OwnerRegistry,
    RegistryPatch,
)
from app.registry.owner_service import (
    add_catalog_item,
    add_envelope,
    add_manual_item,
    create_registry,
    get_registry,
    patch_item,
    patch_registry,
    publish_registry,
    remove_item,
)

router = APIRouter(prefix="/api/v1/me", tags=["editor"])


@router.get(
    "/registry",
    response_model=OwnerRegistry,
    responses={404: {"description": "Signed in, but no registry created yet"}},
)
def read_registry(couple: CurrentCouple, session: DbSessionDep) -> OwnerRegistry:
    return get_registry(session, couple=couple)


@router.post(
    "/registry",
    response_model=OwnerRegistry,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"description": "This couple already has a registry"}},
)
def create(
    body: CreateRegistryRequest, couple: CurrentCouple, session: DbSessionDep
) -> OwnerRegistry:
    return create_registry(session, couple=couple, body=body)


@router.patch("/registry", response_model=OwnerRegistry)
def update_registry(
    body: RegistryPatch, couple: CurrentCouple, session: DbSessionDep
) -> OwnerRegistry:
    return patch_registry(session, couple=couple, body=body)


@router.post(
    "/registry/publish",
    response_model=OwnerRegistry,
    responses={409: {"description": "Nothing on the list to publish"}},
)
def publish(couple: CurrentCouple, session: DbSessionDep) -> OwnerRegistry:
    return publish_registry(session, couple=couple)


@router.post(
    "/registry/items/catalog",
    response_model=OwnerItem,
    status_code=status.HTTP_201_CREATED,
)
def add_from_catalog(
    body: AddCatalogItemRequest, couple: CurrentCouple, session: DbSessionDep
) -> OwnerItem:
    return add_catalog_item(session, couple=couple, body=body)


@router.post(
    "/registry/items/manual",
    response_model=OwnerItem,
    status_code=status.HTTP_201_CREATED,
)
def add_by_hand(
    body: AddManualItemRequest, couple: CurrentCouple, session: DbSessionDep
) -> OwnerItem:
    return add_manual_item(session, couple=couple, body=body)


@router.post(
    "/registry/envelope",
    response_model=OwnerItem,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"description": "This registry already has an envelope"}},
)
def add_the_envelope(couple: CurrentCouple, session: DbSessionDep) -> OwnerItem:
    return add_envelope(session, couple=couple)


@router.patch(
    "/registry/items/{item_id}",
    response_model=OwnerItem,
    responses={
        404: {"description": "No such item on this couple's registry"},
        409: {"description": "The change would undo something a guest already did"},
    },
)
def update_item(
    item_id: UUID, body: ItemPatch, couple: CurrentCouple, session: DbSessionDep
) -> OwnerItem:
    return patch_item(session, couple=couple, item_id=item_id, body=body)


@router.delete("/registry/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: UUID, couple: CurrentCouple, session: DbSessionDep) -> None:
    """204 whether the item was deleted or only hidden.

    Which one happened is visible in the next `GET /me/registry`, and the couple
    asked for the same thing either way: take it off the list.
    """
    remove_item(session, couple=couple, item_id=item_id)
