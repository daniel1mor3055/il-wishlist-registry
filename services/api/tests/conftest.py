"""Test database wiring.

Each test runs inside a transaction that is rolled back afterwards, so tests
share the development database without leaving anything behind and without
needing a second Postgres. `join_transaction_mode="create_savepoint"` lets
service code commit: the commit becomes a savepoint release inside the outer
transaction the fixture owns.
"""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete
from sqlalchemy.orm import Session

# Imported so create_all sees every table on a database that has never been
# migrated. In the container Alembic has already made them.
from app.catalog import models as catalog_models  # noqa: F401
from app.db import Base, SessionFactory, engine, get_session
from app.gifting import models as gifting_models  # noqa: F401
from app.identity import models as identity_models  # noqa: F401
from app.identity.models import Couple
from app.main import app
from app.registry import models as registry_models  # noqa: F401
from app.registry.models import Registry
from tests.factories import make_registry


@pytest.fixture(scope="session", autouse=True)
def schema() -> None:
    Base.metadata.create_all(engine)


@pytest.fixture
def session() -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(session: Session) -> Generator[TestClient, None, None]:
    app.dependency_overrides[get_session] = lambda: session
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def committed_registry() -> Generator[Registry, None, None]:
    """A registry that is really committed, for the tests that need to race.

    The `session` fixture above hands every caller the same connection, which
    makes two overlapping transactions impossible - and two overlapping
    transactions are the entire point of the reserve path. So this one commits
    for real and deletes itself afterwards, through the couple, whose foreign
    keys cascade to the registry, its items and their reservations.
    """
    setup = SessionFactory()
    registry = make_registry(setup)
    setup.commit()

    yield registry

    setup.execute(delete(Couple).where(Couple.id == registry.couple_id))
    setup.commit()
    setup.close()
