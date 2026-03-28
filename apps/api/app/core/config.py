from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    public_base_url: str = "http://localhost:8080"

    database_url: str
    redis_url: str = "redis://redis:6379/0"

    api_secret_key: str = "change-me"
    api_access_token_expire_minutes: int = 60
    api_refresh_token_expire_days: int = 30

    admin_email: str = "admin@local"
    admin_password: str = "admin12345"

    # Comma-separated origins, e.g. "https://otakunesia.com,https://www.otakunesia.com"
    # Use "*" only for development; production should list real origins for correct CORS + credentials.
    cors_allowed_origins: str = "*"


settings = Settings()  # type: ignore[arg-type]

