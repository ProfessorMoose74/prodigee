"""Auth service configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "development"
    project_id: str = "prodigee-488119"

    # JWT
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    parent_token_expiry_hours: int = 24
    child_token_expiry_hours: int = 4

    # COPPA
    coppa_enabled: bool = True
    child_session_limit_minutes_3_5: int = 30
    child_session_limit_minutes_6_8: int = 45
    child_session_limit_minutes_9_plus: int = 60

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    model_config = {"env_prefix": "AUTH_"}


settings = Settings()
