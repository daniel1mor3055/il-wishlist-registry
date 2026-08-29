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
from sqlalchemy.orm import Session

# Imported so create_all sees every table on a database that has never been
# migrated. In the container Alembic has already made them.
from app.catalog import models as catalog_models  # noqa: F401
from app.db import Base, engine, get_session
from app.identity import models as identity_models  # noqa: F401
from app.main import app
from app.registry import models as registry_models  # noqa: F401


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
