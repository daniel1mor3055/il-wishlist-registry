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

    # Lands at C2. Declared now so the shape is fixed.
    database_url: str = ""

    # Lands at C4 (magic links via Mailpit).
    smtp_host: str = "mailpit"
    smtp_port: int = 1025

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
