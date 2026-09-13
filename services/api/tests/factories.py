"""Minimal builders for the read tests.

Deliberately not the demo seed: a test that depends on the demo registries
breaks when the demo composition changes, which is exactly the kind of test
that gets deleted rather than fixed.
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy.orm import Session

from app.catalog.models import CatalogItem, Chain
from app.identity.models import Couple
from app.identity.models import Session as LoginSession
from app.identity.service import _hash
from app.registry.models import Registry, RegistryItem


def make_couple(session: Session, *, email: str | None = None) -> Couple:
    couple = Couple(display_name="נועה ואיתי", email=email or f"{uuid.uuid4()}@example.test")
    session.add(couple)
    session.flush()
    return couple


def sign_in(session: Session, couple: Couple) -> str:
    """A session token for a couple, without going through the mail.

    The mail round trip has its own test. Every other owner test wants a signed-in
    couple, not a proof that logging in works.
    """
    token = f"test-session-{uuid.uuid4().hex}"
    session.add(
        LoginSession(
            couple_id=couple.id,
            token_hash=_hash(token),
            expires_at=datetime.now(UTC) + timedelta(days=1),
        )
    )
    session.flush()
    return token


def make_catalog_item(session: Session, **overrides: object) -> CatalogItem:
    chain = session.query(Chain).filter_by(slug="test-chain").one_or_none()
    if chain is None:
        chain = Chain(slug="test-chain", name_he="חנות בדיקה", site_url="https://example.test")
        session.add(chain)
        session.flush()

    defaults: dict[str, object] = {
        "external_id": uuid.uuid4().hex[:12],
        "title": "עגלת תינוק",
        "source_title": "עגלת תינוק דו-כיוונית אפור",
        "category": "mobility",
        "price_agorot": 129_000,
        "canonical_url": "https://example.test/p/1",
        "image_url": "https://example.test/p/1.jpg",
    }
    item = CatalogItem(chain_id=chain.id, **(defaults | overrides))
    session.add(item)
    session.flush()
    return item


def make_registry(
    session: Session,
    *,
    published: bool = True,
    closed: bool = False,
    slug: str | None = None,
    couple: Couple | None = None,
    baby_gender: str | None = None,
) -> Registry:
    couple = couple or make_couple(session)

    now = datetime.now(UTC)
    registry = Registry(
        couple_id=couple.id,
        slug=slug or f"test-{uuid.uuid4().hex[:12]}",
        couple_names="נועה ואיתי",
        story="יעל בדרך",
        cover_image_url="https://example.test/cover.jpg",
        city="תל אביב",
        due_date=date(2026, 2, 12),
        baby_name="יעל",
        baby_gender=baby_gender,
        published_at=now if published else None,
        closed_at=now if closed else None,
        # Private (D13, D49). Present precisely so the read tests can prove they
        # never leave the database.
        shipping_street="דיזנגוף 99",
        shipping_entrance="ב",
        shipping_floor="3",
        shipping_apartment="12",
        shipping_notes="קוד לבניין 4580",
        shipping_postal_code="6433228",
        payment_display_name="נועה",
        bit_handle="050-123-4567",
        paybox_handle=None,
    )
    session.add(registry)
    session.flush()
    return registry


def add_product(session: Session, registry: Registry, **overrides: object) -> RegistryItem:
    defaults: dict[str, object] = {
        "kind": "product",
        "position": 0,
        "title": "עגלת תינוק",
        "category": "mobility",
        "image_url": "https://example.test/stroller.jpg",
        "chain_slug": "shilav",
        "chain_name_he": "שילב",
        "external_id": "1234",
        "canonical_url": "https://example.test/p/1234",
        "price_agorot": 129_000,
    }
    item = RegistryItem(registry_id=registry.id, **(defaults | overrides))
    session.add(item)
    session.flush()
    return item


def add_envelope(session: Session, registry: Registry, **overrides: object) -> RegistryItem:
    defaults: dict[str, object] = {
        "kind": "fund",
        "position": 90,
        "title": "חיבוק 💛",
        "subtitle": "כל סכום, ישירות אלינו",
        "contributed_agorot": 180_000,
        "contributor_count": 9,
    }
    item = RegistryItem(registry_id=registry.id, **(defaults | overrides))
    session.add(item)
    session.flush()
    return item
