"""Invariants that live in the database.

Each of these is a rule the application could enforce and eventually will, in a
service method someone can forget to call. They are asserted here because a
CHECK constraint is the version that still holds when the guest write loop in C3
races two requests against the same row.
"""

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from tests.factories import add_envelope, add_product, make_registry


def test_quantity_claimed_cannot_exceed_quantity_wanted(session: Session):
    """The oversell C3's conditional UPDATE is written to avoid."""
    registry = make_registry(session)
    with pytest.raises(IntegrityError, match="ck_item_quantity_claimed"):
        add_product(session, registry, quantity_wanted=2, quantity_claimed=3)


def test_a_registry_can_have_only_one_envelope(session: Session):
    """D28: one plain envelope, not a set of named funds."""
    registry = make_registry(session)
    add_envelope(session, registry)
    with pytest.raises(IntegrityError, match="uq_registry_items_one_fund"):
        add_envelope(session, registry, position=91)


def test_the_envelope_cannot_have_a_target(session: Session):
    """D28: collecting toward a specific sum is group gifting, and that lives
    on a product whose price is the target."""
    registry = make_registry(session)
    with pytest.raises(IntegrityError, match="ck_item_fund_no_target"):
        add_envelope(session, registry, target_agorot=300_000)


def test_group_gifting_only_applies_to_a_product(session: Session):
    registry = make_registry(session)
    with pytest.raises(IntegrityError, match="ck_item_group_product"):
        add_product(session, registry, kind="voucher", group_gift_enabled=True)


def test_claim_state_is_constrained(session: Session):
    registry = make_registry(session)
    with pytest.raises(IntegrityError, match="ck_item_claim_state"):
        add_product(session, registry, claim_state="shipped")
