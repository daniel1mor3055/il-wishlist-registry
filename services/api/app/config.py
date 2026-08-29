from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration is externalised from the start.

    Not because the POC needs it, but because the later cloud move should be a
    change of values rather than a change of code.
    """

    app_env: str = "local"
    log_level: str = "info"
    version: str = "0.1.0"

    # Default is the compose topology, so the container and its tests work
    # without an env file. Overridden by DATABASE_URL everywhere else.
    database_url: str = "postgresql+psycopg://registry:registry@db:5432/registry"

    # Magic links go out through Mailpit, which accepts anything and shows it
    # at :8025.
    smtp_host: str = "mailpit"
    smtp_port: int = 1025

    # Where a magic link points. The link lands on the web app, not here: the
    # browser talks to the web origin only.
    web_base_url: str = "http://localhost:3000"

    # Only needed if the browser ever talks to the API directly. It does not:
    # guest writes go through the web app's route handlers.
    cors_origins: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
