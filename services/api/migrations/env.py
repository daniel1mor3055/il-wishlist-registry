"""Alembic environment.

Every model module is imported here rather than in the migration files, because
`--autogenerate` compares against `Base.metadata` and silently sees an empty
schema for anything that was never imported.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# The model modules are imported for their side effect of registering tables on
# Base.metadata; autogenerate sees an empty schema without them.
from app.catalog import models as catalog_models  # noqa: F401
from app.config import get_settings
from app.db import Base
from app.gifting import models as gifting_models  # noqa: F401
from app.identity import models as identity_models  # noqa: F401
from app.registry import models as registry_models  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", get_settings().database_url)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
