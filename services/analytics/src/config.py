"""Analytics service configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "development"
    project_id: str = "prodigee-488119"

    # JWT (shared secret with auth service for local token decoding)
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    model_config = {"env_prefix": "ANALYTICS_"}


settings = Settings()
