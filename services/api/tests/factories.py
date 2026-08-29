"""Minimal builders for the read tests.

Deliberately not the demo seed: a test that depends on the demo registries
breaks when the demo composition changes, which is exactly the kind of test
that gets deleted rather than fixed.
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime

from sqlalchemy.orm import Session

from app.identity.models import Couple
from app.registry.models import Registry, RegistryItem


def make_registry(
    session: Session,
    *,
    published: bool = True,
    closed: bool = False,
    slug: str | None = None,
) -> Registry:
    couple = Couple(display_name="נועה ואיתי", email=f"{uuid.uuid4()}@example.test")
    session.add(couple)
    session.flush()

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
        published_at=now if published else None,
        closed_at=now if closed else None,
        # Private (D13). Present precisely so the read tests can prove it never
        # leaves the database.
        payment_method="bit",
        payment_handle="050-123-4567",
        payment_display_name="נועה",
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
        "title": "מעטפה לנועה ואיתי",
        "subtitle": "כל סכום, ישירות אלינו בביט או בפייבוקס",
        "contributed_agorot": 180_000,
        "contributor_count": 9,
    }
    item = RegistryItem(registry_id=registry.id, **(defaults | overrides))
    session.add(item)
    session.flush()
    return item
