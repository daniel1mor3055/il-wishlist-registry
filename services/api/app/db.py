"""Engine, session and declarative base.

One engine per process, one session per request. `Session` is handed to routers
through `Depends(get_session)` so a test can substitute a transaction it rolls
back afterwards.

Money is `INTEGER` agorot everywhere (impl-consolidation): exact sums, and an
integer comparison inside the conditional update that C3's reserve path needs.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    # The reserve path in C3 is a conditional UPDATE ... RETURNING, so a
    # connection must never be handed over mid-transaction.
    pool_pre_ping=True,
    future=True,
)

SessionFactory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_session() -> Generator[Session, None, None]:
    session = SessionFactory()
    try:
        yield session
    finally:
        session.close()
