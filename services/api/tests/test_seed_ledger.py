from __future__ import annotations

from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.gifting.models import OCCUPYING_STATES, Blessing, Contribution, Reservation
from app.registry.models import Registry, RegistryItem
from app.seed import DEMO_PATH, load, seed_demo_registries

MAIN_SLUG = "noa-itai-k4m2xq8vp3wt"
CLOSED_SLUG = "closed-demo"
QUIET_SLUGS = ("empty-registry-demo", "single-item-demo")
STROLLER_POSITION = 0
CRIB_POSITION = 2
BOTTLES_POSITION = 3
MAT_POSITION = 7


def test_the_seeded_ledger_reconciles_with_the_counters(session: Session):
    """D57: demo item counters reconcile with the seeded ledger."""
    seed_demo_registries(session)
    slugs = [row["slug"] for row in load(DEMO_PATH)["registries"]]
    registries = list(
        session.execute(select(Registry).where(Registry.slug.in_(slugs))).scalars()
    )
    assert {registry.slug for registry in registries} == set(slugs)

    registry_ids = [registry.id for registry in registries]
    items = list(
        session.execute(
            select(RegistryItem).where(RegistryItem.registry_id.in_(registry_ids))
        ).scalars()
    )
    reservations = list(
        session.execute(
            select(Reservation).where(Reservation.registry_id.in_(registry_ids))
        ).scalars()
    )
    contributions = list(
        session.execute(
            select(Contribution).where(Contribution.registry_id.in_(registry_ids))
        ).scalars()
    )
    blessings = list(
        session.execute(
            select(Blessing).where(Blessing.registry_id.in_(registry_ids))
        ).scalars()
    )
    reservations_by_item = defaultdict(list)
    for reservation in reservations:
        reservations_by_item[reservation.item_id].append(reservation)
    contributions_by_item = defaultdict(list)
    for contribution in contributions:
        contributions_by_item[contribution.item_id].append(contribution)

    for item in items:
        rows = reservations_by_item[item.id]
        occupying = [row for row in rows if row.state in OCCUPYING_STATES]
        held = [row for row in rows if row.state == "held"]
        amounts = [row.amount_agorot for row in contributions_by_item[item.id]]

        assert item.quantity_claimed == len(occupying)
        assert item.contributed_agorot == sum(amounts)
        assert item.contributor_count == len(amounts)
        if item.quantity_claimed < item.quantity_wanted:
            assert item.claim_state == "available"
        elif held:
            assert item.claim_state == "reserved"
        else:
            assert item.claim_state == "purchased"

    for reservation in reservations:
        if reservation.state == "held":
            assert reservation.giver_name is None
    held_guests = {
        (row.registry_id, row.guest_id) for row in reservations if row.state == "held"
    }
    for blessing in blessings:
        assert (blessing.registry_id, blessing.guest_id) not in held_guests

    by_slug = {registry.slug: registry for registry in registries}
    for slug in QUIET_SLUGS:
        registry = by_slug[slug]
        assert not any(row.registry_id == registry.id for row in reservations)
        assert not any(row.registry_id == registry.id for row in contributions)
        assert not any(row.registry_id == registry.id for row in blessings)

    for slug in (MAIN_SLUG, CLOSED_SLUG):
        _assert_pinned_activity(
            by_slug[slug], items, reservations_by_item, contributions_by_item
        )

    for registry in registries:
        stamps = []
        for row in reservations:
            if row.registry_id != registry.id:
                continue
            stamps.append(row.created_at)
            if row.state == "purchased":
                stamps.append(row.reported_at)
        stamps.extend(
            row.created_at for row in contributions if row.registry_id == registry.id
        )
        stamps.extend(row.created_at for row in blessings if row.registry_id == registry.id)
        assert len(stamps) == len(set(stamps))

    main = by_slug[MAIN_SLUG]
    assert any(row.state == "held" and row.registry_id == main.id for row in reservations)
    standalone = session.execute(
        select(Blessing.id).where(
            Blessing.registry_id == main.id,
            Blessing.item_id.is_(None),
            Blessing.message.is_not(None),
        )
    ).first()
    assert standalone is not None


def _assert_pinned_activity(registry, items, reservations_by_item, contributions_by_item):
    by_position = {
        item.position: item for item in items if item.registry_id == registry.id
    }
    stroller = by_position[STROLLER_POSITION]
    crib = by_position[CRIB_POSITION]
    bottles = by_position[BOTTLES_POSITION]
    mat = by_position[MAT_POSITION]
    fund = next(item for item in items if item.registry_id == registry.id and item.kind == "fund")

    stroller_amounts = [row.amount_agorot for row in contributions_by_item[stroller.id]]
    assert stroller.group_gift_enabled
    assert (stroller.quantity_claimed, stroller.quantity_wanted) == (0, 1)
    assert stroller.claim_state == "available"
    assert len(stroller_amounts) == stroller.contributor_count == 6
    assert sum(stroller_amounts) == stroller.contributed_agorot

    assert (crib.quantity_claimed, crib.quantity_wanted) == (1, 1)
    assert crib.claim_state == "purchased"

    assert (bottles.quantity_claimed, bottles.quantity_wanted) == (2, 4)
    held_bottles = [
        row for row in reservations_by_item[bottles.id] if row.state == "held"
    ]
    assert len(held_bottles) == 1

    assert (mat.quantity_claimed, mat.quantity_wanted) == (1, 1)
    assert mat.claim_state == "reserved"

    fund_amounts = [row.amount_agorot for row in contributions_by_item[fund.id]]
    assert fund.contributed_agorot == 180_000
    assert len(fund_amounts) == fund.contributor_count == 9
    assert sum(fund_amounts) == 180_000
