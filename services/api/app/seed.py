"""Idempotent seed: the harvested catalog, then the demo registries.

Run it as often as you like. Chains and catalog items are keyed on their
natural keys - chain slug, and (chain, external_id) - so a re-run updates a
product's price or title instead of inserting a second copy of it.

Demo registries are different, and deliberately so: each one is dropped and
rebuilt on every run, because the registry composition in
`tools/build_demo_registries.mjs` is the authority for what a demo registry
contains. That means a re-seed discards guest activity against a demo
registry, which is the right trade for data whose purpose is to be a fixture.

The couples survive, keyed on the address that signs in to each list. Asking for
a magic link as `noa.itai@example.com` therefore lands in the editor on the main
demo registry, with ten items already on it.

Usage (from the repo root):
    npm run seed
    docker compose exec api python -m app.seed --catalog-only
"""

from __future__ import annotations

import argparse
import json
import uuid
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.catalog.models import CatalogItem, Chain
from app.db import SessionFactory
from app.gifting.models import Blessing, Contribution, Reservation
from app.identity.models import Couple
from app.registry.models import Registry, RegistryItem

SEED_DIR = Path(__file__).resolve().parent.parent / "seed"
CATALOG_PATH = SEED_DIR / "catalog_snapshot.json"
DEMO_PATH = SEED_DIR / "demo_registries.json"

#: Fields copied straight from the demo JSON onto a registry item. Listed rather
#: than splatted, so a new column in the JSON cannot silently become a write.
ITEM_FIELDS = (
    "position",
    "kind",
    "title",
    "source_title",
    "note",
    "category",
    "image_url",
    "subtitle",
    "caption",
    "chain_slug",
    "chain_name_he",
    "external_id",
    "canonical_url",
    "price_agorot",
    "quantity_wanted",
    "quantity_claimed",
    "claim_state",
    "group_gift_enabled",
    "target_agorot",
    "contributed_agorot",
    "contributor_count",
)


def load(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SystemExit(
            f"Missing {path.name}. Run `npm run demo-data` (and `npm run harvest` "
            "if the catalog snapshot is gone too)."
        )
    return json.loads(path.read_text(encoding="utf-8"))


def seed_catalog(session: Session) -> tuple[int, int]:
    snapshot = load(CATALOG_PATH)

    chains: dict[str, Chain] = {
        chain.slug: chain for chain in session.execute(select(Chain)).scalars()
    }
    for row in snapshot["chains"]:
        chain = chains.get(row["slug"])
        if chain is None:
            chain = Chain(slug=row["slug"], name_he=row["name_he"], site_url=row["site_url"])
            session.add(chain)
            chains[row["slug"]] = chain
        else:
            chain.name_he = row["name_he"]
            chain.site_url = row["site_url"]
    session.flush()

    existing: dict[tuple[str, str], CatalogItem] = {}
    for item in session.execute(select(CatalogItem)).scalars():
        existing[(str(item.chain_id), item.external_id)] = item

    written = 0
    for row in snapshot["items"]:
        chain = chains[row["chain_slug"]]
        key = (str(chain.id), row["external_id"])
        item = existing.get(key)
        if item is None:
            item = CatalogItem(chain_id=chain.id, external_id=row["external_id"])
            session.add(item)
        item.title = row["title"]
        item.source_title = row.get("source_title")
        item.category = row["category"]
        item.price_agorot = row["price_agorot"]
        item.compare_at_agorot = row.get("compare_at_agorot")
        item.canonical_url = row["canonical_url"]
        item.image_url = row["image_url"]
        item.vendor = row.get("vendor")
        item.sku = row.get("sku")
        written += 1

    return len(snapshot["chains"]), written


def _owner(session: Session, *, email: str, display_name: str) -> Couple:
    """One couple per demo registry, keyed on the address that signs in to it.

    The main demo registry keeps `noa.itai@example.com`, so asking for a magic
    link with that address lands on a list that already has things on it. That is
    the only reason the seed knows about couples at all.
    """
    couple = session.execute(select(Couple).where(Couple.email == email)).scalar_one_or_none()
    if couple is None:
        couple = Couple(display_name=display_name, email=email)
        session.add(couple)
        session.flush()
    return couple


def _demo_guest_id(slug: str, guest: str) -> uuid.UUID:
    # uuid5 so a demo guest key stays the same person on every re-seed.
    return uuid.uuid5(uuid.NAMESPACE_URL, f"il-registry-demo:{slug}:{guest}")


def _ledger_at(now: datetime, row: dict[str, Any]) -> datetime:
    return now - timedelta(days=row["days_ago"], hours=row.get("hour", 0))


def _seed_ledger(
    session: Session,
    registry: Registry,
    items_by_position: dict[int, RegistryItem],
    row: dict[str, Any],
    now: datetime,
) -> None:
    slug = row["slug"]
    reservation_index = 0
    contribution_index = 0
    for item_row in row["items"]:
        item = items_by_position[item_row["position"]]
        for reservation in item_row.get("reservations") or []:
            created_at = _ledger_at(now, reservation)
            purchased = reservation["state"] == "purchased"
            session.add(
                Reservation(
                    registry_id=registry.id,
                    item_id=item.id,
                    guest_id=_demo_guest_id(slug, reservation["guest"]),
                    state=reservation["state"],
                    giver_name=reservation.get("giver_name"),
                    idempotency_key=f"seed:{slug}:r:{reservation_index}",
                    created_at=created_at,
                    reported_at=created_at + timedelta(hours=4) if purchased else None,
                )
            )
            reservation_index += 1
        for contribution in item_row.get("contributions") or []:
            session.add(
                Contribution(
                    registry_id=registry.id,
                    item_id=item.id,
                    guest_id=_demo_guest_id(slug, contribution["guest"]),
                    amount_agorot=contribution["amount_agorot"],
                    giver_name=contribution.get("giver_name"),
                    idempotency_key=f"seed:{slug}:c:{contribution_index}",
                    created_at=_ledger_at(now, contribution),
                )
            )
            contribution_index += 1

    for index, blessing in enumerate(row.get("blessings") or []):
        position = blessing.get("item_position")
        session.add(
            Blessing(
                registry_id=registry.id,
                item_id=None if position is None else items_by_position[position].id,
                guest_id=_demo_guest_id(slug, blessing["guest"]),
                giver_name=blessing.get("giver_name"),
                message=blessing.get("message"),
                idempotency_key=f"seed:{slug}:b:{index}",
                created_at=_ledger_at(now, blessing),
            )
        )


def seed_demo_registries(session: Session) -> int:
    demo = load(DEMO_PATH)
    display_name = demo["couple"]["display_name"]
    now = datetime.now(UTC)

    # The whole demo set goes first, then gets rebuilt. Dropped rather than
    # updated in place because the demo JSON is the authority for what a fixture
    # contains, and because a registry now belongs to exactly one couple: moving
    # five lists onto five owners in place would mean shuffling rows past a
    # unique constraint to reach the same end state. The cascade takes the items
    # and any guest activity with them, which is what the docstring promises.
    slugs = [row["slug"] for row in demo["registries"]]
    session.execute(delete(Registry).where(Registry.slug.in_(slugs)))
    session.flush()

    for row in demo["registries"]:
        couple = _owner(session, email=row["owner_email"], display_name=display_name)
        registry = Registry(
            slug=row["slug"],
            couple_id=couple.id,
            couple_names=row["couple_names"],
            story=row["story"],
            cover_image_url=row["cover_image_url"],
            city=row["city"],
            shipping_street=row.get("shipping_street"),
            shipping_entrance=row.get("shipping_entrance"),
            shipping_floor=row.get("shipping_floor"),
            shipping_apartment=row.get("shipping_apartment"),
            shipping_notes=row.get("shipping_notes"),
            shipping_postal_code=row.get("shipping_postal_code"),
            due_date=date.fromisoformat(row["due_date"]) if row["due_date"] else None,
            baby_name=row["baby_name"],
            published_at=now if row["published"] else None,
            closed_at=now if row["closed"] else None,
            bit_handle=row.get("bit_handle"),
            paybox_handle=row.get("paybox_handle"),
            payment_display_name=row["payment_display_name"],
        )
        session.add(registry)
        session.flush()

        items_by_position: dict[int, RegistryItem] = {}
        for item_row in row["items"]:
            item = RegistryItem(
                registry_id=registry.id,
                **{field: item_row[field] for field in ITEM_FIELDS},
            )
            session.add(item)
            items_by_position[item_row["position"]] = item
        session.flush()
        _seed_ledger(session, registry, items_by_position, row, now)

    return len(demo["registries"])


#: Every run of `tools/shoot.mjs` signs a brand-new couple in to photograph the
#: create wizard, and leaves a real registry behind. This is where they go.
DRIVER_EMAIL_PATTERN = "c5-%@example.com"


def clear_driver_couples(session: Session) -> int:
    """Remove the couples the screenshot driver created. Cascades to their lists."""
    result = session.execute(delete(Couple).where(Couple.email.like(DRIVER_EMAIL_PATTERN)))
    return result.rowcount or 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog-only", action="store_true", help="skip the demo registries")
    args = parser.parse_args()

    with SessionFactory() as session:
        chains, catalog_items = seed_catalog(session)
        print(f"catalog: {chains} chains, {catalog_items} items")

        if not args.catalog_only:
            registries = seed_demo_registries(session)
            print(f"demo: {registries} registries")
            dropped = clear_driver_couples(session)
            if dropped:
                print(f"cleaned: {dropped} registries left by the screenshot driver")

        session.commit()

    print("seed ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
